import fs from "fs/promises";
import path from "path";

import { CMS_QUEUE_DIR, CMS_QUEUE_FILENAME, QUEUE_STATUSES } from "./constants";
import {
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
} from "./job-manager";
import type {
  ImportJobRecord,
  ImportStatus,
  QueueEntry,
  QueueStatus,
  UploadJobMetadata,
} from "./types";

/** In-process mutex so concurrent uploads serialize queue.json writes. */
let queueLock: Promise<void> = Promise.resolve();

const QUEUE_LOCK_WAIT_MS = 15_000;

async function withQueueLock<T>(fn: () => Promise<T>): Promise<T> {
  const previous = queueLock;
  let release!: () => void;
  queueLock = new Promise<void>((resolve) => {
    release = resolve;
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const waitWithTimeout = new Promise<void>((resolve, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          `Queue lock wait exceeded ${QUEUE_LOCK_WAIT_MS}ms — possible deadlock.`
        )
      );
    }, QUEUE_LOCK_WAIT_MS);
    void previous.then(resolve, reject);
  });

  try {
    await waitWithTimeout;
  } finally {
    if (timer) clearTimeout(timer);
  }

  try {
    return await fn();
  } finally {
    release();
  }
}

function getQueueDir(): string {
  return path.join(process.cwd(), CMS_QUEUE_DIR);
}

function getQueueFilePath(): string {
  return path.join(getQueueDir(), CMS_QUEUE_FILENAME);
}

async function ensureQueueDir(): Promise<void> {
  await fs.mkdir(getQueueDir(), { recursive: true });
}

function isQueueStatus(value: unknown): value is QueueStatus {
  return (
    typeof value === "string" &&
    (QUEUE_STATUSES as readonly string[]).includes(value)
  );
}

function toQueueStatus(status: ImportStatus): QueueStatus | null {
  if (isQueueStatus(status)) {
    return status;
  }
  return null;
}

function normalizeQueueEntries(raw: unknown): QueueEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const entries: QueueEntry[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const jobId = record.jobId;
    const status = record.status;

    if (typeof jobId !== "string" || !jobId.trim()) {
      continue;
    }

    if (!isQueueStatus(status)) {
      continue;
    }

    entries.push({ jobId: jobId.trim(), status });
  }

  return entries;
}

async function readQueueFile(): Promise<QueueEntry[]> {
  await ensureQueueDir();
  const filePath = getQueueFilePath();

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return normalizeQueueEntries(JSON.parse(raw));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }
}

async function writeQueueFile(entries: QueueEntry[]): Promise<void> {
  await ensureQueueDir();
  const filePath = getQueueFilePath();
  await fs.writeFile(filePath, JSON.stringify(entries, null, 2) + "\n", {
    encoding: "utf8",
  });
}

function metadataToImportJob(
  metadata: UploadJobMetadata,
  statusOverride?: ImportStatus,
  stageOverride?: UploadJobMetadata["stage"],
  errorOverride?: string | null,
  ocr?: ImportJobRecord["ocr"],
  layout?: ImportJobRecord["layout"],
  diagrams?: ImportJobRecord["diagrams"],
  structuring?: ImportJobRecord["structuring"],
  schema?: ImportJobRecord["schema"],
  validation?: ImportJobRecord["validation"],
  writing?: ImportJobRecord["writing"],
  review?: ImportJobRecord["review"],
  save?: ImportJobRecord["save"],
  rebuild?: ImportJobRecord["rebuild"]
): ImportJobRecord {
  return {
    id: metadata.jobId,
    type: metadata.type,
    status: statusOverride ?? metadata.status,
    stage: stageOverride ?? metadata.stage,
    branch: metadata.branch ?? null,
    semester: metadata.semester ?? null,
    subjectCode: metadata.subjectCode ?? null,
    year: metadata.year ?? null,
    examSession: metadata.examSession ?? null,
    extractedMetadata: metadata.extractedMetadata ?? null,
    originalFilename: metadata.originalFilename,
    mimeType: metadata.mimeType,
    fileSize: metadata.fileSize,
    temporaryPath: metadata.temporaryPath,
    filename: metadata.filename,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
    error:
      errorOverride !== undefined ? errorOverride : (metadata.error ?? null),
    validationStatus: metadata.validationStatus,
    sourceFiles: metadata.sourceFiles ?? [],
    ocr: ocr ?? null,
    layout: layout ?? null,
    diagrams: diagrams ?? null,
    structuring: structuring ?? null,
    schema: schema ?? null,
    validation: validation ?? null,
    writing: writing ?? null,
    review: review ?? null,
    save: save ?? null,
    rebuild: rebuild ?? null,
  };
}

async function hydrateJob(entry: QueueEntry): Promise<ImportJobRecord | null> {
  const metadata = await readJobMetadata(entry.jobId);

  if (!metadata) {
    return null;
  }

  const pipeline = await readPipelineState(entry.jobId);

  return metadataToImportJob(
    metadata,
    entry.status,
    pipeline?.stage ?? metadata.stage,
    pipeline?.error ?? metadata.error,
    pipeline?.ocr ?? null,
    pipeline?.layout ?? null,
    pipeline?.diagrams ?? null,
    pipeline?.structuring ?? null,
    pipeline?.schema ?? null,
    pipeline?.validation ?? null,
    pipeline?.writing ?? null,
    pipeline?.review ?? null,
    pipeline?.save ?? null,
    pipeline?.rebuild ?? null
  );
}

