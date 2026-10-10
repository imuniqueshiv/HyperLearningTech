/**
 * Image preprocessing for Tesseract via sharp.
 * Improves contrast on scanned RGPV papers without inventing content.
 */

import sharp from "sharp";

export interface OcrPreprocessResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

/**
 * Greyscale + normalize (+ mild sharpen) for OCR input.
 * Failures throw — callers must surface diagnostics, never silent-skip.
 */
export async function preprocessRasterForOcr(
  input: Buffer | string
): Promise<OcrPreprocessResult> {
  const { data, info } = await sharp(input)
    .rotate()
    .greyscale()
    .normalize()
    .sharpen({ sigma: 0.8 })
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width ?? 0,
    height: info.height ?? 0,
    format: info.format ?? "png",
  };
}

/**
 * Crop a page raster to a horizontal band (column) for separate OCR.
 * Ratios are 0–1 of page width.
 */
export async function cropRasterColumn(
  input: Buffer | string,
  startRatio: number,
  endRatio: number
): Promise<OcrPreprocessResult> {
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width <= 0 || height <= 0) {
    throw new Error("OCR_COLUMN_CROP_INVALID_DIMENSIONS");
  }
  const left = Math.max(0, Math.floor(width * startRatio));
  const right = Math.min(width, Math.ceil(width * endRatio));
  const cropWidth = Math.max(1, right - left);

  const { data, info } = await sharp(input)
    .extract({ left, top: 0, width: cropWidth, height })
    .greyscale()
    .normalize()
    .sharpen({ sigma: 0.8 })
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width ?? cropWidth,
    height: info.height ?? height,
    format: info.format ?? "png",
  };
}
