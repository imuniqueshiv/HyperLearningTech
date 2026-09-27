/**
 * Import Session orchestration.
 *
 * One session = one academic document (1 PDF XOR N images).
 * Reuses existing stage services via resumable batch pipeline.
 */

import type { AcceptedUploadMimeType } from "./constants";
import { runBatchPipeline } from "./batch-service";
import { enqueueJob, toImportJobRecord } from "./import-queue";
import { generateJobId } from "./job-id";
import {
  createInitialPipelineState,
  createUploadMetadata,
  writeJobMetadata,
  writePipelineState,
} from "./job-manager";
import { isSupportedMimeType, normalizeMimeType } from "./mime";
import { startReviewForJob } from "./review-service";
import {
  createJobDirectory,
  saveOriginalFile,
  saveOriginalPages,
} from "./temp-storage";
import type {
  ExamSession,
  ImportJobRecord,
  JobType,
  SourceFileRef,
} from "./types";
import { UploadValidationError } from "./upload-service";
import { validateUploadConstraints } from "./utils";
import {
  applyHighConfidenceMetadata,
  extractMetadata,
  loadSubjectCatalog,
} from "./metadata-extractor";

export interface ProcessImportSessionInput {
  files: File[];
  type: JobType;
  branch?: string | null;
  semester?: string | null;
  subjectCode?: string | null;
  year?: number | null;
  examSession?: ExamSession | null;
}

function isPdfMime(mime: string): boolean {
  return mime === "application/pdf";
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

/**
 * Validates session file rules:
 * - Exactly one PDF, OR
 * - One or more images (no PDFs mixed)
 */
export function classifySessionFiles(files: File[]): {
  kind: "pdf" | "images";
  mimeTypes: AcceptedUploadMimeType[];
} {
  if (files.length === 0) {
    throw new UploadValidationError(
      "FILE_REQUIRED",
      "At least one file is required for an Import Session."
    );
  }

  const mimeTypes: AcceptedUploadMimeType[] = [];

  for (const file of files) {
    const mimeType = normalizeMimeType(file.type ?? "");
    const constraints = validateUploadConstraints({
      mimeType,
      fileSize: file.size,
      hasFile: true,
    });
    if (!constraints.ok) {
      throw new UploadValidationError(constraints.code, constraints.message);
    }
    if (!isSupportedMimeType(mimeType)) {
      throw new UploadValidationError(
        "MIME_UNSUPPORTED",
        `Unsupported file type "${mimeType}" for ${file.name}.`
      );
    }
    mimeTypes.push(mimeType);
  }

  const pdfCount = mimeTypes.filter(isPdfMime).length;
  const imageCount = mimeTypes.filter(isImageMime).length;

  if (pdfCount > 0 && imageCount > 0) {
    throw new UploadValidationError(
      "SESSION_MIXED_TYPES",
      "An Import Session cannot mix PDFs and images. Upload one PDF, or multiple images as pages."
    );
  }

  if (pdfCount > 1) {
    throw new UploadValidationError(
      "SESSION_MULTIPLE_PDFS",
      "Each PDF must be its own Import Session. Upload one PDF at a time, or select only images."
    );
  }

  if (pdfCount === 1) {
    return { kind: "pdf", mimeTypes };
  }

  return { kind: "images", mimeTypes };
}

/**
 * Creates one Import Session job from 1 PDF or N ordered images.
 * Does not run the pipeline (caller schedules background execution).
 */
export async function processImportSession(
  input: ProcessImportSessionInput
): Promise<ImportJobRecord> {
  const { files, type, branch, semester, subjectCode, year, examSession } =
    input;

  const classified = classifySessionFiles(files);
  const jobId = generateJobId();
  const jobDir = await createJobDirectory(jobId);

  let sourceFiles: SourceFileRef[] = [];
  let filename = "";
  let originalFilename = "";
  let mimeType: AcceptedUploadMimeType = classified.mimeTypes[0];
  let fileSize = 0;
  let originalFilePath = "";

  if (classified.kind === "pdf") {
    const file = files[0];
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength === 0) {
      throw new UploadValidationError(
        "FILE_EMPTY",
        "Empty files are not allowed."
      );
    }

    const saved = await saveOriginalFile({
      jobDir,
      mimeType: classified.mimeTypes[0],
      data: buffer,
    });

    filename = saved.filename;
    originalFilename = file.name || saved.filename;
    mimeType = classified.mimeTypes[0];
    fileSize = buffer.byteLength;
    originalFilePath = saved.absolutePath;
    sourceFiles = [
      {
        absolutePath: saved.absolutePath,
        relativePath: saved.filename,
        originalFilename,
        mimeType,
        fileSize,
        pageNumber: 1,
      },
    ];
  } else {
    const pages: Array<{
      mimeType: AcceptedUploadMimeType;
      data: Buffer;
      originalFilename: string;
    }> = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.byteLength === 0) {
        throw new UploadValidationError(
          "FILE_EMPTY",
          `Empty file not allowed: ${file.name}`
        );
      }
      pages.push({
        mimeType: classified.mimeTypes[i],
        data: buffer,
        originalFilename: file.name,
      });
      fileSize += buffer.byteLength;
    }

    sourceFiles = await saveOriginalPages({ jobDir, pages });
    const first = sourceFiles[0];
    filename = first.relativePath;
    originalFilename =
      files.length === 1
        ? files[0].name
        : `${files.length}-page session (${files[0].name}…)`;
    mimeType = first.mimeType as AcceptedUploadMimeType;
    originalFilePath = first.absolutePath;
  }

  const catalog = await loadSubjectCatalog().catch(() => []);
  const extracted = extractMetadata({
    filename: originalFilename,
    catalog,
    overrides: {
      branch,
      semester,
      subjectCode,
      year: type === "pyq" ? year : null,
      examSession: type === "pyq" ? examSession : null,
    },
  });
  const applied = applyHighConfidenceMetadata(
    {
      branch: branch ?? null,
      semester: semester ?? null,
      subjectCode: subjectCode ?? null,
      year: type === "pyq" ? (year ?? null) : null,
      examSession: type === "pyq" ? (examSession ?? null) : null,
    },
    extracted,
    {
      branch: Boolean(branch),
      semester: Boolean(semester),
      subjectCode: Boolean(subjectCode),
      year: type === "pyq" && year != null,
      examSession: type === "pyq" && Boolean(examSession),
    }
  );

  const metadata = createUploadMetadata({
    jobId,
    type,
    filename,
    originalFilename,
    mimeType,
    fileSize,
    temporaryPath: jobDir,
    originalFilePath,
    branch: applied.branch,
    semester: applied.semester,
    subjectCode: applied.subjectCode,
    year: applied.year,
    examSession: applied.examSession,
    sourceFiles,
    extractedMetadata: extracted,
    manualOverrides: {
      branch: Boolean(branch),
      semester: Boolean(semester),
      subjectCode: Boolean(subjectCode),
      year: type === "pyq" && year != null,
      examSession: type === "pyq" && Boolean(examSession),
    },
  });

  await writeJobMetadata(metadata);
  await writePipelineState(createInitialPipelineState(jobId));
  await enqueueJob(jobId);

  return toImportJobRecord(metadata);
}

