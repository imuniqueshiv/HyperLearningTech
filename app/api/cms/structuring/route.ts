import { NextRequest, NextResponse } from "next/server";

import {
  StructuringProcessingError,
  runStructuringForJob,
} from "@/lib/content-pipeline/server";

export async function POST(request: NextRequest) {
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

    const result = await runStructuringForJob(jobId);

    return NextResponse.json(
      {
        success: true,
        job: result.job,
        summary: result.summary,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof StructuringProcessingError) {
      const status =
        error.code === "JOB_NOT_FOUND"
          ? 404
          : error.code === "STRUCTURING_IN_PROGRESS"
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

    console.error("CMS Structuring Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Gemini structuring failed.",
        code: "STRUCTURING_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
    },
    { status: 405 }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
