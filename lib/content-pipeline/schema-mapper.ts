import type { DiagramAsset } from "./diagram-metadata";
import type {
  StructureFigureNode,
  StructureNode,
  StructureTextNode,
  StructuredDocument,
} from "./structured-document";
import { safeTrim } from "./string-normalize";

export interface LayoutSnapshotPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: Array<{
    id: string;
    kind: string;
    readingOrder: number;
    text?: string;
    path?: string;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
}

export interface LayoutSnapshot {
  jobId: string;
  sourceFilename: string;
  pageCount: number;
  pages: LayoutSnapshotPage[];
  diagrams: Array<{
    id: string;
    figureNodeId: string;
    path: string;
    filename: string;
    pageNumber: number;
    width: number;
    height: number;
  }>;
  /** Phase 2: table cell text from structure nodes when available. */
  tables?: Array<{
    id: string;
    pageNumber: number;
    path?: string;
    rows?: number;
    columns?: number;
  }>;
}

/**
 * Compacts StructuredDocument into a Gemini-friendly layout snapshot.
 */
export function buildLayoutSnapshot(
  document: StructuredDocument
): LayoutSnapshot {
  const pages: LayoutSnapshotPage[] = [];

  for (const pageId of document.pageIds) {
    const page = document.nodes[pageId];
    if (!page || page.kind !== "page") {
      continue;
    }

    const blocks = collectOrderedBlocks(document.nodes, page.childIds).map(
      (node) => {
        const base = {
          id: node.id,
          kind: node.kind,
          readingOrder: node.readingOrder,
          bbox: {
            x: node.bbox.x,
            y: node.bbox.y,
            width: node.bbox.width,
            height: node.bbox.height,
          },
        };

        if ("text" in node && typeof node.text === "string") {
          return { ...base, text: node.text };
        }

        if (node.kind === "figure") {
          const figure = node as StructureFigureNode;
          return { ...base, path: figure.path };
        }

        return base;
      }
    );

    pages.push({
      pageNumber: page.pageNumber,
      width: page.width,
      height: page.height,
      blocks,
    });
  }

  const diagrams = (document.diagrams ?? []).map((diagram) => ({
    id: diagram.id,
    figureNodeId: diagram.figureNodeId,
    path: diagram.path,
    filename: diagram.filename,
    pageNumber: diagram.pageNumber,
    width: diagram.width,
    height: diagram.height,
  }));

  const tables = Object.values(document.nodes)
    .filter((node) => node.kind === "table")
    .map((node) => {
      const table = node as import("./structured-document").StructureTableNode;
      return {
        id: table.id,
        pageNumber: table.pageNumber,
        path: table.path,
        rows: table.rows,
        columns: table.columns,
      };
    });

  return {
    jobId: document.metadata.jobId,
    sourceFilename: document.metadata.sourceFilename,
    pageCount: document.metadata.pageCount,
    pages,
    diagrams,
    tables,
  };
}

/**
 * Collects nearby text for a diagram on the same page.
 */
export function collectSurroundingText(
  document: StructuredDocument,
  diagram: DiagramAsset,
  limit = 8
): string[] {
  const pageId = document.pageIds.find((id) => {
    const node = document.nodes[id];
    return node?.kind === "page" && node.pageNumber === diagram.pageNumber;
  });

  if (!pageId) {
    return [];
  }

  const page = document.nodes[pageId];
  if (!page || page.kind !== "page") {
    return [];
  }

  const texts = collectOrderedBlocks(document.nodes, page.childIds)
    .filter((node): node is StructureTextNode => "text" in node)
    .map((node) => safeTrim((node as StructureTextNode).text))
    .filter(Boolean);

  return texts.slice(0, limit);
}

function collectOrderedBlocks(
  nodes: Record<string, StructureNode>,
  childIds: string[]
): StructureNode[] {
  const result: StructureNode[] = [];

  function walk(ids: string[]) {
    const ordered = [...ids]
      .map((id) => nodes[id])
      .filter(Boolean)
      .sort((a, b) => a.readingOrder - b.readingOrder);

    for (const node of ordered) {
      result.push(node);
      if (node.childIds.length > 0) {
        walk(node.childIds);
      }
    }
  }

  walk(childIds);
  return result;
}
