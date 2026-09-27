import type { BoundingBox } from "./coordinates";

/** High-level layout role inferred only from geometry/OCR — not academic meaning. */
export type LayoutBlockKind =
  | "text"
  | "image"
  | "table"
  | "heading"
  | "unknown";

export interface LayoutBlock {
  id: string;
  kind: LayoutBlockKind;
  pageNumber: number;
  bbox: BoundingBox;
  /** Optional confidence from the OCR engine (0–1). */
  confidence?: number;
}

export interface PageLayout {
  pageNumber: number;
  width: number;
  height: number;
  blocks: LayoutBlock[];
}