/**
 * Adds a job reference to the local queue index.
 * Does not process the job.
 */
export async function enqueueJob(jobId: string): Promise<QueueEntry> {
  return withQueueLock(async () => {
    const entries = await readQueueFile();

    if (entries.some((entry) => entry.jobId === jobId)) {
      throw new Error(`Job is already in the queue: ${jobId}`);
    }

    const entry: QueueEntry = {
      jobId,
      status: "queued",
    };

    entries.push(entry);
    await writeQueueFile(entries);
    return entry;
  });
}

/**
 * Claims the oldest queued job for a future worker.
 * Marks it as processing. Does not run OCR/parsing.
 */
export async function dequeueJob(): Promise<ImportJobRecord | null> {
  return withQueueLock(async () => {
    const entries = await readQueueFile();
    const index = entries.findIndex((entry) => entry.status === "queued");

    if (index === -1) {
      return null;
    }

    const entry = entries[index];
    entries[index] = { ...entry, status: "processing" };
    await writeQueueFile(entries);

    const metadata = await readJobMetadata(entry.jobId);
    if (!metadata) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedMetadata: UploadJobMetadata = {
      ...metadata,
      status: "processing",
      updatedAt: now,
    };
    await updateJobMetadata(updatedMetadata);

    const pipeline = await readPipelineState(entry.jobId);
    if (pipeline) {
      await updatePipelineState({
        ...pipeline,
        status: "processing",
        updatedAt: now,
      });
    }

    return metadataToImportJob(updatedMetadata);
  });
}

/**
 * Returns a hydrated job by id, or null when missing.
 */
export async function getJob(jobId: string): Promise<ImportJobRecord | null> {
  const entries = await readQueueFile();
  const entry = entries.find((item) => item.jobId === jobId);

  if (entry) {
    return hydrateJob(entry);
  }

  const metadata = await readJobMetadata(jobId);
  if (!metadata) {
    return null;
  }

  const pipeline = await readPipelineState(jobId);
  return metadataToImportJob(
    metadata,
    metadata.status,
    pipeline?.stage ?? metadata.stage,
    pipeline?.error ?? metadata.error,
    pipeline?.ocr ?? null,
    pipeline?.layout ?? null,
    pipeline?.diagrams ?? null,
    pipeline?.structuring ?? null,
    pipeline?.schema ?? null,
    pipeline?.validation ?? null,
    pipeline?.writing ?? null,
    pipeline?.review ?? null,
    pipeline?.save ?? null,
    pipeline?.rebuild ?? null
  );
}

/**
 * Lists all queued jobs in queue order (FIFO), newest last.
 * Missing job folders are skipped.
 */
export async function listJobs(): Promise<ImportJobRecord[]> {
  const entries = await readQueueFile();
  const jobs: ImportJobRecord[] = [];

  for (const entry of entries) {
    const job = await hydrateJob(entry);
    if (job) {
      jobs.push(job);
    }
  }

  return jobs;
}

/**
 * Updates queue status and mirrors it into metadata.json + pipeline.json.
 * Designed for future workers — not invoked automatically in Phase 3.
 */
export async function updateJobStatus(
  jobId: string,
  status: QueueStatus,
  options?: { error?: string | null; stage?: UploadJobMetadata["stage"] }
): Promise<ImportJobRecord | null> {
  return withQueueLock(async () => {
    const entries = await readQueueFile();
    const index = entries.findIndex((entry) => entry.jobId === jobId);

    if (index === -1) {
      return null;
    }

    entries[index] = { jobId, status };
    await writeQueueFile(entries);

    const metadata = await readJobMetadata(jobId);
    if (!metadata) {
      return null;
    }

    const now = new Date().toISOString();
    const nextError =
      options?.error !== undefined ? options.error : metadata.error;
    const nextStage = options?.stage ?? metadata.stage;

    const updatedMetadata: UploadJobMetadata = {
      ...metadata,
      status,
      stage: nextStage,
      error: nextError,
      updatedAt: now,
    };
    await updateJobMetadata(updatedMetadata);

    const pipeline = await readPipelineState(jobId);
    if (pipeline) {
      await updatePipelineState({
        ...pipeline,
        status,
        stage: nextStage,
        error: nextError,
        updatedAt: now,
      });
    }

    return metadataToImportJob(updatedMetadata);
  });
}

/**
 * Maps an ImportStatus to a QueueStatus when possible.
 */
export function asQueueStatus(status: ImportStatus): QueueStatus | null {
  return toQueueStatus(status);
}

/**
 * Converts metadata into the public ImportJobRecord shape.
 */
export function toImportJobRecord(
  metadata: UploadJobMetadata
): ImportJobRecord {
  return metadataToImportJob(metadata);
}
