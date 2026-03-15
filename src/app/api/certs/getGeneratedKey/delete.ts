import { db } from "@/components/drizzle/db";
import { sessionToks } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq, lt } from "drizzle-orm";

export const deleteGeneratedKey = async (token: string) => {
  try {
    await db.delete(sessionToks).where(eq(sessionToks.token, token));
    return Response.json({
      errID: null,
      message: null,
    });
  } catch (e: any) {
    const errorId = randomString(16);
    console.error(`ERR [${errorId}]: ${e}`);
    return Response.json({
      errID: errorId,
      message: e.message,
    });
  }
};

export const cleanUp = async () => {
  try {
    await db
      .delete(sessionToks)
      .where(
        lt(
          sessionToks.createdAt,
          new Date(new Date().getTime() - 60 * 60 * 1000).toISOString(),
        ),
      );
  } catch (e) {}
};
