import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { desc } from "drizzle-orm";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const user = await checkUserLoginStatus(req.headers);
    if (!user.loggedIn) {
      return Response.json(
        {
          data: [],
          nextOffset: 0,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }
    const { searchParams } = new URL(req.url);
    const offset = parseInt(searchParams.get("offset") || "0");
    const dbResult = await db
      .select()
      .from(schema.certificates)
      .orderBy(desc(schema.certificates.created_at))
      .offset(offset)
      .limit(50);
    return Response.json({
      data: dbResult,
      nextOffset: offset + 50,
      error: null,
    });
  } catch (e: any) {
    const errorId = randomString();
    console.error(`[ERRID: ${errorId}] ${e}`);
    return Response.json(
      {
        data: [],
        nextOffset: 0,
        error: `Internal Server Error, please view server logs for more info. ERRID: ${errorId}`,
      },
      { status: 500 },
    );
  }
};
