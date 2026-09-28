import { NextRequest, NextResponse } from "next/server";

import {
  RecoveryProcessingError,
  runRecoveryAction,
  type RecoverableStage,
} from "@/lib/content-pipeline/server";
import {
  pipelineScheduleErrorResponse,
  scheduleImportPipeline,
} from "@/lib/content-pipeline/pipeline-scheduler";

import { cmsAuthErrorResponse, requireCmsAuth } from "@/lib/cms-auth";

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
    await requireCmsAuth(request, "ADMIN");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  try {
    const body = (await request.json()) as {
      jobId?: string;
      action?: "retry" | "rollback" | "resume" | "cancel" | "start";
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
    if (
      action !== "retry" &&
      action !== "rollback" &&
      action !== "resume" &&
      action !== "cancel" &&
      action !== "start"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'action must be "start", "retry", "resume", "cancel", or "rollback".',
          code: "ACTION_INVALID",
        },
        { status: 400 }
      );
    }

    if (action === "cancel") {
      const { requestImportCancellation } =
        await import("@/lib/content-pipeline/import-cancel");
      const result = await requestImportCancellation(jobId);
      return NextResponse.json(
        {
          success: true,
          jobId: result.jobId,
          action: "cancel",
          cancelled: result.cancelled,
          message: result.message,
        },
        { status: 200 }
      );
    }

    // start / resume / retry → durable schedule (PipelineSupervisor via worker).
    // Never run the full pipeline inline inside this HTTP handler.
    if (action === "start" || action === "resume" || action === "retry") {
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

      const schedule = await scheduleImportPipeline(jobId);
      return NextResponse.json(
        {
          success: true,
          jobId,
          action,
          schedule,
          message:
            action === "start"
              ? "Import Session pipeline scheduled under PipelineSupervisor."
              : action === "resume"
                ? "Import Session resume scheduled from the last successful stage."
                : "Import Session retry scheduled under PipelineSupervisor.",
        },
        { status: 200 }
      );
    }

    // rollback only — local save undo (no pipeline execution)
    const result = await runRecoveryAction({
      jobId,
      action: "rollback",
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
    const scheduleResponse = pipelineScheduleErrorResponse(error);
    if (scheduleResponse) return scheduleResponse;

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
export const maxDuration = 300;
