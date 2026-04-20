import { execAsync } from "./exec";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
export async function generateCSR(
  saveUUID: string = crypto.randomUUID(),
  subjectAltNames: string[],
  commonName: string,
  organizationUnit: string,
  organization: string,
  locality: string,
  state: string,
  country: string,
) {
  const tmpKeyPath = path.join(os.tmpdir(), `${saveUUID}_key.pem`);
  try {
    const { stdout: getPrivateKey } = await execAsync(`openssl genrsa 2048`);
    const subj = `/CN=${commonName}/OU=${organizationUnit}/O=${organization}/L=${locality}/ST=${state}/C=${country}`;

    await fs.promises.writeFile(tmpKeyPath, getPrivateKey);

    const { stdout: csr } = await execAsync(
      `openssl req -new -subj "${subj}" -key "${tmpKeyPath}"`,
    );

    return { csr, privateKey: getPrivateKey };
  } catch (e) {
    console.error(`generateCSR failed: ${e}`);
    throw e;
  } finally {
    await fs.promises.unlink(tmpKeyPath).catch(() => {});
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
