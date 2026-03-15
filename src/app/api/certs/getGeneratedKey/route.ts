import { auth } from "@/components/auth";
import { db } from "@/components/drizzle/db";
import { sessionToks } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export const GET = async () => {
  let status = 500;
  try {
    const header = await headers();
    const getSession = await auth.api.getSession({ headers: header });
    if (!getSession) {
      status = 400;
      throw new Error("User is not logged in, cannot generate key.");
    }
    const generateRandomString = randomString(60);

    await db.insert(sessionToks).values({
      token: generateRandomString,
      linkedToUser: getSession.user.id,
    });
    return Response.json({
      token: generateRandomString,
      errID: null,
      message: null,
    });
  } catch (e: any) {
    const errorId = randomString(16);
    console.error(`ERR [${errorId}]: ${e}`);
    return Response.json({
      token: null,
      errID: errorId,
      message: e.message,
    });
  }
};
