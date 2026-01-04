import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";

export const DELETE = async (req: Request) => {
  const body = await req.json();
  try {
    await db
      .delete(schema.certificates)
      .where(eq(schema.certificates.id, body.id));
    return new Response("ok");
  } catch (e: any) {
    console.error(`[DB CERT DELETEION] ${e}`);
    return new Response(e.message || "DB failed!", { status: 500 });
  }
};
