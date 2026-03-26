import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import { revokeCertificate } from "@/components/core/certTooler";
import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq } from "drizzle-orm";
import fs from "node:fs";

export const DELETE = async (req: Request) => {
  // add auth
  const user = await checkUserLoginStatus(req.headers);
  if (!user.loggedIn) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = await req.json();
  try {
    const certPath = `./certs/created/${body.id}_pub.pem`;
    try {
      const publicKey = await fs.promises.readFile(certPath, "utf8");
      await revokeCertificate(publicKey);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        throw e;
      }
    }
    await db
      .delete(schema.certificates)
      .where(eq(schema.certificates.id, body.id));
    return new Response("Certificate Deleted!");
  } catch (e) {
    const errorId = randomString();
    console.error(`[ERRID: ${errorId}] ${e}`);
    return new Response(
      `Internal Server Error, please view server logs for more info. ERRID: ${errorId}`,
      { status: 500 },
    );
  }
};
