import type { BoundingBox } from "./coordinates";
import type { PageLayout } from "./layout";

/** Relative path inside the job workspace (never under content/). */
export type JobRelativePath = string;

export interface RawTextBlock {
  id: string;
  pageNumber: number;
  text: string;
  bbox: BoundingBox;
  confidence?: number;
}

export interface RawImageRef {
  id: string;
  pageNumber: number;
  /** Path relative to the job directory, e.g. images/image-1.webp */
  path: JobRelativePath;
  bbox: BoundingBox;
  width: number;
  height: number;
  mimeType: string;
}

export interface RawTableCell {
  row: number;
  column: number;
  text: string;
  bbox?: BoundingBox;
}

export interface RawTable {
  id: string;
  pageNumber: number;
  /** Path relative to the job directory, e.g. tables/table-1.json */
  path: JobRelativePath;
  bbox: BoundingBox;
  rows: number;
  columns: number;
  cells: RawTableCell[];
}

export interface RawPageRasterStats {
  pngBytes: number;
  nonWhiteSampled: number;
  blank: boolean;
}

export interface RawPage {
  pageNumber: number;
  width: number;
  height: number;
  /** Raster preview relative path when available, e.g. pages/page-1.png */
  imagePath: JobRelativePath | null;
  text: string;
  textBlocks: RawTextBlock[];
  layout: PageLayout;
  /** Present when the page was rasterized (scanned PDF fallback). */
  raster?: RawPageRasterStats;
}

export interface RawDocumentMetadata {
  jobId: string;
  sourceFilename: string;
  sourceMimeType: string;
  engine: string;
  extractedAt: string;
  pageCount: number;
  imageCount: number;
  tableCount: number;
  textBlockCount: number;
  durationMs: number;
}

/**
 * Extracted document content only.
 * No syllabus/PYQ/AI semantics — Phase 5+ owns understanding.
 */
export interface RawDocument {
  version: 1;
  metadata: RawDocumentMetadata;
  pages: RawPage[];
  images: RawImageRef[];
  tables: RawTable[];
}

/** Summary stored on pipeline state for the admin dashboard. */
export interface OcrRunSummary {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  pageCount: number;
  imageCount: number;
  tableCount: number;
  textBlockCount: number;
  engine: string;
  rawDocumentPath: string;
}
