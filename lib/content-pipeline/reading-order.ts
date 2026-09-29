import type { BoundingBox } from "./coordinates";

export interface OrderedItem<T> {
  item: T;
  readingOrder: number;
}

/**
 * Top-to-bottom, left-to-right reading order.
 * Items with similar Y are treated as the same line.
 * When pageWidth is provided and a 2-column layout is detected,
 * processes left column then right column.
 */
export function sortByReadingOrder<T extends { bbox: BoundingBox }>(
  items: T[],
  lineTolerance = 8,
  pageWidth?: number
): OrderedItem<T>[] {
  if (items.length === 0) {
    return [];
  }

  const width =
    pageWidth ??
    Math.max(...items.map((item) => item.bbox.x + item.bbox.width), 1);

  const columns = detectColumnBands(items, width);
  if (columns.length >= 2) {
    const ordered: T[] = [];
    for (const band of columns) {
      const inBand = items.filter((item) => {
        const cx = item.bbox.x + item.bbox.width / 2;
        return cx >= band.minX && cx < band.maxX;
      });
      ordered.push(...sortSingleColumn(inBand, lineTolerance));
    }
    const assigned = new Set(ordered);
    const rest = items.filter((item) => !assigned.has(item));
    ordered.push(...sortSingleColumn(rest, lineTolerance));
    return ordered.map((item, index) => ({
      item,
      readingOrder: index + 1,
    }));
  }

  return sortSingleColumn(items, lineTolerance).map((item, index) => ({
    item,
    readingOrder: index + 1,
  }));
}

function sortSingleColumn<T extends { bbox: BoundingBox }>(
  items: T[],
  lineTolerance: number
): T[] {
  return [...items].sort((a, b) => {
    const rowA = Math.round(a.bbox.y / lineTolerance) * lineTolerance;
    const rowB = Math.round(b.bbox.y / lineTolerance) * lineTolerance;
    if (rowA !== rowB) {
      return rowA - rowB;
    }
    return a.bbox.x - b.bbox.x;
  });
}

function detectColumnBands<T extends { bbox: BoundingBox }>(
  items: T[],
  pageWidth: number
): Array<{ minX: number; maxX: number }> {
  if (items.length < 8 || pageWidth < 200) {
    return [];
  }

  const centers = items
    .map((item) => item.bbox.x + item.bbox.width / 2)
    .sort((a, b) => a - b);

  const mid = pageWidth / 2;
  const left = centers.filter((c) => c < mid * 0.95);
  const right = centers.filter((c) => c > mid * 1.05);

  if (left.length < 3 || right.length < 3) {
    return [];
  }

  const leftRatio = left.length / centers.length;
  if (leftRatio < 0.25 || leftRatio > 0.75) {
    return [];
  }

  return [
    { minX: 0, maxX: mid },
    { minX: mid, maxX: pageWidth + 1 },
  ];
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
