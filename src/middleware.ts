import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  // Fail closed: without a configured secret no session can be valid, so redirect to login.
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthed = Boolean(secret) && (await verifyToken(token, secret as string));

  if (isAuthed) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Protect everything except the login page, the auth API routes, Next internals,
  // and public static assets.
  matcher: ["/((?!login|api/login|api/logout|_next/static|_next/image|favicon.ico|robots.txt|.*\\.svg$).*)"],
};
