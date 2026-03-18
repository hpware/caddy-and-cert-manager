import { $ } from "bun";
import { mkdir, unlink } from "node:fs/promises";

Bun.serve({
  port: 4000,
  routes: {
    "/api/sign": {
      POST: async (req) => {
        const body = (await req.json()) as { csr?: string; days?: number };
        const { csr, days } = body;
        if (!csr || !days) {
          return Response.json(
            { error: "Missing csr or days" },
            { status: 400 },
          );
        }
        try {
          const result = await generateCertificate(csr, Number(days));
          return Response.json(result);
        } catch (e) {
          return Response.json({ error: String(e) }, { status: 500 });
        }
      },
    },
    "/api/revoke": async (req) => {
      return new Response("");
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

// migrated from Next.js project.
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

    let configContent = `[ v3_server ]\nsubjectAltName = @alt_names\nkeyUsage = critical, digitalSignature, keyEncipherment\nextendedKeyUsage = serverAuth\ncrlDistributionPoints = @crl_dp\n\n`;
    const cnMatch = getSAN.match(/Subject:.*?CN\s?=\s?([^\s,+/]+)/);
    let extractedCN = cnMatch?.[1]?.trim() ?? "";
    extractedCN = extractedCN.replace(/[\[\]]/g, "");
    //[ alt_names ]
    if (extractedSans) {
      configContent = `subjectAltName = ${extractedSans}`;
    } else {
      if (extractedCN) {
        const isIP =
          /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(extractedCN) ||
          extractedCN.includes(":");

        const prefix = isIP ? "IP" : "DNS";
        configContent = `subjectAltName = ${prefix}:${extractedCN}`;
      }
    }
    configContent += `\n\n[ server_cert ]\ncrlDistributionPoints = URI:${process.env.NEXT_PUBLIC_GUEST_RESOURCES_URL}/master.crl.pem`;
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
      ],
      csrText,
    );
    const savePath = `./certs/created/${saveUUID}_pub.pem`;

    await mkdir("./certs/created", { recursive: true });

    await Bun.write(savePath, termGenerate.stdout);
    return { pb: savePath, itemCN: extractedCN };
  } catch (e) {
    console.error(`generateCertificate failed: ${e}`);
    throw e;
  } finally {
    if (await Bun.file(tempSavePath).exists()) await unlink(tempSavePath);
  }
}