/**
 * Strong references so long-lived Node (next dev / standalone) does not GC
 * or drop the pipeline if `after()` aborts waiting between Layout and
 * Reconstruction. Serverless still needs `after(() => promise)` + maxDuration.
 */
const backgroundPipelines = new Map<string, Promise<unknown>>();

/**
 * Runs the full pipeline in the background for one or more sessions.
 * Resumes from the first incomplete stage; auto-opens Review on success.
 */
export async function startImportSessionPipeline(jobIds: string[]): Promise<{
  succeeded: string[];
  failed: { jobId: string; error: string }[];
}> {
  console.log("[Reconstruction] startImportSessionPipeline entering batch", {
    jobIds,
  });
  const result = await runBatchPipeline({
    jobIds,
    mode: "through-writer",
    resumable: true,
    autoReview: true,
  });
  console.log("[Reconstruction] startImportSessionPipeline batch returned", {
    succeeded: result.succeeded,
    failed: result.failed,
  });

  return result;
}

/**
 * Starts (or joins) the import pipeline for a job and returns the retained
 * promise. Safe to pass directly to Next.js `after()`.
 */
export function ensureImportSessionPipeline(jobId: string): Promise<{
  succeeded: string[];
  failed: { jobId: string; error: string }[];
}> {
  const existing = backgroundPipelines.get(jobId);
  if (existing) {
    console.log("[ImportSession] Joining in-flight pipeline", { jobId });
    return existing as Promise<{
      succeeded: string[];
      failed: { jobId: string; error: string }[];
    }>;
  }

  console.log("[ImportSession] Starting retained background pipeline", {
    jobId,
  });

  const work = startImportSessionPipeline([jobId])
    .catch((error) => {
      console.error(
        "[ImportSession] Background pipeline failed:",
        error instanceof Error ? error.message : error
      );
      return {
        succeeded: [] as string[],
        failed: [
          {
            jobId,
            error: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    })
    .finally(() => {
      backgroundPipelines.delete(jobId);
      console.log("[ImportSession] Background pipeline cleared", { jobId });
    });

  backgroundPipelines.set(jobId, work);
  return work;
}

/**
 * Best-effort: move a session into Review after Writer succeeds.
 */
export async function openSessionForReview(jobId: string): Promise<void> {
  try {
    await startReviewForJob(jobId);
  } catch {
    // Review can be started manually if automatic open fails.
  }
}
