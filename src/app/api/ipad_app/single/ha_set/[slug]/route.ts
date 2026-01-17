import { NextRequest } from "next/server";
import { setHomeAssistantData } from "@/components/ipad_app/homeAssistant";

interface RouteParams {
  params: {
    slug: string;
  };
}

export const POST = async (request: NextRequest, { params }: RouteParams) => {
  try {
    // Check for authorization
    const bearer = request.headers.get("Authorization");
    if (
      !(
        bearer &&
        bearer.startsWith("Bearer ") &&
        bearer.replace("Bearer ", "") === process.env.SERVICE_REQUIRED_API_TOKEN
      )
    ) {
      return Response.json(
        {
          error: "401 Unauthorized",
        },
        { status: 401 },
      );
    }

    const { slug: device } = params;

    if (!device) {
      return new Response("Device entity ID is required", {
        status: 400,
      });
    }

    // Parse request body
    const body = await request.json();
    const state = String(body.state).toLowerCase();

    const res = await setHomeAssistantData(device, state);
    return Response.json(res);
  } catch (err) {
    console.error("Error in single HA set:", err);
    return new Response(err instanceof Error ? err.message : "Internal Error", {
      status: 500,
    });
  }
};
