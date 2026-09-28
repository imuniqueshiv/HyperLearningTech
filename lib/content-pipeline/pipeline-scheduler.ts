/**
 * Schedules Import Session pipeline execution for the LOCAL CMS.
 *
 * Local machine → in-process PipelineSupervisor (filesystem checkpoints under `.cms/`).
 * Production / Vercel → refused (CMS is not an online ingestion service).
 *
 * Do NOT use Redis/BullMQ/Vercel Cron for this local authoring pipeline.
 */

import { NextResponse } from "next/server";

import { assertLocalCmsMode, CmsAuthError } from "@/lib/cms-auth";
import { ensureImportSessionPipeline } from "./import-session-service";

export class PipelineScheduleError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PipelineScheduleError";
    this.code = code;
  }
}

/**
 * Starts (or dedupes) the local in-process pipeline for a job.
 * Checkpoints on disk under `.cms/` support resume after process restart.
 */
export async function scheduleImportPipeline(jobId: string): Promise<{
  mode: "local";
  alreadyQueued: boolean;
}> {
  try {
    assertLocalCmsMode();
  } catch (error) {
    if (error instanceof CmsAuthError) {
      throw new PipelineScheduleError(error.code, error.message);
    }
    throw error;
  }

  // Fire-and-forget local supervisor; Map dedupe prevents duplicate starts.
  void ensureImportSessionPipeline(jobId);
  return { mode: "local", alreadyQueued: false };
}

export function pipelineScheduleErrorResponse(
  error: unknown
): NextResponse | null {
  if (!(error instanceof PipelineScheduleError)) {
    return null;
  }
  const status = error.code === "CMS_LOCAL_ONLY" ? 404 : 503;
  return NextResponse.json(
    {
      success: false,
      error: error.message,
      code: error.code,
    },
    { status }
  );
}
