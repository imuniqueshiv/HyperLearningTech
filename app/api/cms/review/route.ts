import { NextRequest, NextResponse } from "next/server";

import {
  ReviewProcessingError,
  getReviewPackage,
  startReviewForJob,
  submitReviewDecision,
} from "@/lib/content-pipeline/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      jobId?: string;
      action?: "start" | "decide";
      decision?: "approve" | "reject" | "request_changes";
      note?: string | null;
      editedPyqs?: unknown;
      editedSyllabus?: unknown;
    };

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

    const action = body.action ?? "start";

    if (action === "start") {
      const result = await startReviewForJob(jobId);
      const reviewPackage = await getReviewPackage(jobId);
      return NextResponse.json(
        {
          success: true,
          job: result.job,
          summary: result.summary,
          review: result.review,
          package: reviewPackage,
        },
        { status: 200 }
      );
    }

    if (action === "decide") {
      if (!body.decision) {
        return NextResponse.json(
          {
            success: false,
            error: "decision is required.",
            code: "DECISION_REQUIRED",
          },
          { status: 400 }
        );
      }

      const result = await submitReviewDecision({
        jobId,
        decision: body.decision,
        note: body.note,
        editedPyqs: body.editedPyqs as never,
        editedSyllabus: body.editedSyllabus as never,
      });
      const reviewPackage = await getReviewPackage(jobId);

      return NextResponse.json(
        {
          success: true,
          job: result.job,
          summary: result.summary,
          review: result.review,
          package: reviewPackage,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unknown review action.",
        code: "UNKNOWN_ACTION",
      },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof ReviewProcessingError) {
      const status =
        error.code === "JOB_NOT_FOUND"
          ? 404
          : error.code === "WRITTEN_REQUIRED" ||
              error.code === "REVIEW_REQUIRED"
            ? 400
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

    console.error("CMS Review Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Review failed.",
        code: "REVIEW_FAILED",
      },
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
export const maxDuration = 60;
