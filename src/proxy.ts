import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PAGE_PATHS = ["/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth") || PUBLIC_PAGE_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api");

  if (!req.auth) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
