import { execAsync, spawnWithInput } from "./exec";
import fs from "node:fs";
export async function generateCSR(
  saveUUID: string = crypto.randomUUID(),
  commonName: string,
  organizationUnit: string,
  organization: string,
  locality: string,
  state: string,
  country: string,
) {
  try {
    const { stdout: getPrivateKey } = await execAsync(`openssl genrsa 2048`);
    const privateKeySavePath = `./certs/created/${saveUUID}_private_key.pem`;

    await fs.promises.mkdir("./certs/created", { recursive: true });

    await fs.promises.writeFile(privateKeySavePath, getPrivateKey);
    const subj = `/CN=${commonName}/OU=${organizationUnit}/O=${organization}/L=${locality}/ST=${state}/C=${country}`;

    // Using '-' tells OpenSSL to read the key from stdin
    const csr = await spawnWithInput(
      "openssl",
      ["req", "-new", "-key", privateKeySavePath, "-subj", subj],
      privateKeySavePath,
    );
    return { csr: csr.stdout, privateKey: privateKeySavePath };
  } catch (e) {
    console.error(`generateCSR failed: ${e}`);
    throw e;
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
        proxyToken: process.env.PROTECTION_PROXY_TOKEN || "defaultToken",
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
    const savePath = `./certs/created/${saveUUID}_pub.pem`;

    await fs.promises.mkdir("./certs/created", { recursive: true });

    await fs.promises.writeFile(savePath, res.pb);
    return { pb: savePath, itemCN: res.itemCN };
  } catch (e) {
    console.error(`generateCertificate failed: ${e}`);
    throw e;
  }
}

// TBD
export async function revokeCertificate(
  saveUUID: string = crypto.randomUUID(),
) {
  try {
  } catch (e) {}
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
