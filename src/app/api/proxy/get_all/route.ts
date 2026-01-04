import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get("offset") || "0");

  return Response.json({ data: "", nextOffset: offset + 50 });
};
