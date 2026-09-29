import fs from "fs/promises";
import path from "path";

import sharp from "sharp";

import { CMS_JOB_IMAGES_DIR } from "./constants";
import { createBoundingBox, type BoundingBox } from "./coordinates";

export interface SavedJobImage {
  id: string;
  pageNumber: number;
  absolutePath: string;
  relativePath: string;
  width: number;
  height: number;
  mimeType: string;
  bbox: BoundingBox;
}

/**
 * Ensures the images/ directory exists under a job workspace.
 */
export async function ensureImagesDir(jobDir: string): Promise<string> {
  const imagesDir = path.join(jobDir, CMS_JOB_IMAGES_DIR);
  await fs.mkdir(imagesDir, { recursive: true });
  return imagesDir;
}

/**
 * Saves an extracted region (or full page image) as images/image-N.webp.
 * Optional width/height skip a redundant sharp.metadata() when already known.
 */
export async function saveExtractedImage(input: {
  jobDir: string;
  index: number;
  pageNumber: number;
  sourceBuffer: Buffer;
  bbox?: BoundingBox;
  width?: number;
  height?: number;
}): Promise<SavedJobImage> {
  await ensureImagesDir(input.jobDir);

  const id = `image-${input.index}`;
  const relativePath = `${CMS_JOB_IMAGES_DIR}/${id}.webp`;
  const absolutePath = path.join(input.jobDir, relativePath);

  let width = input.width ?? 0;
  let height = input.height ?? 0;
  if (width <= 0 || height <= 0) {
    const meta = await sharp(input.sourceBuffer).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  }

  await sharp(input.sourceBuffer).webp({ quality: 85 }).toFile(absolutePath);

  return {
    id,
    pageNumber: input.pageNumber,
    absolutePath,
    relativePath,
    width,
    height,
    mimeType: "image/webp",
    bbox: input.bbox ?? createBoundingBox(0, 0, width, height),
  };
}
