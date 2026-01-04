import { NextRequest } from "next/server";
import * as certTool from "@/components/certTooler";

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

    const cert = await certTool.generateCertificate(
      certCsrAndPrivateKey.csr,
      Number(Days),
      saveUUID,
    );
    return Response.json({
      ok: true,
      uuidSavePath: saveUUID,
      certPublicKey: cert,
      certPrivateKey: certCsrAndPrivateKey.privateKey,
    });
  } else if (mode === "csr") {
    const { CSR } = Object.fromEntries(formData);
    const saveUUID = crypto.randomUUID();
    const generateCert = await certTool.generateCertificate(
      await (CSR as File).text(),
      Number(Days),
      saveUUID,
    );
    return Response.json({
      ok: true,
      uuidSavePath: saveUUID,
      certPublicKey: generateCert,
    });
  }
  return Response.json({
    ok: false,
    certPublicKey: null,
  });
};
