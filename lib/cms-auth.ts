/**
 * Server-side CMS authentication for the LOCAL authoring tool.
 *
 * Architecture:
 *   Local machine (CMS_LOCAL_MODE=true, not on Vercel) → local-admin CMS
 *   Production / Vercel → CMS routes fail closed (404)
 *
 * Clerk remains available for the public app; it is NOT required for local CMS.
 * CMS_SERVICE_TOKEN is optional for local scripted automation only.
 */

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { roleSatisfies, type CmsRole } from "@/lib/permissions";

export class CmsAuthError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "CmsAuthError";
    this.code = code;
    this.status = status;
  }
}

export interface CmsAuthContext {
  userId: string;
  role: CmsRole;
  via: "service-token" | "local-admin";
}

/**
 * True only for the maintainer's local CMS process.
 * Never true on Vercel (production or preview).
 */
export function isLocalCmsMode(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv === "production" || vercelEnv === "preview") {
    return false;
  }
  // Deployed on Vercel without VERCEL_ENV edge-case
  if (process.env.VERCEL === "1") {
    return false;
  }
  return process.env.CMS_LOCAL_MODE?.trim() === "true";
}

function getServiceToken(): string | null {
  return process.env.CMS_SERVICE_TOKEN?.trim() || null;
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function tokensEqual(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Fail-closed guard for all CMS processing routes.
 * Throws when not in local CMS mode.
 */
export function assertLocalCmsMode(): void {
  if (!isLocalCmsMode()) {
    throw new CmsAuthError(
      "CMS_LOCAL_ONLY",
      "CMS is a local authoring tool. Set CMS_LOCAL_MODE=true on localhost (never on Vercel).",
      404
    );
  }
}

/**
 * Resolves CMS auth for an HTTP request.
 * Production/Vercel: always rejected.
 * Local mode: local-admin ADMIN, or Bearer CMS_SERVICE_TOKEN.
 */
export async function requireCmsAuth(
  request: Request,
  requiredRole: CmsRole = "REVIEWER"
): Promise<CmsAuthContext> {
  assertLocalCmsMode();

  const serviceToken = getServiceToken();
  const bearer = extractBearerToken(request);

  // If a Bearer token is presented, it must match CMS_SERVICE_TOKEN (no silent fallback).
  if (bearer) {
    if (!serviceToken || !tokensEqual(serviceToken, bearer)) {
      throw new CmsAuthError(
        "AUTH_REQUIRED",
        "Invalid CMS service token.",
        401
      );
    }
    const ctx: CmsAuthContext = {
      userId: "service-token",
      role: "ADMIN",
      via: "service-token",
    };
    if (!roleSatisfies(ctx.role, requiredRole)) {
      throw new CmsAuthError(
        "FORBIDDEN",
        "Insufficient CMS role for this operation.",
        403
      );
    }
    return ctx;
  }

  // Local CMS browser access: maintainer machine — no Clerk required.
  if (!roleSatisfies("ADMIN", requiredRole)) {
    throw new CmsAuthError(
      "FORBIDDEN",
      "Insufficient CMS role for this operation.",
      403
    );
  }

  return { userId: "local-admin", role: "ADMIN", via: "local-admin" };
}

/**
 * Server-component page guard for /admin/*.
 * Local mode only; production cannot open the CMS UI.
 */
export async function requireCmsPageAccess(
  requiredRole: CmsRole = "REVIEWER"
): Promise<CmsAuthContext> {
  if (!isLocalCmsMode()) {
    throw new CmsAuthError(
      "CMS_LOCAL_ONLY",
      "CMS admin is available only in local authoring mode.",
      404
    );
  }

  if (!roleSatisfies("ADMIN", requiredRole)) {
    throw new CmsAuthError(
      "FORBIDDEN",
      "Insufficient CMS role for this operation.",
      403
    );
  }

  return { userId: "local-admin", role: "ADMIN", via: "local-admin" };
}

export function cmsAuthErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof CmsAuthError)) {
    return null;
  }
  return NextResponse.json(
    {
      success: false,
      error: error.message,
      code: error.code,
    },
    { status: error.status }
  );
}

/** True when production content writes are explicitly enabled (local CMS only). */
export function isCmsContentWriteEnabled(): boolean {
  if (!isLocalCmsMode()) {
    return false;
  }
  return process.env.CMS_ALLOW_CONTENT_WRITE?.trim() === "true";
}
