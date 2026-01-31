import { NextRequest } from "next/server";
import * as certTool from "@/components/core/certTooler";
import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import randomString from "@/components/randomString";

export const POST = async (request: NextRequest) => {
  try {
    const { headers: userHeaders } = request;
    const checkAuth = await checkUserLoginStatus(userHeaders);
    if (!checkAuth.loggedIn) {
      return Response.json(
        {
          ok: false,
          uuidSavePath: null,
          certPublicKey: null,
          certPrivateKey: null,
          fullChainPath: null,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }
    const formData = await request.formData();
    const { mode, Days } = Object.fromEntries(formData);
    if (mode === "easy") {
      const { CN, OU, O, L, ST, C } = Object.fromEntries(formData);
      const saveUUID = crypto.randomUUID();
      const certCsrAndPrivateKey = await certTool.generateCSR(
        saveUUID,
        CN.toString(),
        OU ? OU.toString() : "BunCCR",
        O ? O.toString() : "BunCCR",
        L ? L.toString() : "Da-an District",
        ST ? ST.toString() : "Taipei City",
        C ? C.toString() : "TW",
      );

      // save into db
      await db
        .insert(schema.certificates)
        .values({
          id: saveUUID,
          name: CN.toString(),
          privateKey: true,
        })
        .execute();

      const cert = await certTool.generateCertificate(
        certCsrAndPrivateKey.csr,
        Number(Days),
        saveUUID,
      );
      const fullChainPath = await certTool.generateFullchain(saveUUID);
      return Response.json({
        ok: true,
        uuidSavePath: saveUUID,
        certPublicKey: cert.pb,
        certPrivateKey: certCsrAndPrivateKey.privateKey,
        fullChainPath,
      });
    } else if (mode === "csr") {
      const { CSR } = Object.fromEntries(formData);
      const saveUUID = crypto.randomUUID();
      const generateCert = await certTool.generateCertificate(
        await (CSR as File).text(),
        Number(Days),
        saveUUID,
      );
      // save into db
      await db
        .insert(schema.certificates)
        .values({
          id: saveUUID,
          name: generateCert.itemCN,
          privateKey: false,
        })
        .execute();
      const fullChainPath = await certTool.generateFullchain(saveUUID);
      return Response.json({
        ok: true,
        uuidSavePath: saveUUID,
        certPublicKey: generateCert.pb,
        certPrivateKey: null,
        fullChainPath,
        error: null,
      });
    }
    return Response.json({
      ok: false,
      uuidSavePath: null,
      certPublicKey: null,
      certPrivateKey: null,
      fullChainPath: null,
      error: null,
    });
  } catch (e) {
    const errorId = randomString();
    console.error(`[ERRID: ${errorId}] ${e}`);
    return Response.json(
      {
        ok: false,
        uuidSavePath: null,
        certPublicKey: null,
        certPrivateKey: null,
        fullChainPath: null,
        error: `Internal Server Error, please view server logs for more info. ERRID: ${errorId}`,
      },
      { status: 500 },
    );
  }
};
