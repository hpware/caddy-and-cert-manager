import { auth } from "@/components/auth";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const { headers: userHeaders } = req;

  const checkUserLoginStatus = await auth.api.getSession({
    headers: userHeaders,
  });
  if (checkUserLoginStatus === null) {
    return new Response(
      "Sorry, but you are not authorized to use this endpoint. Or there is an internal server error. You can ask your server admin to help you.",
      {
        status: 401,
        statusText: "Unauthorized",
      },
    );
  }
  try {
    await auth.api.signOut({
      headers: userHeaders,
    });
    return Response.redirect(new URL("/auth/login", req.url));
  } catch (e: any) {
    return new Response(
      `There is an error trying to log you out. Error: ${e.message}`,
      {
        status: 500,
        statusText: "Internal Server Error",
      },
    );
  }
};
