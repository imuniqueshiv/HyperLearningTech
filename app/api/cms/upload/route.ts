import { NextRequest, NextResponse } from "next/server";

import { isJobType } from "@/lib/content-pipeline";
import type { ExamSession } from "@/lib/content-pipeline";
import {
  processImportSession,
  recordJobHistory,
  UploadValidationError,
} from "@/lib/content-pipeline/server";
import {
  isExamSession,
  isValidExamYear,
} from "@/lib/content-pipeline/metadata-extractor";
import { parseImportUploadMode } from "@/lib/content-pipeline/import-limits";
import {
  pipelineScheduleErrorResponse,
  scheduleImportPipeline,
} from "@/lib/content-pipeline/pipeline-scheduler";
import { cmsAuthErrorResponse, requireCmsAuth } from "@/lib/cms-auth";

function readOptionalField(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function collectFiles(formData: FormData): File[] {
  const files: File[] = [];

  for (const value of formData.getAll("files")) {
    if (value instanceof File && value.size >= 0) {
      files.push(value);
    }
  }

  const single = formData.get("file");
  if (single instanceof File) {
    files.push(single);
  }

  return files;
}

function parseYear(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return isValidExamYear(parsed) ? parsed : null;
}

function parseExamSession(value: string | null): ExamSession | null {
  return isExamSession(value) ? value : null;
}

function parsePaperCount(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCmsAuth(request, "ADMIN");
    const formData = await request.formData();
    const files = collectFiles(formData);
    const typeEntry = formData.get("type");
    const branch = readOptionalField(formData.get("branch"));
    const semester = readOptionalField(formData.get("semester"));
    const subjectCode = readOptionalField(formData.get("subjectCode"));
    const year = parseYear(readOptionalField(formData.get("year")));
    const examSession = parseExamSession(
      readOptionalField(formData.get("examSession"))
    );
    const uploadMode = parseImportUploadMode(
      readOptionalField(formData.get("uploadMode"))
    );
    const paperCount = parsePaperCount(
      readOptionalField(formData.get("paperCount"))
    );
    const autoPipelineRaw = readOptionalField(formData.get("autoPipeline"));
    const autoPipeline = autoPipelineRaw !== "false";

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one file is required.",
          code: "FILE_REQUIRED",
        },
        { status: 400 }
      );
    }

    if (!isJobType(typeEntry)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing content type.",
          code: "TYPE_INVALID",
        },
        { status: 400 }
      );
    }

    const job = await processImportSession({
      files,
      type: typeEntry,
      branch,
      semester,
      subjectCode,
      year,
      examSession,
      uploadMode,
      paperCount,
      createdBy: auth.userId,
    });

    await recordJobHistory(job.id).catch(() => {});

    let schedule: { mode: string; alreadyQueued: boolean } | null = null;
    if (autoPipeline) {
      schedule = await scheduleImportPipeline(job.id);
    }

    return NextResponse.json(
      {
        success: true,
        job,
        schedule,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    const scheduleResponse = pipelineScheduleErrorResponse(error);
    if (scheduleResponse) return scheduleResponse;

    if (error instanceof UploadValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: 400 }
      );
    }

    console.error("CMS Upload Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Upload failed.",
        code: "UPLOAD_FAILED",
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
export const maxDuration = 120;
