import { NextRequest, NextResponse } from "next/server";

import {
  readRebuildReport,
  RebuildProcessingError,
  runRebuildForJob,
  runRebuildForJobs,
  type RebuildMode,
} from "@/lib/content-pipeline/server";

const REBUILD_MODES = new Set<RebuildMode>([
  "full",
  "structuring",
  "schema",
  "validation",
  "writer",
]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      jobId?: string;
      jobIds?: string[];
      mode?: RebuildMode;
    };

    const mode = body.mode ?? "full";
    if (!REBUILD_MODES.has(mode)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "mode must be one of: full, structuring, schema, validation, writer.",
          code: "MODE_INVALID",
        },
        { status: 400 }
      );
    }

    if (body.jobIds && body.jobIds.length > 0) {
      const result = await runRebuildForJobs({
        jobIds: body.jobIds,
        mode,
      });
      return NextResponse.json({ success: true, ...result }, { status: 200 });
    }

    const jobId = body.jobId?.trim();
    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: "jobId or jobIds is required.",
          code: "JOB_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    const result = await runRebuildForJob({ jobId, mode });
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
    if (error instanceof RebuildProcessingError) {
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

    console.error("CMS Rebuild Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Rebuild failed.",
        code: "REBUILD_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("jobId")?.trim();
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

    const report = await readRebuildReport(jobId);
    return NextResponse.json({ success: true, report }, { status: 200 });
  } catch (error) {
    console.error("CMS Rebuild Report Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load rebuild report.",
        code: "REBUILD_REPORT_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
