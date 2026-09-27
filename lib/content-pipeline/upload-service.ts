import type { AcceptedUploadMimeType } from "./constants";
import { enqueueJob, toImportJobRecord } from "./import-queue";
import { generateJobId } from "./job-id";
import {
  createInitialPipelineState,
  createUploadMetadata,
  writeJobMetadata,
  writePipelineState,
} from "./job-manager";
import { isSupportedMimeType, normalizeMimeType } from "./mime";
import { createJobDirectory, saveOriginalFile } from "./temp-storage";
import type { ImportJobRecord, JobType } from "./types";
import { validateUploadConstraints } from "./utils";

export class UploadValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "UploadValidationError";
    this.code = code;
  }
}

export interface ProcessUploadInput {
  file: File;
  type: JobType;
  branch?: string | null;
  semester?: string | null;
  subjectCode?: string | null;
}

/**
 * Validates and stores an uploaded file, then enqueues an import job:
 *
 *   .cms/uploads/<jobId>/
 *     original.<ext>
 *     metadata.json
 *     pipeline.json
 *
 *   .cms/queue/queue.json  ← job reference only
 *
 * Does not parse, OCR, or write content JSON.
 */
export async function processUpload(
  input: ProcessUploadInput
): Promise<ImportJobRecord> {
  const { file, type, branch, semester, subjectCode } = input;

  const mimeType = normalizeMimeType(file.type ?? "");
  const fileSize = file.size;

  const constraints = validateUploadConstraints({
    mimeType,
    fileSize,
    hasFile: Boolean(file),
  });

  if (!constraints.ok) {
    throw new UploadValidationError(constraints.code, constraints.message);
  }

  if (!isSupportedMimeType(mimeType)) {
    throw new UploadValidationError(
      "MIME_UNSUPPORTED",
      `Unsupported file type "${mimeType}". Allowed: PDF, PNG, JPG, JPEG, WEBP, TIFF.`
    );
  }

  const acceptedMime = mimeType as AcceptedUploadMimeType;
  const jobId = generateJobId();
  const jobDir = await createJobDirectory(jobId);

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength === 0) {
    throw new UploadValidationError(
      "FILE_EMPTY",
      "Empty files are not allowed."
    );
  }

  const { filename, absolutePath } = await saveOriginalFile({
    jobDir,
    mimeType: acceptedMime,
    data: buffer,
  });

  const metadata = createUploadMetadata({
    jobId,
    type,
    filename,
    originalFilename: file.name || filename,
    mimeType: acceptedMime,
    fileSize: buffer.byteLength,
    temporaryPath: jobDir,
    originalFilePath: absolutePath,
    branch,
    semester,
    subjectCode,
    sourceFiles: [
      {
        absolutePath,
        relativePath: filename,
        originalFilename: file.name || filename,
        mimeType: acceptedMime,
        fileSize: buffer.byteLength,
        pageNumber: 1,
      },
    ],
  });

  await writeJobMetadata(metadata);
  await writePipelineState(createInitialPipelineState(jobId));
  await enqueueJob(jobId);

  return toImportJobRecord(metadata);
}
