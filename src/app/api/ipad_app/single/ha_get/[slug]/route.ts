import { NextRequest } from "next/server";
import { getHomeAssistantData } from "@/components/ipad_app/homeAssistant";

export const GET = async (
  request: NextRequest,
  context: Promise<{
    params: {
      slug: string;
    };
  }>,
) => {
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

    const { params } = await context;
    const slug = params.slug;
    if (!slug) {
      return Response.json(
        {
          error: "incorrect params",
        },
        { status: 400 },
      );
    }

    const res = await getHomeAssistantData(slug);
    return Response.json(res);
  } catch (error) {
    console.error("Error in single HA get:", error);
    return Response.json(
      {
        error: "500 Internal Server Error",
      },
      { status: 500 },
    );
  }
};
