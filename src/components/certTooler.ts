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

    // Parse CN for multiple values and extract primary CN + SAN
    const { primaryCN, sanEntries } = parseCNForSAN(commonName);
    const subj = `/CN=${primaryCN}/OU=${organizationUnit}/O=${organization}/L=${locality}/ST=${state}/C=${country}`;

    let csrArgs = ["req", "-new", "-key", privateKeySavePath, "-subj", subj];

    // If we have SAN entries, create a config file
    if (sanEntries.length > 0) {
      const configPath = `./certs/created/${saveUUID}_openssl.conf`;
      const sanConfig = generateOpenSSLConfig(sanEntries);
      await fs.promises.writeFile(configPath, sanConfig);
      csrArgs.push("-config", configPath, "-extensions", "v3_req");
    }

    const csr = await spawnWithInput("openssl", csrArgs, privateKeySavePath);

    // Clean up config file if created
    if (sanEntries.length > 0) {
      try {
        await fs.promises.unlink(`./certs/created/${saveUUID}_openssl.conf`);
      } catch (e) {
        console.warn("Failed to cleanup config file:", e);
      }
    }

    return { csr: csr.stdout, privateKey: privateKeySavePath };
  } catch (e) {
    console.error(`generateCSR failed: ${e}`);
    throw e;
  }
}

function parseCNForSAN(commonName: string): {
  primaryCN: string;
  sanEntries: string[];
} {
  // Split by common delimiters and clean up
  const entries = commonName
    .split(/[,;|\s]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (entries.length === 0) {
    return { primaryCN: "localhost", sanEntries: [] };
  }

  // Use first entry as primary CN, sanitize it
  const primaryCN = sanitizeCN(entries[0]);

  // All entries (including first) go into SAN if there are multiple
  const sanEntries = entries.length > 1 ? entries.map(sanitizeSANEntry) : [];

  return { primaryCN, sanEntries };
}

function sanitizeCN(cn: string): string {
  // Remove invalid characters for CN field, keep only alphanumeric, dots, hyphens
  return cn.replace(/[^a-zA-Z0-9.-]/g, "").substring(0, 64) || "localhost";
}

function sanitizeSANEntry(entry: string): string {
  // Check if it's an IP address
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(entry)) {
    return `IP:${entry}`;
  }
  // Otherwise treat as DNS name
  return `DNS:${entry.replace(/[^a-zA-Z0-9.-]/g, "")}`;
}

function generateOpenSSLConfig(sanEntries: string[]): string {
  return `[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
${sanEntries
  .map(
    (entry, index) =>
      `${entry.startsWith("IP:") ? "IP" : "DNS"}.${index + 1} = ${entry.replace(
        /^(IP:|DNS:)/,
        ""
      )}`
  )
  .join("\n")}
`;
}

export async function generateCertificate(
  csrText: string,
  generateDays: number,
  saveUUID: string = crypto.randomUUID()
) {
  try {
    // Check if CSR contains SAN extensions
    const hasSAN =
      csrText.includes("Subject Alternative Name") ||
      csrText.includes("subjectAltName");

    let x509Args = [
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
    ];

    // If CSR has SAN, we need to preserve extensions during signing
    if (hasSAN) {
      // Create a temporary config for signing with SAN preservation
      const signConfigPath = `./certs/created/${saveUUID}_sign.conf`;
      const signConfig = generateSigningConfig();
      await fs.promises.writeFile(signConfigPath, signConfig);

      x509Args.push("-extensions", "v3_req", "-extfile", signConfigPath);
    }

    const termGenerate = await spawnWithInput("openssl", x509Args, csrText);

    // Clean up signing config if created
    if (hasSAN) {
      try {
        await fs.promises.unlink(`./certs/created/${saveUUID}_sign.conf`);
      } catch (e) {
        console.warn("Failed to cleanup signing config:", e);
      }
    }

    const savePath = `./certs/created/${saveUUID}_pub.pem`;

    await fs.promises.mkdir("./certs/created", { recursive: true });

    await fs.promises.writeFile(savePath, termGenerate.stdout);
    return savePath;
  } catch (e) {
    console.error(`generateCertificate failed: ${e}`);
    throw e;
  }
}

function generateSigningConfig(): string {
  return `[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
# This section will be populated from the CSR
`;
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
