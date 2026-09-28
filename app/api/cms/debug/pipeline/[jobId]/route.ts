import { NextRequest, NextResponse } from "next/server";

import { getPipelineDebugSnapshot } from "@/lib/content-pipeline/server";

import { cmsAuthErrorResponse, requireCmsAuth } from "@/lib/cms-auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    await requireCmsAuth(request, "ADMIN");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  try {
    const { jobId: raw } = await context.params;
    const jobId = raw?.trim();

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: "jobId is required.",
          code: "JOB_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    const snapshot = await getPipelineDebugSnapshot(jobId);

    if (!snapshot) {
      return NextResponse.json(
        {
          success: false,
          error: `Job not found: ${jobId}`,
          code: "JOB_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        debug: snapshot,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CMS Pipeline Debug Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load pipeline debug snapshot.",
        code: "DEBUG_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
