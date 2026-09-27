import { NextRequest, NextResponse } from "next/server";

import { isJobType } from "@/lib/content-pipeline";
import {
  BulkUploadError,
  getBatchStatus,
  processBulkUpload,
  type BatchPipelineMode,
} from "@/lib/content-pipeline/server";

function readOptionalField(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    // Also accept repeated "file" fields for flexibility.
    const singleFiles = formData
      .getAll("file")
      .filter((entry): entry is File => entry instanceof File);

    const allFiles = [...files, ...singleFiles];
    const typeEntry = formData.get("type");
    const branch = readOptionalField(formData.get("branch"));
    const semester = readOptionalField(formData.get("semester"));
    const subjectCode = readOptionalField(formData.get("subjectCode"));
    const maxConcurrencyRaw = readOptionalField(formData.get("maxConcurrency"));
    const autoPipeline =
      readOptionalField(formData.get("autoPipeline")) === "true";
    const pipelineMode =
      (readOptionalField(
        formData.get("pipelineMode")
      ) as BatchPipelineMode | null) ?? "through-writer";

    if (allFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one file is required.",
          code: "FILES_REQUIRED",
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

    const maxConcurrency = maxConcurrencyRaw
      ? Number.parseInt(maxConcurrencyRaw, 10)
      : 3;

    const result = await processBulkUpload({
      files: allFiles,
      type: typeEntry,
      branch,
      semester,
      subjectCode,
      maxConcurrency: Number.isFinite(maxConcurrency) ? maxConcurrency : 3,
      autoPipeline,
      pipelineMode,
    });

    return NextResponse.json(
      {
        success: true,
        batchId: result.batchId,
        jobs: result.jobs,
        created: result.created,
        failed: result.failed,
        pipeline: result.pipeline ?? null,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof BulkUploadError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: 400 }
      );
    }

    console.error("CMS Bulk Upload Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Bulk upload failed.",
        code: "BULK_UPLOAD_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const batchId = request.nextUrl.searchParams.get("batchId")?.trim();
    if (!batchId) {
      return NextResponse.json(
        {
          success: false,
          error: "batchId is required.",
          code: "BATCH_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    const status = await getBatchStatus(batchId);
    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: `Batch not found: ${batchId}`,
          code: "BATCH_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, batch: status }, { status: 200 });
  } catch (error) {
    console.error("CMS Bulk Status Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load batch status.",
        code: "BATCH_STATUS_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
