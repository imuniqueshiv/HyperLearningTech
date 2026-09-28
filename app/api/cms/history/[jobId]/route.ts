import { NextRequest, NextResponse } from "next/server";

import {
  getImportHistory,
  HistoryProcessingError,
  recordJobHistory,
  readFailureLog,
  readSaveReport,
  readValidationReport,
  readWriteReport,
} from "@/lib/content-pipeline/server";

import {
  cmsAuthErrorResponse,
  requireCmsAuth,
} from "@/lib/cms-auth";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireCmsAuth(request, "REVIEWER");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  try {
    const { jobId: rawId } = await context.params;
    const jobId = decodeURIComponent(rawId).trim();

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

    const record = await getImportHistory(jobId);
    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: `History not found for job: ${jobId}`,
          code: "HISTORY_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const [failureLog, validationReport, writeReport, saveReport] =
      await Promise.all([
        readFailureLog(jobId),
        readValidationReport(jobId),
        readWriteReport(jobId),
        readSaveReport(jobId),
      ]);

    return NextResponse.json(
      {
        success: true,
        record,
        failureLog,
        validationReport,
        writeReport,
        saveReport,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof HistoryProcessingError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: 400 }
      );
    }

    console.error("CMS History Detail Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load import history details.",
        code: "HISTORY_DETAIL_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireCmsAuth(request, "REVIEWER");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  try {
    const { jobId: rawId } = await context.params;
    const jobId = decodeURIComponent(rawId).trim();
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
    };

    if (body.action === "sync") {
      const record = await recordJobHistory(jobId);
      return NextResponse.json({ success: true, record }, { status: 200 });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unsupported action.",
        code: "ACTION_INVALID",
      },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof HistoryProcessingError) {
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

    console.error("CMS History Sync Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync import history.",
        code: "HISTORY_SYNC_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
