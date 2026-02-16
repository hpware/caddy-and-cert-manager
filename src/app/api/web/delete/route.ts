import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { removeServiceFromCaddy } from "@/components/core/caddyControl";
import { eq } from "drizzle-orm";
import fs from "node:fs";

export const DELETE = async (req: Request) => {
  const user = await checkUserLoginStatus(req.headers);
  if (!user.loggedIn) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json(
        { ok: false, error: "Service ID is required" },
        { status: 400 },
      );
    }

    // Get the service before deleting to clean up files
    const [service] = await db
      .select()
      .from(schema.proxy)
      .where(eq(schema.proxy.id, id));

    if (!service) {
      return Response.json(
        { ok: false, error: "Service not found" },
        { status: 404 },
      );
    }

    // Remove from Caddy
    await removeServiceFromCaddy(id);

    // Clean up uploaded files
    if (service.fileServePath) {
      await fs.promises
        .rm(service.fileServePath, { recursive: true, force: true })
        .catch(() => {});
    }

    // Clean up custom cert files
    if (service.certificateOrigin === "custom" && service.customCertPath) {
      const certDir = `/certs/created/custom-${id}`;
      await fs.promises
        .rm(certDir, { recursive: true, force: true })
        .catch(() => {});
    }

    // Delete from DB
    await db.delete(schema.proxy).where(eq(schema.proxy.id, id));

    // If it had an auto-generated cert, clean that up too
    if (service.certificateId) {
      await db
        .delete(schema.certificates)
        .where(eq(schema.certificates.id, service.certificateId));
    }

    return Response.json({ ok: true });
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
