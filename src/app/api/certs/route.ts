import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import { revokeCertificateWithRegen } from "@/components/core/regenClient";
import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

export const DELETE = async (req: Request) => {
  // add auth
  const user = await checkUserLoginStatus(req.headers);
  if (!user.loggedIn) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.id || typeof body.id !== "string" || !/^[A-Za-z0-9_-]+$/.test(body.id)) {
    return new Response("Invalid certificate id", { status: 400 });
  }
  try {
    const baseDir = path.resolve("./certs/created");
    const certPath = path.resolve(baseDir, `${body.id}_pub.pem`);
    if (!certPath.startsWith(baseDir + path.sep)) {
      return new Response("Invalid certificate id", { status: 400 });
    }
    const publicKey = await fs.promises.readFile(certPath, "utf8");
    await revokeCertificateWithRegen(publicKey);
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
