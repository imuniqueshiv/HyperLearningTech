import fs from "fs/promises";
import path from "path";

import sharp from "sharp";

import { CMS_JOB_PAGES_DIR } from "./constants";
import { createBoundingBox } from "./coordinates";
import type { LoadedDocument } from "./document-loader";

export interface ExtractedPageRaster {
  pageNumber: number;
  absolutePath: string;
  relativePath: string;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Ensures the pages/ directory exists under a job workspace.
 */
export async function ensurePagesDir(jobDir: string): Promise<string> {
  const pagesDir = path.join(jobDir, CMS_JOB_PAGES_DIR);
  await fs.mkdir(pagesDir, { recursive: true });
  return pagesDir;
}

/**
 * Rasterizes an image document into pages/page-1.png.
 * PDF page rasterization is handled by the OCR engine when supported.
 */
export async function extractImageAsPage(
  document: LoadedDocument,
  jobDir: string,
  pageNumber: number = 1
): Promise<ExtractedPageRaster> {
  const pagesDir = await ensurePagesDir(jobDir);
  const relativePath = `${CMS_JOB_PAGES_DIR}/page-${pageNumber}.png`;
  const absolutePath = path.join(pagesDir, `page-${pageNumber}.png`);

  const image = sharp(document.buffer);
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  await image.png().toFile(absolutePath);

  return {
    pageNumber,
    absolutePath,
    relativePath,
    width,
    height,
    mimeType: "image/png",
  };
}

/**
 * Writes a PNG buffer as pages/page-N.png.
 */
export async function writePageRaster(input: {
  jobDir: string;
  pageNumber: number;
  pngBuffer: Buffer;
}): Promise<ExtractedPageRaster> {
  const pagesDir = await ensurePagesDir(input.jobDir);
  const relativePath = `${CMS_JOB_PAGES_DIR}/page-${input.pageNumber}.png`;
  const absolutePath = path.join(pagesDir, `page-${input.pageNumber}.png`);

  await fs.writeFile(absolutePath, input.pngBuffer);
  const meta = await sharp(input.pngBuffer).metadata();

  return {
    pageNumber: input.pageNumber,
    absolutePath,
    relativePath,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    mimeType: "image/png",
  };
}

export function pageFullBoundingBox(
  width: number,
  height: number
): ReturnType<typeof createBoundingBox> {
  return createBoundingBox(0, 0, width, height);
}
