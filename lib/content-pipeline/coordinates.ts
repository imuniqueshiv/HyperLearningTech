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
