import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { NextRequest } from "next/server";
import { desc } from "drizzle-orm";

export const GET = async (req: NextRequest) => {
  const user = await checkUserLoginStatus(req.headers);
  if (!user.loggedIn) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const offset = parseInt(searchParams.get("offset") || "0");
    const limit = 50;

    const data = await db
      .select()
      .from(schema.proxy)
      .orderBy(desc(schema.proxy.createdAt))
      .limit(limit)
      .offset(offset);

    return Response.json({
      ok: true,
      data,
      nextOffset: data.length < limit ? null : offset + limit,
    });
  } catch (e: any) {
    const errorId = randomString();
    console.error(`[ERRID: ${errorId}] ${e}`);
    return Response.json(
      {
        ok: false,
        error: `Internal Server Error. ERRID: ${errorId}`,
      },
      { status: 500 },
    );
  }
};
