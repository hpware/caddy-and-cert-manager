import { NextRequest } from "next/server";
import { getHomeAssistantData } from "@/components/ipad_app/homeAssistant";

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
    if (!body.devices) {
      return Response.json(
        {
          error: "incorrect params",
        },
        { status: 400 },
      );
    }

    // Get all device information in parallel
    const getAllDeviceInfo = await Promise.all(
      body.devices.map(async (device: string) => {
        const res = await getHomeAssistantData(device);
        return res;
      }),
    );

    return Response.json(getAllDeviceInfo);
  } catch (error) {
    console.error("Error in batch HA get:", error);
    return Response.json(
      {
        error: "500 Internal Server Error",
      },
      { status: 500 },
    );
  }
};
