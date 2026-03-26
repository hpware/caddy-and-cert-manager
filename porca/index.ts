import { $ } from "bun";
import { mkdir, unlink } from "node:fs/promises";
if (!process.env.PROTECTION_PROXY_TOKEN) {
  console.error(
    "PROTECTION_PROXY_TOKEN is not set. Refusing to start with a default token.",
  );
  process.exit(1);
}
const guestResourcesUrl = process.env.NEXT_PUBLIC_GUEST_RESOURCES_URL;
if (!guestResourcesUrl) {
  console.error(
    "NEXT_PUBLIC_GUEST_RESOURCES_URL is not set. Required for CRL distribution points.",
  );
  process.exit(1);
}
console.log("Protection Proxy on :4000");
const protectionProxyToken = process.env.PROTECTION_PROXY_TOKEN;
Bun.serve({
  port: 4000,
  routes: {
    "/api/sign": {
      POST: async (req) => {
        const body = (await req.json()) as {
          csr?: string;
          days?: number;
          proxyToken?: string;
        };
        if (!body.proxyToken || body.proxyToken !== protectionProxyToken) {
          return Response.json(
            {
              error:
                "Incorrect Proxy Token, please check your server configuration.",
            },
            { status: 401 },
          );
        }
        const { csr, days } = body;
        if (!csr || !days) {
          return Response.json(
            {
              error: "Missing csr or days",
              pb: null,
              itemCN: null,
            },
            { status: 400 },
          );
        }
        try {
          const result = await generateCertificate(csr, Number(days));
          return Response.json({ ...result, error: null });
        } catch (e) {
          return Response.json(
            { error: String(e), pb: null, itemCN: null },
            { status: 500 },
          );
        }
      },
    },
    // TBD
    "/api/revoke": {
      POST: async (req) => {
        const body = (await req.json()) as {
          proxyToken?: string;
          cert?: string;
        };
        if (!body.proxyToken || body.proxyToken !== protectionProxyToken) {
          return Response.json(
            {
              error:
                "Incorrect Proxy Token, please check your server configuration.",
            },
            { status: 401 },
          );
        }
        if (!body.cert) {
          return Response.json({ error: "Missing revokeID" }, { status: 400 });
        }
        try {
          await revokeCertificate(body.cert);
          return Response.json({ error: null, revoked: true });
        } catch (e) {
          return Response.json(
            { error: String(e), revoked: false },
            { status: 500 },
          );
        }
      },
    },
    "/master.crl.pem": {
      GET: async () => {
        const file = Bun.file("./certs/master.crl.pem");
        if (!(await file.exists())) {
          return new Response("CRL not found", { status: 404 });
        }
        return new Response(file, {
          headers: { "Content-Type": "application/x-pem-file" },
        });
      },
    },
    "/ok": new Response("ok"),
  },
});

