import type { BoundingBox } from "./coordinates";

export interface OrderedItem<T> {
  item: T;
  readingOrder: number;
}

/**
 * Top-to-bottom, left-to-right reading order.
 * Items with similar Y are treated as the same line.
 */
export function sortByReadingOrder<T extends { bbox: BoundingBox }>(
  items: T[],
  lineTolerance = 8
): OrderedItem<T>[] {
  const sorted = [...items].sort((a, b) => {
    const rowA = Math.round(a.bbox.y / lineTolerance) * lineTolerance;
    const rowB = Math.round(b.bbox.y / lineTolerance) * lineTolerance;

    if (rowA !== rowB) {
      return rowA - rowB;
    }

    return a.bbox.x - b.bbox.x;
  });

  return sorted.map((item, index) => ({
    item,
    readingOrder: index + 1,
  }));
}

/**
 * Returns true when two boxes overlap or sit within a vertical gap.
 */
export function isVerticallyNear(
  a: BoundingBox,
  b: BoundingBox,
  maxGap = 28
): boolean {
  const aBottom = a.y + a.height;
  const bBottom = b.y + b.height;
  const gap = Math.max(a.y, b.y) - Math.min(aBottom, bBottom);

  if (gap <= maxGap) {
    return true;
  }

  const horizontalOverlap =
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);

  return horizontalOverlap > 0 && gap <= maxGap * 1.5;
}

/**
 * Horizontal center distance helper for caption/figure pairing.
 */
export function horizontalCenterDistance(
  a: BoundingBox,
  b: BoundingBox
): number {
  const centerA = a.x + a.width / 2;
  const centerB = b.x + b.width / 2;
  return Math.abs(centerA - centerB);
}
