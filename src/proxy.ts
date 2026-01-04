import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/components/core/auth";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (static files)
     * 3. /_static (if you use it)
     * 4. metadata files (favicon.ico, sitemap.xml, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const header = await headers();
  const session = await auth.api.getSession({
    headers: header,
  });
  console.log(session?.user);
  if (!session && url.basePath !== "/login") {
    NextResponse.redirect(new URL("/login", req.url));
  }
  if (session?.user && url.basePath === "/login") {
    NextResponse.redirect(new URL("/", req.url));
  }
}
