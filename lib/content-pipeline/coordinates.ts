/**
 * Geometric primitives for OCR / layout extraction.
 * Coordinates use a top-left origin in CSS-pixel space unless noted.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export function createBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number
): BoundingBox {
  return {
    x,
    y,
    width,
    height,
  };
}

export function emptyBoundingBox(): BoundingBox {
  return createBoundingBox(0, 0, 0, 0);
}

/**
 * Horizontally slice a wide (column-bleed) bbox using character-offset ratios.
 * Narrow boxes are returned unchanged — vertical stacking already encodes order.
 */
export function sliceBoundingBoxByTextRange(
  bbox: BoundingBox,
  pageWidth: number,
  start: number,
  end: number,
  textLength: number
): BoundingBox {
  const len = Math.max(textLength, 1);
  const startRatio = Math.min(1, Math.max(0, start / len));
  const endRatio = Math.min(1, Math.max(startRatio + 0.04, end / len));
  const wide = bbox.width >= Math.max(pageWidth, 1) * 0.5;
  if (!wide) {
    return { ...bbox };
  }
  const x = bbox.x + bbox.width * startRatio;
  const width = Math.max(16, bbox.width * (endRatio - startRatio));
  return createBoundingBox(x, bbox.y, width, bbox.height);
}
