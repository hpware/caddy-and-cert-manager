import { NextRequest } from "next/server";
import fs from "node:fs";

export const GET = async (request: NextRequest) => {
  try {
    const params = new URLSearchParams(request.url.split("?")[1]);
    const get = params.get("get");
    const getText = await fs.promises.readFile(
      "./certs/master.pub.pem",
      "utf8",
    );
    return new Response(getText, {
      headers: {
        "Content-Type":
          get === "download" ? "application/octet-stream" : "text/plain",
        ...(get === "download" && {
          "Content-Disposition":
            "attachment; filename=bunCRR_master_pubkey.pem",
        }),
      },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 });
  }
};
