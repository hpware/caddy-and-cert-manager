import * as fs from "node:fs/promises";
import * as path from "node:path";

if (!process.env.DATABASE_URL) {
  throw new Error("No Database URL!");
}

const sql = new Bun.SQL(process.env.DATABASE_URL);

const CERTS_DIR = process.env.CERTS_DIR || "./certs/created";
const MIGRATION_KEY = "certs_migrated";

async function checkMigrationStatus(): Promise<boolean> {
  try {
    const result = await sql`
      SELECT value FROM kv_data
      WHERE key = ${MIGRATION_KEY}
    `;
    if (result.length > 0 && result[0].value === true) {
      return true;
    }
    return false;
  } catch (e) {
    console.log("Migration status check failed, assuming not migrated:", e);
    return false;
  }
}

async function markMigrationComplete(): Promise<void> {
  await sql`
    INSERT INTO kv_data (key, value)
    VALUES (${MIGRATION_KEY}, ${true})
    ON CONFLICT (key) DO UPDATE SET value = ${true}
  `;
}

async function getExistingCertificates(): Promise<Map<string, { id: string; name: string }>> {
  const result = await sql`
    SELECT id, name FROM certificates
  `;
  const map = new Map<string, { id: string; name: string }>();
  for (const row of result) {
    map.set(row.id, { id: row.id, name: row.name });
  }
  return map;
}

async function readCertificatesFromFS(): Promise<
  Map<string, { publicKey: string; privateKey: string | null }>
> {
  const certs = new Map<string, { publicKey: string; privateKey: string | null }>();

  try {
    const dirEntries = await fs.readdir(CERTS_DIR, { withFileTypes: true });

    for (const entry of dirEntries) {
      if (!entry.isFile()) continue;

      const fileName = entry.name;
      const filePath = path.join(CERTS_DIR, fileName);

      if (fileName.endsWith("_pub.pem")) {
        const uuid = fileName.replace("_pub.pem", "");
        const publicKey = await fs.readFile(filePath, "utf-8");

        let privateKey: string | null = null;
        const privateKeyPath = path.join(CERTS_DIR, `${uuid}_private_key.pem`);
        try {
          privateKey = await fs.readFile(privateKeyPath, "utf-8");
        } catch {
          // No private key file, that's fine
        }

        certs.set(uuid, { publicKey, privateKey });
      }
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      console.log(`Certificates directory ${CERTS_DIR} does not exist, nothing to migrate.`);
      return certs;
    }
    throw e;
  }

  return certs;
}

async function updateCertificateInDB(
  uuid: string,
  publicKey: string,
  privateKey: string | null,
): Promise<void> {
  await sql`
    UPDATE certificates
    SET 
      certificate_public_key = ${publicKey},
      private_key = ${privateKey !== null},
      updated_at = NOW()
    WHERE id = ${uuid}
  `;
}

async function Run() {
  console.log("Starting FS to DB certificate migration...");

  const alreadyMigrated = await checkMigrationStatus();
  if (alreadyMigrated) {
    console.log("Migration already completed. Skipping.");
    return;
  }

  const existingCerts = await getExistingCertificates();
  console.log(`Found ${existingCerts.size} certificates in database.`);

  const fsCerts = await readCertificatesFromFS();
  console.log(`Found ${fsCerts.size} certificates on filesystem.`);

  if (fsCerts.size === 0) {
    console.log("No certificates to migrate.");
    await markMigrationComplete();
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const [uuid, certData] of fsCerts) {
    if (!existingCerts.has(uuid)) {
      console.log(`Certificate ${uuid} not found in database, skipping.`);
      skipped++;
      continue;
    }

    try {
      await updateCertificateInDB(uuid, certData.publicKey, certData.privateKey);
      migrated++;
      console.log(`Migrated certificate: ${uuid}`);
    } catch (e) {
      console.error(`Failed to migrate certificate ${uuid}:`, e);
    }
  }

  await markMigrationComplete();
  console.log(`Migration complete. Migrated: ${migrated}, Skipped: ${skipped}`);
}

Run()
  .then(() => {
    console.log("Migration script finished successfully.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Migration script failed:", e);
    process.exit(1);
  });
