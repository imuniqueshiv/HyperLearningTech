import type { BoundingBox } from "./coordinates";
import type { JobRelativePath } from "./raw-document";

/**
 * Optimized diagram asset produced by Phase 6.
 * Geometry + file metadata only — no AI captions or semantics.
 */
export interface DiagramAsset {
  id: string;
  figureNodeId: string;
  pageNumber: number;
  bbox: BoundingBox;
  /** Path relative to the job directory, e.g. diagrams/page-1/Q.1-a.webp */
  path: JobRelativePath;
  filename: string;
  width: number;
  height: number;
  format: "webp";
  fileSizeBytes: number;
}

/** Summary stored on pipeline state for the admin dashboard. */
export interface DiagramRunSummary {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  diagramCount: number;
  totalBytes: number;
  diagramsDir: string;
  diagrams: Array<{
    id: string;
    pageNumber: number;
    filename: string;
    path: JobRelativePath;
    width: number;
    height: number;
    fileSizeBytes: number;
  }>;
}
