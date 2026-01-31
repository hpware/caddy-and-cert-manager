import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "./components/auth";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (static files)
     * 3. /_static (if you use it)
     * 4. metadata files (favicon.ico, sitemap.xml, etc.)
     */
    "/((?!api/|_next/static|_next/image|favicon.ico).*)",
  ],
};

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const path = req.nextUrl.pathname;
  const userHeaders = req.headers;
  const checkUserLoginStatus = await auth.api.getSession({
    headers: userHeaders,
  });
  //console.log(`[MIDDLEWARE] Url Path: ${String(path)}, Login Status: ${checkUserLoginStatus === null ? 1 : 0}`,);
  if (
    !String(path).startsWith("/auth/") &&
    !String(path).startsWith("/guest-resources") &&
    checkUserLoginStatus === null
  ) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  } else if (String(path).startsWith("/auth/") && path !== "/auth/logout") {
    if (checkUserLoginStatus) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
}
