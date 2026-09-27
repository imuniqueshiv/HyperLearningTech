import fs from "fs/promises";
import path from "path";

import { CMS_JOB_DIAGRAMS_DIR } from "./constants";
import type { DiagramAsset } from "./diagram-metadata";
import {
  allocateUniqueFilename,
  buildDiagramBasename,
  extractQuestionLabel,
  extractSubQuestionLabel,
} from "./filename-generator";
import { cropImageRegion } from "./image-cropper";
import type {
  StructureFigureNode,
  StructureNode,
  StructurePageNode,
  StructureTextNode,
  StructuredDocument,
} from "./structured-document";
import { convertToWebp } from "./webp-converter";

export interface ExtractDiagramsResult {
  document: StructuredDocument;
  diagrams: DiagramAsset[];
  durationMs: number;
}

/**
 * Locates figure nodes, crops from page/source rasters, writes WEBP assets,
 * and updates the StructuredDocument in place (returned copy).
 */
export async function extractDiagrams(input: {
  jobDir: string;
  document: StructuredDocument;
}): Promise<ExtractDiagramsResult> {
  const started = Date.now();
  console.log("[Reconstruction] extractDiagrams started");
  const document: StructuredDocument = structuredClone(input.document);
  const figures = Object.values(document.nodes).filter(
    (node): node is StructureFigureNode => node.kind === "figure"
  );
  console.log("[Reconstruction] Figures located", { count: figures.length });

  const diagramsDir = path.join(input.jobDir, CMS_JOB_DIAGRAMS_DIR);
  console.log("[Reconstruction] Clearing diagrams dir");
  const rmStarted = Date.now();
  await fs.rm(diagramsDir, { recursive: true, force: true });
  await fs.mkdir(diagramsDir, { recursive: true });
  console.log("[Reconstruction] Diagrams dir ready", {
    ms: Date.now() - rmStarted,
  });

  const diagrams: DiagramAsset[] = [];
  const usedNamesByPage = new Map<number, Set<string>>();
  let fallbackIndex = 0;

  for (const figure of figures) {
    const figureStarted = Date.now();
    console.log("[Reconstruction] Figure started", {
      id: figure.id,
      pageNumber: figure.pageNumber,
    });

    const pageNode = findPageNode(document.nodes, figure.pageNumber);
    const sourcePath = await resolveSourceImagePath(
      input.jobDir,
      pageNode,
      figure
    );

    if (!sourcePath) {
      console.log("[Reconstruction] Figure skipped — no source image", {
        id: figure.id,
      });
      continue;
    }

    fallbackIndex += 1;
    const labels = resolveQuestionLabels(document.nodes, figure);
    const basename = buildDiagramBasename({
      questionLabel: labels.questionLabel,
      subQuestionLabel: labels.subQuestionLabel,
      fallbackIndex,
    });

    const used =
      usedNamesByPage.get(figure.pageNumber) ??
      (() => {
        const set = new Set<string>();
        usedNamesByPage.set(figure.pageNumber, set);
        return set;
      })();

    const filename = allocateUniqueFilename(basename, used);
    const pageFolder = `page-${figure.pageNumber}`;
    const relativePath = `${CMS_JOB_DIAGRAMS_DIR}/${pageFolder}/${filename}`;
    const absoluteDir = path.join(diagramsDir, pageFolder);
    const absolutePath = path.join(absoluteDir, filename);

    await fs.mkdir(absoluteDir, { recursive: true });

    console.log("[Reconstruction] Cropping figure", { id: figure.id });
    const cropStarted = Date.now();
    const cropped = await cropImageRegion({
      sourcePath,
      bbox: figure.bbox,
    });
    console.log("[Reconstruction] Crop finished", {
      id: figure.id,
      ms: Date.now() - cropStarted,
    });

    console.log("[Reconstruction] Converting to webp", { id: figure.id });
    const webpStarted = Date.now();
    const webp = await convertToWebp(cropped.buffer);
    console.log("[Reconstruction] Webp finished", {
      id: figure.id,
      ms: Date.now() - webpStarted,
    });

    await fs.writeFile(absolutePath, webp.buffer);
    console.log("[Reconstruction] Figure finished", {
      id: figure.id,
      ms: Date.now() - figureStarted,
    });

    const diagramId = `diagram-${figure.pageNumber}-${diagrams.length + 1}`;
    const asset: DiagramAsset = {
      id: diagramId,
      figureNodeId: figure.id,
      pageNumber: figure.pageNumber,
      bbox: cropped.extractBox,
      path: relativePath,
      filename,
      width: webp.width,
      height: webp.height,
      format: "webp",
      fileSizeBytes: webp.fileSizeBytes,
    };

    diagrams.push(asset);

    const updatedFigure: StructureFigureNode = {
      ...figure,
      path: relativePath,
      width: webp.width,
      height: webp.height,
      mimeType: "image/webp",
      format: "webp",
      fileSizeBytes: webp.fileSizeBytes,
      sourcePath: figure.path,
    };
    document.nodes[figure.id] = updatedFigure;
  }

  document.diagrams = diagrams;
  document.metadata = {
    ...document.metadata,
    figureCount: diagrams.length,
    diagramCount: diagrams.length,
  };

  console.log("[Reconstruction] extractDiagrams finished", {
    ms: Date.now() - started,
    diagramCount: diagrams.length,
  });

  return {
    document,
    diagrams,
    durationMs: Date.now() - started,
  };
}

async function resolveSourceImagePath(
  jobDir: string,
  pageNode: StructurePageNode | null,
  figure: StructureFigureNode
): Promise<string | null> {
  const candidates = [
    pageNode?.imagePath,
    figure.sourcePath,
    figure.path,
  ].filter((value): value is string => Boolean(value));

  for (const relative of candidates) {
    const absolute = path.join(jobDir, relative);
    try {
      await fs.access(absolute);
      return absolute;
    } catch {
      // try next candidate
    }
  }

  return null;
}

function findPageNode(
  nodes: Record<string, StructureNode>,
  pageNumber: number
): StructurePageNode | null {
  for (const node of Object.values(nodes)) {
    if (node.kind === "page" && node.pageNumber === pageNumber) {
      return node;
    }
  }
  return null;
}

function resolveQuestionLabels(
  nodes: Record<string, StructureNode>,
  figure: StructureFigureNode
): {
  questionLabel: string | null;
  subQuestionLabel: string | null;
} {
  let questionLabel: string | null = null;
  let subQuestionLabel: string | null = null;
  let currentId = figure.parentId;

  while (currentId) {
    const node = nodes[currentId];
    if (!node) {
      break;
    }

    if (node.kind === "sub_question" && !subQuestionLabel) {
      subQuestionLabel = extractSubQuestionLabel(
        (node as StructureTextNode).text ?? ""
      );
    }

    if (node.kind === "question" && !questionLabel) {
      questionLabel = extractQuestionLabel(
        (node as StructureTextNode).text ?? ""
      );
    }

    if (node.kind === "page" || node.kind === "document") {
      break;
    }

    currentId = node.parentId;
  }

  return { questionLabel, subQuestionLabel };
}
