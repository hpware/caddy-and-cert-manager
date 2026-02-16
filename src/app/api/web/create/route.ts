import { NextRequest } from "next/server";
import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import {
  addServiceToCaddy,
  uploadWebHostFilesToServer,
} from "@/components/core/caddyControl";
import {
  generateCSR,
  generateCertificate,
  generateFullchain,
} from "@/components/core/certTooler";
import fs from "node:fs";

export const POST = async (req: NextRequest) => {
  const user = await checkUserLoginStatus(req.headers);
  if (!user.loggedIn) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const serviceType = (formData.get("format") as string) || "proxy";
    const publicURL = formData.get("publicURL") as string;
    const sslType = (formData.get("sslType") as string) || "homecert";
    const proxyHostUrl = formData.get("url") as string;
    const allowWebsocket = formData.get("allowWebsocket") === "true";
    const cacheAssets = formData.get("cacheAssets") === "true";
    const listenPort = parseInt(
      (formData.get("listenPort") as string) || "443",
    );
    const listenProtocol =
      (formData.get("listenProtocol") as string) || "https";

    if (!name) {
      return Response.json(
        { ok: false, error: "Name is required" },
        { status: 400 },
      );
    }

    const serviceId = crypto.randomUUID();
    const publicUrls = publicURL
      ? publicURL
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean)
      : [];

    let customCertPath: string | null = null;
    let customKeyPath: string | null = null;
    let certificateId: string | null = null;
    let fileServePath: string | null = null;

    // Handle file uploads for static site hosting
    if (serviceType === "files") {
      const file = formData.get("files") as File | null;
      if (!file) {
        return Response.json(
          { ok: false, error: "File upload required for file service type" },
          { status: 400 },
        );
      }
      fileServePath = await uploadWebHostFilesToServer(file, serviceId);
    }

    // Handle SSL certificate types
    if (sslType === "homecert") {
      const certUUID = crypto.randomUUID();
      const domain = publicUrls[0] || name;

      const { csr, privateKey } = await generateCSR(
        certUUID,
        domain,
        "Homelab",
        "Homelab",
        "Local",
        "Local",
        "US",
      );

      const { pb: certPath } = await generateCertificate(csr, 365, certUUID);
      const fullchainPath = await generateFullchain(certUUID);

      customCertPath = fullchainPath.replace("./cert/created/", "/cert/");
      customKeyPath = privateKey.replace("./cert/created/", "/cert/");

      // Save cert reference in certificates table
      const [cert] = await db
        .insert(schema.certificates)
        .values({
          id: certUUID,
          name: `${name} - auto generated`,
          privateKey: true,
        })
        .returning();
      certificateId = cert.id;
    } else if (sslType === "custom") {
      const certFile = formData.get("customCert") as File | null;
      const keyFile = formData.get("customKey") as File | null;

      if (!certFile || !keyFile) {
        return Response.json(
          {
            ok: false,
            error: "Certificate and key files required for custom SSL",
          },
          { status: 400 },
        );
      }

      const certDir = `/certs/created/custom-${serviceId}`;
      await fs.promises.mkdir(certDir, { recursive: true });

      customCertPath = `${certDir}/cert.pem`;
      customKeyPath = `${certDir}/key.pem`;

      await fs.promises.writeFile(
        customCertPath,
        Buffer.from(await certFile.arrayBuffer()),
      );
      await fs.promises.writeFile(
        customKeyPath,
        Buffer.from(await keyFile.arrayBuffer()),
      );
    }
    // For letsencrypt_http and letsencrypt_dns, no cert files needed — Caddy handles it

    // Insert into database
    const [service] = await db
      .insert(schema.proxy)
      .values({
        id: serviceId,
        name,
        serviceType,
        publicUrls,
        certificateOrigin: sslType,
        certificateId,
        customCertPath,
        customKeyPath,
        listenPort,
        listenProtocol,
        fileServePath,
        allowWebsocket,
        cacheAssets,
        proxyHostUrl: proxyHostUrl || "",
      })
      .returning();

    // Push to Caddy
    await addServiceToCaddy({
      id: service.id,
      name: service.name,
      serviceType: service.serviceType as "proxy" | "files",
      publicUrls: publicUrls,
      proxyHostUrl: service.proxyHostUrl,
      fileServePath: service.fileServePath || undefined,
      allowWebsocket: service.allowWebsocket,
      cacheAssets: service.cacheAssets,
      certificateOrigin: service.certificateOrigin,
      certificateId: service.certificateId,
      customCertPath: service.customCertPath,
      customKeyPath: service.customKeyPath,
      listenPort: service.listenPort,
      listenProtocol: service.listenProtocol,
    });

    return Response.json({ ok: true, id: service.id });
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
