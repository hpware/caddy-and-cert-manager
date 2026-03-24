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
  const uuidV4Re =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!body.id || !uuidV4Re.test(body.id)) {
    return new Response("Invalid certificate id", { status: 400 });
  }
  const sanitizedId: string = body.id;
  try {
    const certPath = `./certs/created/${sanitizedId}_pub.pem`;
    const publicKey = await fs.promises.readFile(certPath, "utf8");
    // Delete from DB first; if revocation fails the DB entry is already gone
    // but the cert can be retried manually. This avoids the reverse case where
    // the cert is revoked but the DB row remains and blocks further action.
    await db
      .delete(schema.certificates)
      .where(eq(schema.certificates.id, sanitizedId));
    await revokeCertificate(publicKey);
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
