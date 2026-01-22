import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  let statusCode = 200;
  try {
    const body = await req.json();
    if (!(body.format && body.name)) {
      statusCode = 500;
      throw new Error("Missing required fields");
    }
  } catch (e: any) {
    console.error(e);
    return Response.json(
      {
        error: e.message,
      },
      {
        status: statusCode,
      },
    );
  }
};
