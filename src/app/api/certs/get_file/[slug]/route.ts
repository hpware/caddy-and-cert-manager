import { NextRequest } from "next/server";
import fs from "node:fs";
import * as certTool from "@/components/certTooler";

export const GET = async (
  request: NextRequest,
  props: { params: Promise<{ slug: string }> },
) => {
  try {
    const { slug } = await props.params;
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        slug,
      )
    ) {
      return new Response("Invalid slug", { status: 400 });
    }
    const params = new URLSearchParams(request.url.split("?")[1]);
    const get = params.get("get");
    const type = params.get("type");
    if (!type || !["public", "private", "public_fullchain"].includes(type)) {
      return new Response("Invalid type", { status: 400 });
    }

    let getText: string;

    if (type === "public_fullchain") {
      // Generate fullchain on-demand
      getText = await certTool.generateFullchain(slug);
    } else {
      getText = await fs.promises.readFile(
        `./certs/created/${slug}_${
          type === "public" ? "pub" : "private_key"
        }.pem`,
        "utf8",
      );
    }

    return new Response(getText, {
      headers: {
        "Content-Type":
          get === "download" ? "application/octet-stream" : "text/plain",
        ...(get === "download" && {
          "Content-Disposition": `attachment; filename=${slug}_${
            type === "public_fullchain" ? "fullchain" : type
          }.pem`,
        }),
      },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 });
  }
};