async function spawnWithInput(
  cmd: string,
  args: string[],
  input: string,
): Promise<{ stdout: string; stderr: string }> {
  const proc = Bun.spawn([cmd, ...args], {
    stdin: new Blob([input]),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Process exited with code ${exitCode}: ${stderr}`);
  }
  return { stdout, stderr };
}

export async function generateCertificate(
  csrText: string,
  generateDays: number,
  saveUUID: string = crypto.randomUUID(),
) {
  const tempSavePath = `/tmp/${saveUUID}.cnf`;
  try {
    const { stdout: getSAN } = await spawnWithInput(
      "openssl",
      ["req", "-noout", "-text", "-in", "-"],
      csrText,
    );
    const sanMatch = getSAN.match(/Subject Alternative Name:.*\n\s*(.*)/);
    const extractedSans = sanMatch?.[1]?.trim() ?? "";
    const cMatch =
      getSAN.match(/Subject:.*?C\s?=\s?([^\s,+/]+).*/)?.[1]?.trim() ??
      (process.env.DEFAULT_COUNTRY || "");
    const stMatch =
      getSAN.match(/Subject:.*?ST\s?=\s?([^\s,+/]+).*/)?.[1]?.trim() ??
      (process.env.DEFAULT_STATE || "");
    const lMatch =
      getSAN.match(/Subject:.*?L\s?=\s?([^\s,+/]+).*/)?.[1]?.trim() ??
      (process.env.DEFAULT_LOCALITY || "");
    const oMatch =
      getSAN.match(/Subject:.*?O\s?=\s?([^\s,+/]+).*/)?.[1]?.trim() ?? "";
    const ouMatch =
      getSAN.match(/Subject:.*?OU\s?=\s?([^\s,+/]+).*/)?.[1]?.trim() ?? "";
    const cnMatch = getSAN.match(/Subject:.*?CN\s?=\s?([^\s,+/]+)/);
    let extractedCN = cnMatch?.[1]?.trim() ?? "";
    extractedCN = extractedCN.replace(/[\[\]]/g, "");
    // Parse SAN entries into typed list (e.g. ["DNS:foo.com", "IP:1.2.3.4"])
    const altNames: string[] = [];
    if (extractedSans) {
      // extractedSans comes from openssl as comma-separated, e.g. "DNS:a.com, DNS:b.com, IP Address:1.2.3.4"
      for (const entry of extractedSans.split(",")) {
        const trimmed = entry.trim();
        // Normalize "IP Address:" to "IP:"
        const normalized = trimmed.replace(/^IP Address:/i, "IP:");
        if (normalized) altNames.push(normalized);
      }
    } else if (extractedCN) {
      const isIP =
        /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(extractedCN) ||
        extractedCN.includes(":");
      const prefix = isIP ? "IP" : "DNS";
      altNames.push(`${prefix}:${extractedCN}`);
    }

    // Build OpenSSL extfile config
    const lines: string[] = [
      "[ v3_server ]",
      "subjectAltName = @alt_names",
      "keyUsage = critical, digitalSignature, keyEncipherment",
      "extendedKeyUsage = serverAuth",
      `crlDistributionPoints = URI:${guestResourcesUrl}/master.crl.pem`,
      "",
      "[ req_distinguished_name ]",
      `C = ${cMatch}`,
      `ST = ${stMatch}`,
      `L = ${lMatch}`,
      `CN = ${extractedCN}`,
    ];
    if (oMatch) lines.push(`O = ${oMatch}`);
    if (ouMatch) lines.push(`OU = ${ouMatch}`);

    // Build [ alt_names ] section with numbered entries
    lines.push("", "[ alt_names ]");
    const dnsCount: Record<string, number> = {
      DNS: 0,
      IP: 0,
      email: 0,
      URI: 0,
    };
    for (const entry of altNames) {
      const colonIdx = entry.indexOf(":");
      const type = colonIdx !== -1 ? entry.slice(0, colonIdx) : "DNS";
      const value = colonIdx !== -1 ? entry.slice(colonIdx + 1) : entry;
      const key = type in dnsCount ? type : "DNS";
      dnsCount[key] = (dnsCount[key] ?? 0) + 1;
      lines.push(`${key}.${dnsCount[key]} = ${value}`);
    }

    const configContent = lines.join("\n");
    if (configContent) {
      await Bun.write(tempSavePath, configContent);
    }
    const termGenerate = await spawnWithInput(
      "openssl",
      [
        "x509",
        "-req",
        "-in",
        "-",
        "-CA",
        "./certs/master.pub.pem",
        "-CAkey",
        "./certs/master.key.pem",
        "-CAcreateserial",
        "-days",
        generateDays.toString(),
        "-sha256",
        "-extfile",
        tempSavePath,
        "-extensions",
        "v3_server",
      ],
      csrText,
    );
    return { pb: termGenerate.stdout, itemCN: extractedCN };
  } catch (e) {
    console.error(`generateCertificate failed: ${e}`);
    throw e;
  } finally {
    if (await Bun.file(tempSavePath).exists()) await unlink(tempSavePath);
  }
}

async function revokeCertificate(cert: string) {
  const configPath = "./certs/ca_db/openssl.cnf";
  if (!(await Bun.file(configPath).exists())) {
    throw new Error("CA database not initialized. Run init.sh first.");
  }
  // openssl ca -revoke requires a file path, not stdin
  const tmpCert = `./certs/tmp_revoke_${crypto.randomUUID()}.pem`;
  await Bun.write(tmpCert, cert);
  try {
    await spawnWithInput(
      "openssl",
      ["ca", "-config", configPath, "-revoke", tmpCert, "-batch"],
      "",
    );
  } finally {
    const { unlink } = await import("node:fs/promises");
    await unlink(tmpCert).catch(() => {});
  }
  await spawnWithInput(
    "openssl",
    [
      "ca",
      "-config",
      configPath,
      "-gencrl",
      "-out",
      "./certs/master.crl.pem",
      "-batch",
    ],
    "",
  );
}
