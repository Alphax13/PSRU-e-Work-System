import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: unknown }) => {
  const isLoggedIn = !!(req as { auth?: { user?: unknown } }).auth?.user;
  const { pathname } = req.nextUrl;

  // Public paths
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Protected: redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
