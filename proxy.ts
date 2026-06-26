import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const DEVICE_COOKIE = "hl_device_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const existing = request.cookies.get(DEVICE_COOKIE);

  if (!existing) {
    response.cookies.set({
      name: DEVICE_COOKIE,
      value: crypto.randomUUID(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
