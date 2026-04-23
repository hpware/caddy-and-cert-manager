import { auth } from "@/components/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  let status = 500;
  try {
    const Headers = await headers();
    const yourSession = await auth.api.getSession({ headers: Headers });
    if (!yourSession) {
      status = 401;
      throw new Error("Unauthorized");
    }
    if (yourSession.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    const fetchPorcaVersion = await fetch(
      `${process.env.PROTECTION_PROXY_URL}/api/version`,
    );
    const porcaVersion = await fetchPorcaVersion.text();
    return Response.json(
      {
        data: {
          porcaVersion,
          nextjsVersion: process.env.NEXT_VERSION,
          ccmVerion: process.env.CCM_VERSION,
        },
        error: null,
      },
      { status: 200 },
    );
  } catch (e) {
    return Response.json(
      {
        data: null,
        error: String(e),
      },
      { status },
    );
  }
};
