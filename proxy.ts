/**
 * Next.js 16 Proxy (request boundary).
 *
 * - Always sets hl_device_id for analytics.
 * - /admin/* is a LOCAL CMS authoring surface: blocked on Vercel / non-local mode.
 * - When Clerk is configured (public app auth), runs clerkMiddleware.
 * - /api/cms/* is fail-closed server-side via requireCmsAuth → isLocalCmsMode().
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const DEVICE_COOKIE = "hl_device_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

function applyDeviceCookie(
  request: NextRequest,
  response: NextResponse
): NextResponse {
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

function isAdminPagePath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isCmsApiPath(pathname: string): boolean {
  return pathname === "/api/cms" || pathname.startsWith("/api/cms/");
}

function isLocalCmsMode(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv === "production" || vercelEnv === "preview") {
    return false;
  }
  if (process.env.VERCEL === "1") {
    return false;
  }
  return process.env.CMS_LOCAL_MODE?.trim() === "true";
}

function isClerkEnvConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim()
  );
}

async function deviceOnlyProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Block CMS UI and API outside local authoring mode (Vercel / public deploy).
  if (
    !isLocalCmsMode() &&
    (isAdminPagePath(pathname) || isCmsApiPath(pathname))
  ) {
    if (isCmsApiPath(pathname)) {
      return NextResponse.json(
        {
          success: false,
          error: "CMS is a local authoring tool and is unavailable online.",
          code: "CMS_LOCAL_ONLY",
        },
        { status: 404 }
      );
    }
    return applyDeviceCookie(
      request,
      NextResponse.redirect(new URL("/", request.url))
    );
  }

  return applyDeviceCookie(request, NextResponse.next());
}

const proxyHandler = isClerkEnvConfigured()
  ? (() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { clerkMiddleware } = require("@clerk/nextjs/server") as {
        clerkMiddleware: (
          handler: (
            auth: () => Promise<{ userId: string | null }>,
            request: NextRequest
          ) => Promise<Response | void> | Response | void
        ) => (request: NextRequest) => Promise<Response>;
      };

      return clerkMiddleware(async (_auth, request) => {
        return deviceOnlyProxy(request);
      });
    })()
  : deviceOnlyProxy;

export const proxy = proxyHandler;
export default proxyHandler;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
