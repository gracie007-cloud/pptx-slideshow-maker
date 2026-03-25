import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register", "/join"];

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  if (pathname.startsWith("/join/")) {
    return true;
  }

  if (pathname.startsWith("/api/auth/")) {
    return true;
  }

  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const protectedPrefixes = ["/presentations", "/present", "/analytics"];
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|slides/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
