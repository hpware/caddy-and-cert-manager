import * as fs from "node:fs/promises";

if (!process.env.DATABASE_URL) {
  throw new Error("No Database URL!");
}
const sql = new Bun.SQL(process.env.DATABASE_URL);
async function Run() {
  const checkUserHasMigrated = await sql`
    SELECT * FROM kv_data
    WHERE key = certs_migrated;`;
  if (checkUserHasMigrated[0].value) {
  }
}
