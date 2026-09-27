import fs from "fs/promises";
import path from "path";

import {
  CMS_ORIGINAL_BASENAME,
  CMS_ORIGINALS_DIR,
  CMS_UPLOADS_DIR,
} from "./constants";
import type { AcceptedUploadMimeType } from "./constants";
import { getExtensionForMimeType } from "./mime";
import type { SourceFileRef } from "./types";

/**
 * Absolute path to `.cms/uploads` under the project root.
 */
export function getCmsUploadsRoot(): string {
  return path.join(process.cwd(), CMS_UPLOADS_DIR);
}

/**
 * Absolute path to a job workspace directory.
 */
export function getJobDirectory(jobId: string): string {
  return path.join(getCmsUploadsRoot(), jobId);
}

/**
 * Ensures `.cms/uploads` exists.
 */
export async function ensureCmsUploadsDir(): Promise<string> {
  const root = getCmsUploadsRoot();
  await fs.mkdir(root, { recursive: true });
  return root;
}

/**
 * Creates a unique job workspace directory.
 * Throws if the directory already exists (never overwrite).
 */
export async function createJobDirectory(jobId: string): Promise<string> {
  await ensureCmsUploadsDir();

  const jobDir = getJobDirectory(jobId);
  const uploadsRoot = path.resolve(getCmsUploadsRoot());
  const resolvedJobDir = path.resolve(jobDir);

  if (
    resolvedJobDir !== uploadsRoot &&
    !resolvedJobDir.startsWith(uploadsRoot + path.sep)
  ) {
    throw new Error("Invalid job directory path.");
  }

  try {
    await fs.mkdir(jobDir, { recursive: false });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "EEXIST"
    ) {
      throw new Error(`Job directory already exists: ${jobId}`);
    }
    throw error;
  }

  return jobDir;
}

/**
 * Writes the original uploaded file into the job directory as `original.<ext>`.
 * Never overwrites an existing original.
 */
export async function saveOriginalFile(input: {
  jobDir: string;
  mimeType: AcceptedUploadMimeType;
  data: Buffer;
}): Promise<{ filename: string; absolutePath: string }> {
  const extension = getExtensionForMimeType(input.mimeType);
  const filename = `${CMS_ORIGINAL_BASENAME}${extension}`;
  const absolutePath = path.join(input.jobDir, filename);

  try {
    await fs.writeFile(absolutePath, input.data, { flag: "wx" });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "EEXIST"
    ) {
      throw new Error("Original file already exists for this job.");
    }
    throw error;
  }

  return { filename, absolutePath };
}

/**
 * Saves multi-image session pages as `originals/page-001.ext` in upload order.
 */
export async function saveOriginalPages(input: {
  jobDir: string;
  pages: Array<{
    mimeType: AcceptedUploadMimeType;
    data: Buffer;
    originalFilename: string;
  }>;
}): Promise<SourceFileRef[]> {
  const originalsDir = path.join(input.jobDir, CMS_ORIGINALS_DIR);
  await fs.mkdir(originalsDir, { recursive: true });

  const refs: SourceFileRef[] = [];

  for (let index = 0; index < input.pages.length; index += 1) {
    const page = input.pages[index];
    const pageNumber = index + 1;
    const extension = getExtensionForMimeType(page.mimeType);
    const filename = `page-${String(pageNumber).padStart(3, "0")}${extension}`;
    const absolutePath = path.join(originalsDir, filename);
    const relativePath = `${CMS_ORIGINALS_DIR}/${filename}`;

    await fs.writeFile(absolutePath, page.data, { flag: "wx" });

    refs.push({
      absolutePath,
      relativePath,
      originalFilename: page.originalFilename || filename,
      mimeType: page.mimeType,
      fileSize: page.data.byteLength,
      pageNumber,
    });
  }

  return refs;
}
