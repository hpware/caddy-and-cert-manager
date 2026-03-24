import { NextRequest } from "next/server";

export const GET = (req: NextRequest) => {
  return Response.redirect(new URL("/certs", req.nextUrl), 307);
};
