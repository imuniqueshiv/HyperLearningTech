import { NextRequest, NextResponse } from "next/server";

import {
  RecoveryProcessingError,
  runRecoveryAction,
  startImportSessionPipeline,
  type RecoverableStage,
} from "@/lib/content-pipeline/server";

const RECOVERABLE_STAGES = new Set<RecoverableStage>([
  "ocr",
  "layout",
  "diagrams",
  "structuring",
  "schema",
  "validation",
  "writer",
  "review",
  "save",
]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      jobId?: string;
      action?: "retry" | "rollback" | "resume";
      stage?: RecoverableStage | null;
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

    const action = body.action ?? "retry";
    if (action !== "retry" && action !== "rollback" && action !== "resume") {
      return NextResponse.json(
        {
          success: false,
          error: 'action must be "retry", "resume", or "rollback".',
          code: "ACTION_INVALID",
        },
        { status: 400 }
      );
    }

    if (action === "resume") {
      const result = await startImportSessionPipeline([jobId]);
      const failed = result.failed.find((entry) => entry.jobId === jobId);
      if (failed) {
        return NextResponse.json(
          {
            success: false,
            error: failed.error,
            code: "RESUME_FAILED",
            jobId,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          success: true,
          jobId,
          action: "resume",
          message: "Import Session resumed from the last successful stage.",
        },
        { status: 200 }
      );
    }

    if (body.stage != null && !RECOVERABLE_STAGES.has(body.stage)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid recoverable stage.",
          code: "STAGE_INVALID",
        },
        { status: 400 }
      );
    }

    const result = await runRecoveryAction({
      jobId,
      action,
      stage: body.stage ?? null,
    });

    return NextResponse.json(
      {
        success: true,
        jobId: result.jobId,
        action: result.action,
        stageRetried: result.stageRetried,
        restoredFiles: result.restoredFiles,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof RecoveryProcessingError) {
      const status = error.code === "JOB_NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status }
      );
    }

    console.error("CMS Recovery Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Recovery action failed.",
        code: "RECOVERY_FAILED",
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
export const maxDuration = 300;
