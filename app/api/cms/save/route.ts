import { NextRequest, NextResponse } from "next/server";

import {
  SaveProcessingError,
  runLocalSaveForJob,
} from "@/lib/content-pipeline/server";

import { cmsAuthErrorResponse, requireCmsAuth } from "@/lib/cms-auth";

export async function POST(request: NextRequest) {
  try {
    await requireCmsAuth(request, "ADMIN");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  try {
    const body = (await request.json()) as { jobId?: string };
    const jobId = body.jobId?.trim();

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

    const result = await runLocalSaveForJob(jobId);

    return NextResponse.json(
      {
        success: true,
        job: result.job,
        summary: result.summary,
        report: result.report,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof SaveProcessingError) {
      const status =
        error.code === "JOB_NOT_FOUND"
          ? 404
          : error.code === "SAVE_IN_PROGRESS"
            ? 409
            : 400;

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status }
      );
    }

    console.error("CMS Local Save Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Local save failed.",
        code: "SAVE_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireCmsAuth(request, "ADMIN");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;
