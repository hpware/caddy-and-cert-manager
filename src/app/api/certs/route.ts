import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import { revokeCertificate } from "@/components/core/certTooler";
import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq } from "drizzle-orm";
import fs from "node:fs";

export const DELETE = async (req: Request) => {
  let statusCode = 500;
  try {
    // add auth
    const user = await checkUserLoginStatus(req.headers);
    if (!user.loggedIn) {
      statusCode = 401;
      throw new Error("Unauthorized");
    }
    const body = await req.json();
    const uuidV4Re =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!body.id || !uuidV4Re.test(body.id)) {
      statusCode = 400;
      throw new Error("Invalid or missing certificate ID");
    }
    const sanitizedId: string = body.id;
    const dbData = await db
      .select()
      .from(schema.certificates)
      .where(eq(schema.certificates.id, sanitizedId));
    if (dbData.length === 0) {
      statusCode = 404;
      throw new Error("Certificate not found");
    }
    await revokeCertificate(dbData[0].certificatePublicKey);

    await db
      .delete(schema.certificates)
      .where(eq(schema.certificates.id, sanitizedId));

    return new Response("Certificate Deleted!");
  } catch (e) {
    const errorId = randomString();
    console.error(`[ERRID: ${errorId}] ${e}`);
    return new Response(
      `Internal Server Error, please view server logs for more info. ERRID: ${errorId}`,
      { status: statusCode },
    );
  }
};
