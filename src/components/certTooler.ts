import fs from "node:fs";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const spawnWithInput = (
  cmd: string,
  args: string[],
  input: string
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: any) => (stdout += data));
    child.stderr.on("data", (data: any) => (stderr += data));

    child.on("close", (code: any) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      } else {
        resolve({ stdout, stderr });
      }
    });

    child.stdin.write(input);
    child.stdin.end();
  });
};

export async function generateCSR(
  saveUUID: string = crypto.randomUUID(),
  commonName: string,
  organizationUnit: string,
  organization: string,
  locality: string,
  state: string,
  country: string
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
      privateKeySavePath
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
  saveUUID: string = crypto.randomUUID()
) {
  try {
    const { stdout: getSAN } = await spawnWithInput(
      "openssl",
      ["req", "-noout", "-text", "-in", "-"],
      csrText
      );
    const tempSavePath = /tmp/${crypto.randomUUID()}.cnf;
    const sanMatch = getSAN.match(/Subject Alternative Name:.*\n\s*(.*)/);
    const extractedSans = sanMatch ? sanMatch[1].trim() : "";

    let configContent = "";

    if (extractedSans) {
      configContent = `subjectAltName = ${extractedSans}`;
    } else {
      // Fallback: Extract CN and format it as a DNS entry for the SAN field
      const cnMatch = getSAN.match(/Subject:.*?CN\s?=\s?([^\s,+/]+)/);
      const extractedCN = cnMatch ? cnMatch[1].trim() : "";
      if (extractedCN) {
        configContent = `subjectAltName = DNS:${extractedCN}`;
      }
    }

    // 2. Write temp config if we have SAN info
    if (configContent) {
      await fs.promises.writeFile(tempSavePath, configContent);
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
        ...(extractedSans ? ["-extfile", extFilePath] : [])
      ],
      csrText
    );
    const savePath = `./certs/created/${saveUUID}_pub.pem`;

    await fs.promises.mkdir("./certs/created", { recursive: true });

    await fs.promises.writeFile(savePath, termGenerate.stdout);
    return savePath;
  } catch (e) {
    console.error(`generateCertificate failed: ${e}`);
    throw e;
  } finally {
    if (fs.existsSync(extFilePath)) await fs.promise.unlink(extFilePath);
  }
}

export async function generateFullchain(uuid: string): Promise<string> {
  try {
    const certPath = `./certs/created/${uuid}_pub.pem`;
    const masterCertPath = "./certs/master.pub.pem";

    // Read both certificates
    const [cert, masterCert] = await Promise.all([
      fs.promises.readFile(certPath, "utf8"),
      fs.promises.readFile(masterCertPath, "utf8"),
    ]);

    // Create fullchain (certificate + CA certificate)
    const fullchain = cert + "\n" + masterCert;

    return fullchain;
  } catch (e) {
    console.error(`generateFullchain failed: ${e}`);
    throw e;
  }
}
