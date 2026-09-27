import type { BoundingBox } from "./coordinates";
import type { DiagramAsset } from "./diagram-metadata";
import type { JobRelativePath } from "./raw-document";

/**
 * Structural node kinds only.
 * No academic/semantic labels (unit, marks, subject, etc.).
 */
export type StructureNodeKind =
  | "document"
  | "page"
  | "header"
  | "footer"
  | "title"
  | "heading"
  | "section"
  | "paragraph"
  | "question"
  | "sub_question"
  | "figure"
  | "caption"
  | "table"
  | "unknown";

export interface StructureNodeBase {
  id: string;
  kind: StructureNodeKind;
  pageNumber: number;
  bbox: BoundingBox;
  parentId: string | null;
  childIds: string[];
  readingOrder: number;
  text?: string;
}

export interface StructureDocumentNode extends StructureNodeBase {
  kind: "document";
  text: string;
}

export interface StructurePageNode extends StructureNodeBase {
  kind: "page";
  width: number;
  height: number;
  imagePath: JobRelativePath | null;
}

export interface StructureTextNode extends StructureNodeBase {
  kind:
    | "header"
    | "footer"
    | "title"
    | "heading"
    | "section"
    | "paragraph"
    | "question"
    | "sub_question"
    | "caption"
    | "unknown";
  text: string;
  confidence?: number;
}

export interface StructureFigureNode extends StructureNodeBase {
  kind: "figure";
  path: JobRelativePath;
  width: number;
  height: number;
  mimeType: string;
  /** Set after diagram extraction. */
  format?: "webp" | "png" | "jpeg";
  fileSizeBytes?: number;
  /** Original OCR/layout image path before diagram extraction. */
  sourcePath?: JobRelativePath;
}

export interface StructureTableNode extends StructureNodeBase {
  kind: "table";
  path: JobRelativePath;
  rows: number;
  columns: number;
}

export type StructureNode =
  | StructureDocumentNode
  | StructurePageNode
  | StructureTextNode
  | StructureFigureNode
  | StructureTableNode;

export interface StructuredDocumentMetadata {
  jobId: string;
  sourceFilename: string;
  sourceMimeType: string;
  detector: string;
  structuredAt: string;
  pageCount: number;
  sectionCount: number;
  questionCount: number;
  subQuestionCount: number;
  figureCount: number;
  tableCount: number;
  captionCount: number;
  durationMs: number;
  /** Populated by diagram extraction. */
  diagramCount?: number;
}

/**
 * Generic layout structure derived from RawDocument.
 * Input for future Gemini structuring — never writes content JSON.
 */
export interface StructuredDocument {
  version: 1;
  metadata: StructuredDocumentMetadata;
  /** Root document node id. */
  rootId: string;
  /** Flat node map for stable parent/child traversal. */
  nodes: Record<string, StructureNode>;
  /** Page node ids in reading order. */
  pageIds: string[];
  /** Optimized diagram assets (Phase 6). */
  diagrams?: DiagramAsset[];
}

/** Summary stored on pipeline state for the admin dashboard. */
export interface LayoutRunSummary {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  pageCount: number;
  sectionCount: number;
  questionCount: number;
  subQuestionCount: number;
  figureCount: number;
  tableCount: number;
  captionCount: number;
  detector: string;
  structuredDocumentPath: string;
}
