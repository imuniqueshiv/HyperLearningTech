import { NextRequest, NextResponse } from "next/server";

import { cmsAuthErrorResponse, requireCmsAuth } from "@/lib/cms-auth";
import { stageExecutionForbiddenResponse } from "@/lib/content-pipeline/cms-route-auth";

/**
 * Phase 1: client stage execution is forbidden.
 * Use /api/cms/recovery (start/resume/retry) — PipelineSupervisor only.
 */
export async function POST(request: NextRequest) {
  try {
    await requireCmsAuth(request, "ADMIN");
    return stageExecutionForbiddenResponse();
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("CMS stage POST error:", error);
    return NextResponse.json(
      { success: false, error: "Request failed.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
