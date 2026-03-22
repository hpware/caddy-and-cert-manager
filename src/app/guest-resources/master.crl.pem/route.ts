import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const GET = async (_request: NextRequest) => {
  const crlPath = path.resolve("./certs/master.crl.pem");
  try {
    const crlPem = await fs.promises.readFile(crlPath, "utf-8");
    return new Response(crlPem, {
      status: 200,
      headers: {
        "Content-Type": "application/pkix-crl; charset=utf-8",
        "Cache-Control": "no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response("CRL file not found", { status: 404 });
    }
    return new Response("Failed to read CRL file", { status: 500 });
  }
};
