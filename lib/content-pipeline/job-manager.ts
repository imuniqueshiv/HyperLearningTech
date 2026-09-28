import fs from "fs/promises";
import path from "path";

import { CMS_METADATA_FILENAME, CMS_PIPELINE_FILENAME } from "./constants";
import { PipelineStage } from "./pipeline-stage";
import { safeTrimOrNull } from "./string-normalize";
import { getJobDirectory } from "./temp-storage";
import type { PipelineState, UploadJobMetadata } from "./types";

/**
 * Absolute path to a job's metadata.json.
 */
export function getMetadataPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_METADATA_FILENAME);
}

/**
 * Absolute path to a job's pipeline.json.
 */
export function getPipelinePath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_PIPELINE_FILENAME);
}

/**
 * Writes upload metadata into the job directory.
 * Uses exclusive create so existing metadata is never overwritten.
 */
export async function writeJobMetadata(
  metadata: UploadJobMetadata
): Promise<void> {
  const metadataPath = getMetadataPath(metadata.jobId);

  try {
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2) + "\n", {
      flag: "wx",
      encoding: "utf8",
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "EEXIST"
    ) {
      throw new Error(`Metadata already exists for job: ${metadata.jobId}`);
    }
    throw error;
  }
}

/**
 * Overwrites existing metadata (status / error updates).
 */
export async function updateJobMetadata(
  metadata: UploadJobMetadata
): Promise<void> {
  const metadataPath = getMetadataPath(metadata.jobId);
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2) + "\n", {
    encoding: "utf8",
  });
}

/**
 * Reads job metadata from disk. Returns null when missing or invalid.
 */
export async function readJobMetadata(
  jobId: string
): Promise<UploadJobMetadata | null> {
  const metadataPath = getMetadataPath(jobId);

  try {
    const raw = await fs.readFile(metadataPath, "utf8");
    const parsed = JSON.parse(raw) as UploadJobMetadata;

    if (!parsed?.jobId || parsed.jobId !== jobId) {
      return null;
    }

    return {
      ...parsed,
      year: parsed.year ?? null,
      examSession: parsed.examSession ?? null,
      sourceFiles: parsed.sourceFiles ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Writes initial pipeline.json into the job directory (exclusive create).
 */
export async function writePipelineState(state: PipelineState): Promise<void> {
  const pipelinePath = getPipelinePath(state.jobId);

  try {
    await fs.writeFile(pipelinePath, JSON.stringify(state, null, 2) + "\n", {
      flag: "wx",
      encoding: "utf8",
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "EEXIST"
    ) {
      throw new Error(`Pipeline state already exists for job: ${state.jobId}`);
    }
    throw error;
  }
}

/**
 * Overwrites pipeline.json for status / stage updates.
 */
export async function updatePipelineState(state: PipelineState): Promise<void> {
  const pipelinePath = getPipelinePath(state.jobId);
  await fs.writeFile(pipelinePath, JSON.stringify(state, null, 2) + "\n", {
    encoding: "utf8",
  });
}

/**
 * Reads pipeline.json. Returns null when missing or invalid.
 */
export async function readPipelineState(
  jobId: string
): Promise<PipelineState | null> {
  const pipelinePath = getPipelinePath(jobId);

  try {
    const raw = await fs.readFile(pipelinePath, "utf8");
    const parsed = JSON.parse(raw) as PipelineState;

    if (!parsed?.jobId || parsed.jobId !== jobId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Builds the initial upload metadata record for a new job.
 */
export function createUploadMetadata(input: {
  jobId: string;
  type: UploadJobMetadata["type"];
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  temporaryPath: string;
  originalFilePath: string;
  branch?: string | null;
  semester?: string | null;
  subjectCode?: string | null;
  year?: number | null;
  examSession?: UploadJobMetadata["examSession"];
  sourceFiles?: UploadJobMetadata["sourceFiles"];
  extractedMetadata?: UploadJobMetadata["extractedMetadata"];
  manualOverrides?: UploadJobMetadata["manualOverrides"];
  checksum?: string | null;
  uploadMode?: UploadJobMetadata["uploadMode"];
  pageCount?: number | null;
  imageCount?: number | null;
  paperCount?: number | null;
  createdBy?: string | null;
  pipelineVersion?: string | null;
}): UploadJobMetadata {
  const now = new Date().toISOString();
  const branch = normalizeOptionalField(input.branch);
  const semester = normalizeOptionalField(input.semester);
  const subjectCode = normalizeOptionalField(input.subjectCode);
  const year =
    typeof input.year === "number" && Number.isFinite(input.year)
      ? input.year
      : null;
  const examSession = input.examSession ?? null;

  return {
    jobId: input.jobId,
    type: input.type,
    filename: input.filename,
    originalFilename: input.originalFilename,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    createdAt: now,
    updatedAt: now,
    status: "queued",
    stage: PipelineStage.QUEUED,
    validationStatus: "pending",
    branch,
    semester,
    subjectCode,
    year,
    examSession,
    extractedMetadata: input.extractedMetadata ?? null,
    manualOverrides: input.manualOverrides ?? {
      branch: Boolean(branch),
      semester: Boolean(semester),
      subjectCode: Boolean(subjectCode),
      year: year != null,
      examSession: Boolean(examSession),
    },
    error: null,
    temporaryPath: input.temporaryPath,
    originalFilePath: input.originalFilePath,
    sourceFiles: input.sourceFiles ?? [],
    checksum: input.checksum ?? null,
    uploadMode: input.uploadMode ?? null,
    pageCount: input.pageCount ?? null,
    imageCount: input.imageCount ?? null,
    paperCount: input.paperCount ?? null,
    createdBy: input.createdBy ?? null,
    pipelineVersion: input.pipelineVersion ?? "cms-phase1-v1",
  };
}

/**
 * Builds the initial pipeline.json for a newly enqueued job.
 */
export function createInitialPipelineState(jobId: string): PipelineState {
  const now = new Date().toISOString();

  return {
    jobId,
    stage: PipelineStage.QUEUED,
    status: "queued",
    enqueuedAt: now,
    updatedAt: now,
    error: null,
    ocr: null,
    layout: null,
    diagrams: null,
    structuring: null,
    schema: null,
    validation: null,
    writing: null,
    review: null,
    save: null,
  };
}

function normalizeOptionalField(value?: string | null): string | null {
  return safeTrimOrNull(value);
}
