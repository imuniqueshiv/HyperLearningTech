/**
 * Import Session orchestration.
 *
 * One session = one academic document (1 PDF XOR N images).
 * Reuses existing stage services via resumable batch pipeline.
 */

import type { AcceptedUploadMimeType } from "./constants";
import { runBatchPipeline } from "./batch-service";
import { sha256Hex, sha256HexOfBuffers } from "./checksum";
import { enqueueJob, toImportJobRecord } from "./import-queue";
import {
  IMPORT_LIMIT_MESSAGES,
  MAX_CONCURRENT_PIPELINES,
  MAX_IMPORT_IMAGES,
  MAX_NORMAL_PDF_PAGES,
  MAX_PAPERS_PER_IMPORT,
  parseImportUploadMode,
} from "./import-limits";
import { generateJobId } from "./job-id";
import {
  createInitialPipelineState,
  createUploadMetadata,
  writeJobMetadata,
  writePipelineState,
} from "./job-manager";
import { isSupportedMimeType, normalizeMimeType } from "./mime";
import { countPdfPages } from "./pdf-page-count";
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
  /** Required for Phase 1 hard limits. */
  uploadMode?: "normal_pdf" | "images" | "merged_pdf" | null;
  /** Declared paper count — must be 1. Defaults to 1. */
  paperCount?: number | null;
  createdBy?: string | null;
}

function isPdfMime(mime: string): boolean {
  return mime === "application/pdf";
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

function sanitizeOriginalFilename(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "upload";
  const cleaned = base.replace(/[^\w.\- ()[\]]+/g, "_").trim();
  if (!cleaned || cleaned === "." || cleaned === "..") {
    return "upload.bin";
  }
  return cleaned.slice(0, 180);
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
        "UNSUPPORTED_FILE_TYPE",
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

function resolveUploadMode(
  classifiedKind: "pdf" | "images",
  declared: string | null | undefined
): "normal_pdf" | "images" {
  const parsed = parseImportUploadMode(declared);

  if (parsed === "merged_pdf") {
    throw new UploadValidationError(
      "MERGED_PDF_UNSUPPORTED",
      IMPORT_LIMIT_MESSAGES.mergedModeUnsupported
    );
  }

  if (classifiedKind === "images") {
    if (parsed && parsed !== "images") {
      throw new UploadValidationError(
        "UPLOAD_MODE_MISMATCH",
        "Image uploads require uploadMode=images."
      );
    }
    return "images";
  }

  if (!parsed || parsed === "images") {
    throw new UploadValidationError(
      "UPLOAD_MODE_REQUIRED",
      "PDF uploads require uploadMode=normal_pdf."
    );
  }
  return "normal_pdf";
}

function normalizePaperCount(raw: number | null | undefined): number {
  const value = raw == null ? 1 : Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new UploadValidationError(
      "PAPER_COUNT_INVALID",
      "paperCount must be exactly 1."
    );
  }
  if (value > MAX_PAPERS_PER_IMPORT) {
    throw new UploadValidationError(
      "PAPER_LIMIT_EXCEEDED",
      IMPORT_LIMIT_MESSAGES.papers
    );
  }
  return 1;
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
  const uploadMode = resolveUploadMode(classified.kind, input.uploadMode);
  const paperCount = normalizePaperCount(input.paperCount);

  if (paperCount !== 1) {
    throw new UploadValidationError(
      "PAPER_LIMIT_EXCEEDED",
      IMPORT_LIMIT_MESSAGES.papers
    );
  }

  const jobId = generateJobId();
  const jobDir = await createJobDirectory(jobId);

  let sourceFiles: SourceFileRef[] = [];
  let filename = "";
  let originalFilename = "";
  let mimeType: AcceptedUploadMimeType = classified.mimeTypes[0];
  let fileSize = 0;
  let originalFilePath = "";
  let checksum = "";
  let pageCount = 0;
  let imageCount = 0;

  if (classified.kind === "pdf") {
    const file = files[0];
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength === 0) {
      throw new UploadValidationError(
        "FILE_EMPTY",
        "Empty files are not allowed."
      );
    }

    try {
      pageCount = await countPdfPages(buffer);
    } catch {
      throw new UploadValidationError(
        "INVALID_PDF",
        "The PDF could not be opened. Encrypted or corrupt PDFs are rejected."
      );
    }

    const maxPages = MAX_NORMAL_PDF_PAGES;
    if (pageCount > maxPages) {
      throw new UploadValidationError(
        "PAGE_LIMIT_EXCEEDED",
        IMPORT_LIMIT_MESSAGES.normalPdfPages
      );
    }

    checksum = sha256Hex(buffer);
    const saved = await saveOriginalFile({
      jobDir,
      mimeType: classified.mimeTypes[0],
      data: buffer,
    });

    filename = saved.filename;
    originalFilename = sanitizeOriginalFilename(file.name || saved.filename);
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
    if (files.length > MAX_IMPORT_IMAGES) {
      throw new UploadValidationError(
        "IMAGE_LIMIT_EXCEEDED",
        IMPORT_LIMIT_MESSAGES.images
      );
    }

    const pages: Array<{
      mimeType: AcceptedUploadMimeType;
      data: Buffer;
      originalFilename: string;
    }> = [];
    const buffers: Buffer[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.byteLength === 0) {
        throw new UploadValidationError(
          "FILE_EMPTY",
          `Empty file not allowed: ${file.name}`
        );
      }
      buffers.push(buffer);
      pages.push({
        mimeType: classified.mimeTypes[i],
        data: buffer,
        originalFilename: sanitizeOriginalFilename(file.name),
      });
      fileSize += buffer.byteLength;
    }

    checksum = await sha256HexOfBuffers(buffers);
    sourceFiles = await saveOriginalPages({ jobDir, pages });
    const first = sourceFiles[0];
    filename = first.relativePath;
    originalFilename =
      files.length === 1
        ? sanitizeOriginalFilename(files[0].name)
        : `${files.length}-page session (${sanitizeOriginalFilename(files[0].name)}…)`;
    mimeType = first.mimeType as AcceptedUploadMimeType;
    originalFilePath = first.absolutePath;
    pageCount = files.length;
    imageCount = files.length;
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
    checksum,
    uploadMode,
    pageCount,
    imageCount,
    paperCount,
    createdBy: input.createdBy ?? null,
    pipelineVersion: "cms-phase1-v1",
  });

  await writeJobMetadata(metadata);
  await writePipelineState(createInitialPipelineState(jobId));
  await enqueueJob(jobId);

  return toImportJobRecord(metadata);
}

