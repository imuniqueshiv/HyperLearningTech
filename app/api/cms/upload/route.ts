import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";

import { isJobType } from "@/lib/content-pipeline";
import type { ExamSession } from "@/lib/content-pipeline";
import {
  ensureImportSessionPipeline,
  processImportSession,
  recordJobHistory,
  UploadValidationError,
} from "@/lib/content-pipeline/server";
import {
  isExamSession,
  isValidExamYear,
} from "@/lib/content-pipeline/metadata-extractor";

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

export async function POST(request: NextRequest) {
  try {
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
          error: "A valid job type is required (syllabus, pyq, diagram, bulk).",
          code: "JOB_TYPE_INVALID",
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
    });

    try {
      await recordJobHistory(job.id);
    } catch {
      // History is non-blocking for upload success.
    }

    if (autoPipeline) {
      // Module-level retention + after() so Layout → Reconstruction cannot
      // be dropped when the request context ends.
      after(() => ensureImportSessionPipeline(job.id));
    }

    return NextResponse.json(
      {
        success: true,
        job,
        pipelineStarted: autoPipeline,
      },
      { status: 201 }
    );
  } catch (error) {
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
        error: "Failed to upload file.",
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
// The `after()` callback owns OCR → Writer. Without an explicit duration the
// route can be terminated between Layout and Reconstruction.
export const maxDuration = 300;
