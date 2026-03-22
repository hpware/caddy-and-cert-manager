import fs from "node:fs";
import { generateCSR, generateFullchain, revokeCertificate } from "./certTooler";
import { getRegenSettings } from "./regenSettings";

type RegenGenerateInput = {
  mode: string;
  days: number;
  cn?: string;
  ou?: string;
  o?: string;
  l?: string;
  st?: string;
  c?: string;
  subjectAltNameData?: string;
  csrText?: string;
  saveUUID: string;
};

type RegenGenerateOutput = {
  uuidSavePath: string;
  certPublicKey: string;
  certPrivateKey: string | null;
  fullChainPath: string | null;
  itemCN: string;
};

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getAuthHeaders(apiKey: string) {
  const token = `BEARER TOKEN ${apiKey}`;
  return {
    Authorization: token,
    API_KEY: token,
  };
}

async function parseJsonResponse(req: Response) {
  const text = await req.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(text);
  }
}

function unwrapData(payload: Record<string, unknown>) {
  if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    return payload.data as Record<string, unknown>;
  }

  return payload;
}

function pickString(
  payload: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return null;
}

function getErrorMessage(payload: Record<string, unknown>) {
  const data = unwrapData(payload);
  return (
    pickString(data, ["error", "message", "detail"]) ??
    pickString(payload, ["error", "message", "detail"]) ??
    null
  );
}

export async function fetchRegenAccount() {
  const settings = await getRegenSettings();
  if (!settings.certUrl || !settings.apiKey) {
    throw new Error("Regen settings are not configured.");
  }

  const req = await fetch(`${stripTrailingSlash(settings.certUrl)}/api/regen/account`, {
    headers: {
      ...getAuthHeaders(settings.apiKey),
    },
    cache: "no-store",
  });
  const payload = await parseJsonResponse(req);

  if (!req.ok) {
    throw new Error(getErrorMessage(payload) ?? "Failed to fetch regen account.");
  }

  return payload;
}

export async function generateCertificateWithRegen(
  input: RegenGenerateInput,
): Promise<RegenGenerateOutput> {
  const settings = await getRegenSettings();
  if (!settings.certUrl || !settings.apiKey) {
    throw new Error("Regen settings are not configured.");
  }

  let csrText = input.csrText ?? "";
  let privateKeyPath: string | null = null;

  if (input.mode !== "csr") {
    const localCsr = await generateCSR(
      input.saveUUID,
      input.cn ?? "",
      input.ou ?? "BunCCR",
      input.o ?? "BunCCR",
      input.l ?? "Da-an District",
      input.st ?? "Taipei City",
      input.c ?? "TW",
    );
    csrText = localCsr.csr;
    privateKeyPath = localCsr.privateKey;
  }

  const req = await fetch(`${stripTrailingSlash(settings.certUrl)}/api/regen/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(settings.apiKey),
    },
    body: JSON.stringify({
      csr: csrText,
      days: input.days,
      commonName: input.cn,
      subjectAltNames: input.subjectAltNameData
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      mode: input.mode,
    }),
  });
  const payload = await parseJsonResponse(req);
  const data = unwrapData(payload);

  if (!req.ok) {
    throw new Error(getErrorMessage(payload) ?? "Failed to generate certificate.");
  }

  const certificatePem =
    pickString(data, [
      "certificate",
      "cert",
      "pem",
      "crt",
      "publicKey",
      "public_key",
    ]) ?? pickString(payload, ["certificate", "cert", "pem", "crt"]);

  if (!certificatePem) {
    throw new Error("Regen generate response did not include a certificate.");
  }

  const savePath = `./certs/created/${input.saveUUID}_pub.pem`;
  await fs.promises.mkdir("./certs/created", { recursive: true });
  await fs.promises.writeFile(savePath, certificatePem);

  const fullChainPem =
    pickString(data, ["fullchain", "fullChain", "full_chain"]) ??
    pickString(payload, ["fullchain", "fullChain", "full_chain"]);

  let fullChainPath: string | null = null;
  if (fullChainPem) {
    fullChainPath = `./certs/created/${input.saveUUID}_fullchain.pem`;
    await fs.promises.writeFile(fullChainPath, fullChainPem);
  }
  // When Regen does not supply its own chain, leave fullChainPath as null
  // rather than appending the local CA certificate which may be incorrect.

  const itemCN =
    pickString(data, ["itemCN", "commonName", "cn", "name"]) ??
    input.cn ??
    input.saveUUID;

  return {
    uuidSavePath: input.saveUUID,
    certPublicKey: savePath,
    certPrivateKey: privateKeyPath,
    fullChainPath,
    itemCN,
  };
}

export async function revokeCertificateWithRegen(revokeCertPublicPem: string) {
  const settings = await getRegenSettings();
  if (!settings.certUrl || !settings.apiKey) {
    await revokeCertificate(revokeCertPublicPem);
    return;
  }

  const req = await fetch(`${stripTrailingSlash(settings.certUrl)}/api/regen/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(settings.apiKey),
    },
    body: JSON.stringify({
      cert: revokeCertPublicPem,
      certificate: revokeCertPublicPem,
    }),
  });
  const payload = await parseJsonResponse(req);

  if (!req.ok) {
    throw new Error(getErrorMessage(payload) ?? "Failed to revoke certificate.");
  }
}