const backgroundPipelines = new Map<string, Promise<void>>();

/**
 * Starts the resumable Import Session pipeline through Writer, then opens review.
 */
export async function startImportSessionPipeline(jobIds: string[]): Promise<{
  succeeded: string[];
  failed: Array<{ jobId: string; error: string }>;
}> {
  return runBatchPipeline({
    jobIds,
    mode: "through-writer",
    maxConcurrency: MAX_CONCURRENT_PIPELINES,
    resumable: true,
    autoReview: true,
  });
}

/**
 * Ensures a single in-flight supervisor for this jobId within the local process.
 *
 * Local CMS only: process-local Map dedupe + filesystem checkpoints under `.cms/`.
 * After a process restart, START/RESUME reloads checkpoints from disk and continues.
 * Not a distributed cloud worker — Git/GitHub is the durable content source of truth.
 */
export function ensureImportSessionPipeline(jobId: string): Promise<void> {
  const existing = backgroundPipelines.get(jobId);
  if (existing) {
    return existing;
  }

  if (backgroundPipelines.size >= MAX_CONCURRENT_PIPELINES) {
    console.warn(
      `[CMS] Concurrent pipeline limit (${MAX_CONCURRENT_PIPELINES}) — job ${jobId} still starts; state is durable for resume.`
    );
  }

  const run = (async () => {
    try {
      await startImportSessionPipeline([jobId]);
    } finally {
      backgroundPipelines.delete(jobId);
    }
  })();

  backgroundPipelines.set(jobId, run);
  return run;
}

/**
 * Best-effort review open for a completed writer job.
 */
export async function openSessionForReview(jobId: string): Promise<void> {
  await startReviewForJob(jobId);
}
