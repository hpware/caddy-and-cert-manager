import { NextRequest } from "next/server";
import { setHomeAssistantData } from "@/components/ipad_app/homeAssistant";

export const POST = async (request: NextRequest) => {
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

    // Parse request body
    const body = await request.json();
    const devices = body.devices as string[];
    const state = body.state;

    if (!devices || !state) {
      return new Response("invalid params", {
        status: 400,
      });
    }

    // Set state for all devices in parallel
    const results = await Promise.all(
      devices.map(async (device) => await setHomeAssistantData(device, state)),
    );

    return Response.json(results);
  } catch (err) {
    console.error("Error in batch HA set:", err);
    return new Response(err instanceof Error ? err.message : "Internal Error", {
      status: 500,
    });
  }
};
