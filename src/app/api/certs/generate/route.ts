import { NextRequest } from "next/server";
import * as certTool from "@/components/core/certTooler";
import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";

export const POST = async (request: NextRequest) => {
  const formData = await request.formData();
  const { mode, Days } = Object.fromEntries(formData);
  if (mode === "generate") {
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
      certPublicKey: cert,
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
        name: saveUUID,
        privateKey: false,
      })
      .execute();
    const fullChainPath = await certTool.generateFullchain(saveUUID);
    return Response.json({
      ok: true,
      uuidSavePath: saveUUID,
      certPublicKey: generateCert,
      certPrivateKey: null,
      fullChainPath,
    });
  }
  return Response.json({
    ok: false,
    certPublicKey: null,
  });
};
