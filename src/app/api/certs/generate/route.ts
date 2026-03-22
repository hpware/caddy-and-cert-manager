import { NextRequest } from "next/server";
import * as certTool from "@/components/core/certTooler";
import { generateCertificateWithRegen } from "@/components/core/regenClient";
import { getRegenSettings } from "@/components/core/regenSettings";
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
    const regenSettings = await getRegenSettings();
    const shouldUseRegen =
      regenSettings.certUrl.length > 0 && regenSettings.apiKey.length > 0;
    if (mode === "easy") {
      const { CN, OU, O, L, ST, C } = Object.fromEntries(formData);
      const saveUUID = crypto.randomUUID();
      const regenCert = shouldUseRegen
        ? await generateCertificateWithRegen({
            mode: "easy",
            days: Number(Days),
            saveUUID,
            cn: CN.toString(),
            ou: OU ? OU.toString() : "BunCCR",
            o: O ? O.toString() : "BunCCR",
            l: L ? L.toString() : "Da-an District",
            st: ST ? ST.toString() : "Taipei City",
            c: C ? C.toString() : "TW",
            subjectAltNameData:
              formData.get("subjectAltNameData")?.toString() ?? "",
          })
        : null;
      const certCsrAndPrivateKey = shouldUseRegen
        ? null
        : await certTool.generateCSR(
            saveUUID,
            CN.toString(),
            OU ? OU.toString() : "BunCCR",
            O ? O.toString() : "BunCCR",
            L ? L.toString() : "Da-an District",
            ST ? ST.toString() : "Taipei City",
            C ? C.toString() : "TW",
          );

      const localCert = shouldUseRegen
        ? null
        : await certTool.generateCertificate(
            certCsrAndPrivateKey!.csr,
            Number(Days),
            saveUUID,
          );
      const fullChainPath = shouldUseRegen
        ? regenCert!.fullChainPath
        : await certTool.generateFullchain(saveUUID);

      // save into db only after successful certificate generation
      await db
        .insert(schema.certificates)
        .values({
          id: saveUUID,
          name: CN.toString(),
          privateKey: true,
        })
        .execute();
      return Response.json({
        ok: true,
        uuidSavePath: saveUUID,
        certPublicKey: shouldUseRegen
          ? regenCert!.certPublicKey
          : localCert!.pb,
        certPrivateKey: shouldUseRegen
          ? regenCert!.certPrivateKey
          : certCsrAndPrivateKey!.privateKey,
        fullChainPath,
      });
    } else if (mode === "csr") {
      const { CSR } = Object.fromEntries(formData);
      const saveUUID = crypto.randomUUID();
      const regenCert = shouldUseRegen
        ? await generateCertificateWithRegen({
            mode: "csr",
            days: Number(Days),
            saveUUID,
            csrText: await (CSR as File).text(),
            subjectAltNameData:
              formData.get("subjectAltNameData")?.toString() ?? "",
          })
        : null;
      const localCert = shouldUseRegen
        ? null
        : await certTool.generateCertificate(
            await (CSR as File).text(),
            Number(Days),
            saveUUID,
          );
      // save into db
      await db
        .insert(schema.certificates)
        .values({
          id: saveUUID,
          name: shouldUseRegen ? regenCert!.itemCN : localCert!.itemCN,
          privateKey: false,
        })
        .execute();
      const fullChainPath = shouldUseRegen
        ? regenCert!.fullChainPath
        : await certTool.generateFullchain(saveUUID);
      return Response.json({
        ok: true,
        uuidSavePath: saveUUID,
        certPublicKey: shouldUseRegen
          ? regenCert!.certPublicKey
          : localCert!.pb,
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
