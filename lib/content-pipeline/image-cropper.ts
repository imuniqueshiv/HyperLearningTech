import sharp from "sharp";

import type { BoundingBox } from "./coordinates";

export interface CropResult {
  buffer: Buffer;
  width: number;
  height: number;
  /** Actual extract region after clamping to image bounds. */
  extractBox: BoundingBox;
  trimmed: boolean;
}

/**
 * Crops a region from a page/source image and trims surrounding whitespace.
 */
export async function cropImageRegion(input: {
  sourcePath: string;
  bbox: BoundingBox;
  /** Extra pixels around the bbox before trim (default 4). */
  padding?: number;
}): Promise<CropResult> {
  console.log("[Reconstruction] Reading source image metadata");
  const metadataStarted = Date.now();
  const meta = await sharp(input.sourcePath).metadata();
  console.log("[Reconstruction] Read source image metadata", {
    ms: Date.now() - metadataStarted,
  });
  const imageWidth = meta.width ?? 0;
  const imageHeight = meta.height ?? 0;

  if (imageWidth <= 0 || imageHeight <= 0) {
    throw new Error("Source image has invalid dimensions.");
  }

  const padding = input.padding ?? 4;
  const left = clamp(
    Math.floor(input.bbox.x) - padding,
    0,
    Math.max(0, imageWidth - 1)
  );
  const top = clamp(
    Math.floor(input.bbox.y) - padding,
    0,
    Math.max(0, imageHeight - 1)
  );
  const right = clamp(
    Math.ceil(input.bbox.x + input.bbox.width) + padding,
    left + 1,
    imageWidth
  );
  const bottom = clamp(
    Math.ceil(input.bbox.y + input.bbox.height) + padding,
    top + 1,
    imageHeight
  );

  const extractBox: BoundingBox = {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };

  const pipeline = sharp(input.sourcePath).extract({
    left: extractBox.x,
    top: extractBox.y,
    width: extractBox.width,
    height: extractBox.height,
  });

  let trimmed = false;

  try {
    console.log("[Reconstruction] Trimming cropped image");
    const trimStarted = Date.now();
    const trimmedBuffer = await pipeline
      .clone()
      .trim({
        threshold: 12,
      })
      .toBuffer({ resolveWithObject: true });
    console.log("[Reconstruction] Trimmed cropped image", {
      ms: Date.now() - trimStarted,
    });

    if (
      trimmedBuffer.info.width >= 8 &&
      trimmedBuffer.info.height >= 8 &&
      trimmedBuffer.info.width * trimmedBuffer.info.height >= 64
    ) {
      return {
        buffer: trimmedBuffer.data,
        width: trimmedBuffer.info.width,
        height: trimmedBuffer.info.height,
        extractBox,
        trimmed: true,
      };
    }
  } catch (error) {
    console.warn("[Reconstruction] Trim failed; using untrimmed crop", {
      error: error instanceof Error ? error.message : String(error),
    });
    trimmed = false;
  }

  console.log("[Reconstruction] Extracting untrimmed crop");
  const extractStarted = Date.now();
  const extracted = await sharp(input.sourcePath)
    .extract({
      left: extractBox.x,
      top: extractBox.y,
      width: extractBox.width,
      height: extractBox.height,
    })
    .toBuffer({ resolveWithObject: true });
  console.log("[Reconstruction] Extracted untrimmed crop", {
    ms: Date.now() - extractStarted,
  });

  return {
    buffer: extracted.data,
    width: extracted.info.width,
    height: extracted.info.height,
    extractBox,
    trimmed,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
