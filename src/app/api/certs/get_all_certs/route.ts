import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get("offset") || "0");
  const dbResult = await db
    .select()
    .from(schema.certificates)
    .orderBy(schema.certificates.created_at)
    .offset(offset)
    .limit(50);
  return Response.json({ data: dbResult, nextOffset: offset + 50 });
};
