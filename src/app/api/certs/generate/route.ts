import { NextRequest } from "next/server";
import * as certTool from "@/components/core/certTooler";
import { db } from "@/components/drizzle/db";
import * as schema from "@/components/drizzle/schema";
import checkUserLoginStatus from "@/components/checkUserLoginStatusAPI";
import randomString from "@/components/randomString";
import { toASCII, toUnicode } from "punycode";
import fs from "node:fs";

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
      const { subjectAltNameData, OU, O, L, ST, C } =
        Object.fromEntries(formData);
      const saveUUID = crypto.randomUUID();
      const SANArray = subjectAltNameData
        .toString()
        .split(",")
        .map((i) => toASCII(i));
      const certCsrAndPrivateKey = await certTool.generateCSR(
        saveUUID,
        SANArray,
        SANArray[0],
        OU ? OU.toString() : "CertManager",
        O ? O.toString() : "CertManager",
        L ? L.toString() : "Da-an District",
        ST ? ST.toString() : "Taipei City",
        C ? C.toString() : "TW",
      );

      const cert = await certTool.generateCertificate(
        certCsrAndPrivateKey.csr,
        Number(Days),
        saveUUID,
      );

      await db.insert(schema.certificates).values({
        id: saveUUID,
        name: toUnicode(SANArray[0]),
        subjectAltNames:
          SANArray.length > 0
            ? SANArray.map((i) => toUnicode(i))
            : [toUnicode(SANArray[0])],
        containsPrivateKey: true,
        certificatePublicKey: cert.pb,
        certificatePrivateKey: certCsrAndPrivateKey.privateKey,
      });

      return Response.json({
        ok: true,
        uuidSavePath: saveUUID,
        error: null,
      });
    } else if (mode === "csr") {
      const { CSR } = Object.fromEntries(formData);
      const saveUUID = crypto.randomUUID();
      const generateCert = await certTool.generateCertificate(
        await (CSR as File).text(),
        Number(Days),
        saveUUID,
      );

      await db.insert(schema.certificates).values({
        id: saveUUID,
        name: generateCert.itemCN,
        subjectAltNames: [generateCert.itemCN],
        containsPrivateKey: false,
        certificatePrivateKey: "",
        certificatePublicKey: generateCert.pb,
      });

      const fullChainPath = await certTool.generateFullchain(saveUUID);
      return Response.json({
        ok: true,
        uuidSavePath: saveUUID,
        error: null,
      });
    } else if (mode === "advanced") {
      const { Days, CN, subjectAltNameData, O, OU, L, ST, C, revokable } =
        Object.fromEntries(formData);
      if (!(CN.toString() && subjectAltNameData.toString())) {
        throw new Error("CN and Subject Alternative Name are required fields.");
      }
      const saveUUID = crypto.randomUUID();
      const certCsrAndPrivateKey = await certTool.generateCSR(
        saveUUID,
        CN.toString(),
        subjectAltNameData
          .toString()
          .split(",")
          .map((i) => toUnicode(i)),
        OU ? OU.toString() : "CertManager",
        O ? O.toString() : "CertManager",
        L ? L.toString() : "Da-an District",
        ST ? ST.toString() : "Taipei City",
        C ? C.toString() : "TW",
      );
      const generateCert = await certTool.generateCertificate(
        certCsrAndPrivateKey.csr,
        Number(Days),
        saveUUID,
      );
      console.log(generateCert.pb);
      await db.insert(schema.certificates).values({
        id: saveUUID,
        name: CN.toString(),
        subjectAltNames: subjectAltNameData
          .toString()
          .split(",")
          .map((i) => toUnicode(i)),
        containsPrivateKey: true,
        certificatePublicKey: generateCert.pb,
        certificatePrivateKey: certCsrAndPrivateKey.privateKey,
      });
      return Response.json({
        ok: true,
        uuidSavePath: saveUUID,
        error: null,
      });
    }
  } catch (e) {
    const errorId = randomString();
    console.error(`[ERRID: ${errorId}] ${e}`);
    return Response.json(
      {
        ok: false,
        uuidSavePath: null,
        error: `Internal Server Error, please view server logs for more info. ERRID: ${errorId}`,
      },
      { status: 500 },
    );
  }
};
