import { execAsync, spawnWithInput } from "./exec";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
export async function generateCSR(
  subjectAltNames: string[],
  commonName: string,
  organizationUnit: string,
  organization: string,
  locality: string,
  state: string,
  country: string,
) {
  const taskUUID = crypto.randomUUID();
  console.log(`Task UUID: ${crypto.randomUUID()}`);
  const tmpKeyPath = path.join(os.tmpdir(), `${taskUUID}_key.pem`);
  const configTempPath = path.join(os.tmpdir(), `${taskUUID}_openssl.cnf`);
  try {
    const { stdout: getPrivateKey } = await execAsync(`openssl genrsa 2048`);

    const sanList = subjectAltNames.map((san) => {
      const trimmed = san.trim();
      const isIP =
        /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(trimmed) ||
        trimmed.includes(":");
      return isIP ? `IP:${trimmed}` : `DNS:${trimmed}`;
    });

    const configContent = `[req]
distinguished_name = req_distinguished_name
req_extensions = req_ext
prompt = no

[req_distinguished_name]
C = ${country}
ST = ${state}
L = ${locality}
O = ${organization}
OU = ${organizationUnit}
CN = ${commonName}

[req_ext]
subjectAltName = @alt_names

[alt_names]
${sanList
  .map((san, i) => {
    const [type, ...valueParts] = san.split(":");
    const value = valueParts.join(":");
    return `${type}.${i + 1} = ${value}`;
  })
  .join("\n")}`;

    await fs.promises.writeFile(tmpKeyPath, getPrivateKey);
    await fs.promises.writeFile(configTempPath, configContent);

    const { stdout: csr } = await execAsync(
      `openssl req -new -key "${tmpKeyPath}" -config "${configTempPath}"`,
    );

    const { stdout: getSAN } = await spawnWithInput(
      "openssl",
      ["req", "-noout", "-text", "-in", "-"],
      csr,
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

    const altNames: string[] = [];
    if (extractedSans) {
      for (const entry of extractedSans.split(",")) {
        const trimmed = entry.trim();
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

    const lines: string[] = [
      "[ v3_server ]",
      "subjectAltName = @alt_names",
      "keyUsage = critical, digitalSignature, keyEncipherment",
      "extendedKeyUsage = serverAuth",
      "",
      "[ alt_names ]",
    ];
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

    return { csr, privateKey: getPrivateKey, extFileLines: lines };
  } catch (e) {
    console.error(`generateCSR failed: ${e}`);
    throw e;
  } finally {
    await fs.promises.unlink(tmpKeyPath).catch(() => {});
    await fs.promises.unlink(configTempPath).catch(() => {});
  }
}

export async function generateCertificate(
  csrText: string,
  generateDays: number,
  saveUUID: string = crypto.randomUUID(),
) {
  try {
    if (
      process.env.IGNORE_PROTECTIONS?.toLowerCase() !== "true" &&
      generateDays > 200
    ) {
      throw new Error(
        "Cannot generate over 200 days. To ignore this error, set IGNORE_PROTECTIONS=true in the `.env` file.",
      );
    }
    const req = await fetch(`${process.env.PROTECTION_PROXY_URL}/api/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        proxyToken: process.env.PROTECTION_PROXY_TOKEN,
        csr: csrText,
        days: generateDays,
      }),
    });
    const res = (await req.json()) as {
      error: string | null;
      pb: string;
      itemCN: string;
    };

    if (res.error !== null) {
      throw new Error(res.error);
    }
    return { itemCN: res.itemCN, pb: res.pb };
  } catch (e) {
    console.error(`generateCertificate failed: ${e}`);
    throw e;
  }
}

export async function revokeCertificate(revokeCertPublicPem: string) {
  const req = await fetch(`${process.env.PROTECTION_PROXY_URL}/api/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      proxyToken: process.env.PROTECTION_PROXY_TOKEN,
      cert: revokeCertPublicPem,
    }),
    signal: AbortSignal.timeout(5000),
  });
  const res = (await req.json()) as {
    error: string | null;
    revoked: boolean;
  };
  if (res.error !== null) {
    throw new Error(res.error);
  }
  return;
}

export async function generateFullchain(uuid: string): Promise<string> {
  try {
    const certPath = `./certs/created/${uuid}_pub.pem`;
    const masterCertPath = "./certs/master.pub.pem";
    const fullChainPath = `./certs/created/${uuid}_fullchain.pem`;

    // Read both certificates
    const [cert, masterCert] = await Promise.all([
      fs.promises.readFile(certPath, "utf8"),
      fs.promises.readFile(masterCertPath, "utf8"),
    ]);

    // Create fullchain (certificate + CA certificate)
    const fullchain = cert + "\n" + masterCert;

    await fs.promises.writeFile(fullChainPath, fullchain);
    return fullChainPath;
  } catch (e) {
    console.error(`generateFullchain failed: ${e}`);
    throw e;
  }
}

export async function generateFullchainCertificate(
  certificate: string,
): Promise<string> {
  try {
    const masterCertPath = "./certs/master.pub.pem";

    const [masterCert] = await Promise.all([
      fs.promises.readFile(masterCertPath, "utf8"),
    ]);

    // Create fullchain (certificate + CA certificate)
    return certificate + "\n" + masterCert;
  } catch (e) {
    console.error(`generateFullchain failed: ${e}`);
    throw e;
  }
}
