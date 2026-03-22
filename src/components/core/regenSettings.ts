import { inArray } from "drizzle-orm";
import { db } from "@/components/drizzle/db";
import { kvData } from "@/components/drizzle/schema";

const CERT_URL_KEY = "regen-cert-url";
const API_KEY_KEY = "regen-api-key";

export type RegenSettings = {
  certUrl: string;
  apiKey: string;
};

export async function getRegenSettings(): Promise<RegenSettings> {
  const rows = await db
    .select()
    .from(kvData)
    .where(inArray(kvData.key, [CERT_URL_KEY, API_KEY_KEY]));

  const data = new Map(rows.map((row) => [row.key, row.value]));

  return {
    certUrl: typeof data.get(CERT_URL_KEY) === "string" ? String(data.get(CERT_URL_KEY)) : "",
    apiKey: typeof data.get(API_KEY_KEY) === "string" ? String(data.get(API_KEY_KEY)) : "",
  };
}

export async function saveRegenSettings(settings: RegenSettings) {
  await db.transaction(async (tx) => {
    await tx
      .insert(kvData)
      .values({ key: CERT_URL_KEY, value: settings.certUrl })
      .onConflictDoUpdate({
        target: kvData.key,
        set: {
          value: settings.certUrl,
          updated_at: new Date(),
        },
      });

    await tx
      .insert(kvData)
      .values({ key: API_KEY_KEY, value: settings.apiKey })
      .onConflictDoUpdate({
        target: kvData.key,
        set: {
          value: settings.apiKey,
          updated_at: new Date(),
        },
      });
  });
}
