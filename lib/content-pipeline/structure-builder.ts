import {
  classifyTextBlock,
  computeMedianTextHeight,
  type ClassifiedTextBlock,
} from "./block-detector";
import {
  createBoundingBox,
  sliceBoundingBoxByTextRange,
  type BoundingBox,
} from "./coordinates";
import { detectQuestionGroups } from "./question-detector";
import {
  findQuestionMarkerStarts,
  parseQuestionNumber,
  splitOcrBlockIntoMarkerSegments,
  splitTextByQuestionMarkers,
} from "./question-number";
import {
  horizontalCenterDistance,
  isVerticallyNear,
  sortByReadingOrder,
} from "./reading-order";
import type { RawDocument } from "./raw-document";
import { detectSections } from "./section-detector";
import type {
  StructureDocumentNode,
  StructureFigureNode,
  StructureNode,
  StructurePageNode,
  StructureTableNode,
  StructureTextNode,
  StructuredDocument,
} from "./structured-document";

const DETECTOR_NAME = "layout-detector-v1";

/**
 * Builds a StructuredDocument from RawDocument geometry and text blocks.
 */
export function buildStructuredDocument(raw: RawDocument): StructuredDocument {
  const started = Date.now();
  console.log("[Layout] Block detection started", {
    jobId: raw.metadata.jobId,
    pages: raw.pages.length,
  });
  const nodes: Record<string, StructureNode> = {};
  const pageIds: string[] = [];

  const rootId = `doc-${raw.metadata.jobId}`;
  const rootNode: StructureDocumentNode = {
    id: rootId,
    kind: "document",
    pageNumber: 0,
    bbox: createBoundingBox(0, 0, 0, 0),
    parentId: null,
    childIds: [],
    readingOrder: 0,
    text: raw.metadata.sourceFilename,
  };
  nodes[rootId] = rootNode;

  let globalReadingOrder = 0;

  const imagesByPage = groupByPage(raw.images);
  const tablesByPage = groupByPage(raw.tables);

  for (const page of raw.pages) {
    const pageStarted = Date.now();
    console.log("[Layout] Page started", {
      jobId: raw.metadata.jobId,
      pageNumber: page.pageNumber,
      textBlocks: page.textBlocks.length,
    });
    const pageId = `page-${page.pageNumber}`;
    pageIds.push(pageId);

    const pageNode: StructurePageNode = {
      id: pageId,
      kind: "page",
      pageNumber: page.pageNumber,
      bbox: createBoundingBox(0, 0, page.width, page.height),
      parentId: rootId,
      childIds: [],
      readingOrder: ++globalReadingOrder,
      width: page.width,
      height: page.height,
      imagePath: page.imagePath,
    };
    nodes[pageId] = pageNode;
    rootNode.childIds.push(pageId);

    const medianHeight = computeMedianTextHeight(
      page.textBlocks.map((block) => block.bbox.height)
    );

    // Wide blocks on landscape/two-column scans often pack left+right
    // questions into one line. Split per-block with horizontal bbox slices
    // so column-aware grouping can pair (a)/(b) correctly.
    const classifiedFromBlocks = page.textBlocks.flatMap((block) => {
      const trimmed = block.text.trim();
      const segments = splitOcrBlockIntoMarkerSegments(block.text);
      if (segments.length <= 1) {
        return [
          classifyTextBlock({
            id: block.id,
            pageNumber: page.pageNumber,
            text: block.text,
            bbox: block.bbox,
            confidence: block.confidence,
            pageWidth: page.width,
            pageHeight: page.height,
            medianTextHeight: medianHeight,
          }),
        ];
      }
      const textLen = Math.max(trimmed.length, 1);
      return segments.map((segment, segmentIndex) =>
        classifyTextBlock({
          id: `${block.id}-qsplit-${segmentIndex}`,
          pageNumber: page.pageNumber,
          text: segment.text,
          bbox: sliceBoundingBoxByTextRange(
            block.bbox,
            page.width,
            segment.start,
            segment.end,
            textLen
          ),
          confidence: block.confidence,
          pageWidth: page.width,
          pageHeight: page.height,
          medianTextHeight: medianHeight,
        })
      );
    });

    const pageJoined = page.textBlocks.map((b) => b.text).join("\n");
    const pageSegments = splitTextByQuestionMarkers(pageJoined);
    const existingQuestionIndexes = new Set(
      classifiedFromBlocks
        .map((b) => parseQuestionNumber(b.text)?.index)
        .filter((n): n is number => typeof n === "number")
    );

    let classified = classifiedFromBlocks;
    if (pageSegments.length >= 2) {
      const pageHeight = Math.max(page.height, 1);
      const gapFills: ClassifiedTextBlock[] = [];
      for (
        let segmentIndex = 0;
        segmentIndex < pageSegments.length;
        segmentIndex += 1
      ) {
        const segment = pageSegments[segmentIndex];
        const parsed = parseQuestionNumber(segment);
        if (!parsed) continue;
        if (existingQuestionIndexes.has(parsed.index)) continue;
        // Recover question openers hidden inside column-bleed lines without
        // discarding existing per-block (b) sub-question nodes.
        // Prefer geometry from the source block that actually contains the marker.
        const located = locateQuestionMarkerBBox(
          page.textBlocks,
          parsed.index,
          page.width
        );
        gapFills.push(
          classifyTextBlock({
            id: `page${page.pageNumber}-qgap-${parsed.index}-${segmentIndex}`,
            pageNumber: page.pageNumber,
            text: segment,
            bbox:
              located ??
              createBoundingBox(
                0,
                (segmentIndex / Math.max(pageSegments.length, 1)) * pageHeight,
                page.width,
                pageHeight / Math.max(pageSegments.length, 1)
              ),
            confidence: undefined,
            pageWidth: page.width,
            pageHeight: page.height,
            medianTextHeight: medianHeight,
          })
        );
        existingQuestionIndexes.add(parsed.index);
      }
      if (gapFills.length > 0) {
        classified = [...classifiedFromBlocks, ...gapFills];
      }
    }
    console.log("[Layout] Block detection finished", {
      pageNumber: page.pageNumber,
      ms: Date.now() - pageStarted,
      blocks: classified.length,
    });

    const ordered = sortByReadingOrder(classified, 8, page.width).map(
      (entry) => entry.item
    );
    const classifiedById = new Map(ordered.map((block) => [block.id, block]));

    for (const block of ordered) {
      if (block.kind !== "header" && block.kind !== "footer") {
        continue;
      }
      const node = toTextNode(block, pageId, ++globalReadingOrder);
      nodes[node.id] = node;
      pageNode.childIds.push(node.id);
    }

    console.log("[Layout] Section detection started", {
      pageNumber: page.pageNumber,
    });
    const sectionStarted = Date.now();
    const sections = detectSections(page.pageNumber, ordered);
    console.log("[Layout] Section detection finished", {
      pageNumber: page.pageNumber,
      ms: Date.now() - sectionStarted,
      sections: sections.length,
    });

    console.log("[Layout] Question detection started", {
      pageNumber: page.pageNumber,
    });
    const questionStarted = Date.now();
    const questionGroups = detectQuestionGroups(ordered, page.width);
    console.log("[Layout] Question detection finished", {
      pageNumber: page.pageNumber,
      ms: Date.now() - questionStarted,
      questions: questionGroups.length,
    });
    const claimedBlockIds = new Set<string>();

    for (const group of questionGroups) {
      claimedBlockIds.add(group.question.id);
      for (const bodyId of group.bodyBlockIds) {
        claimedBlockIds.add(bodyId);
      }
      for (const sub of group.subQuestions) {
        claimedBlockIds.add(sub.block.id);
        for (const bodyId of sub.bodyBlockIds) {
          claimedBlockIds.add(bodyId);
        }
      }
    }

    console.log("[Layout] Structure assembly started", {
      pageNumber: page.pageNumber,
    });
    const assemblyStarted = Date.now();

    for (const section of sections) {
      const heading = section.heading;
      const sectionNode: StructureTextNode = {
        id: section.id,
        kind: "section",
        pageNumber: page.pageNumber,
        bbox: heading?.bbox ?? createBoundingBox(0, 0, page.width, 24),
        parentId: pageId,
        childIds: [],
        readingOrder: ++globalReadingOrder,
        text: heading?.text ?? "Section",
        confidence: heading?.confidence,
      };
      nodes[section.id] = sectionNode;
      pageNode.childIds.push(section.id);

      if (heading && !nodes[heading.id]) {
        const headingNode = toTextNode(
          heading,
          section.id,
          ++globalReadingOrder
        );
        headingNode.kind = heading.kind === "title" ? "title" : "heading";
        nodes[headingNode.id] = headingNode;
        sectionNode.childIds.push(headingNode.id);
        claimedBlockIds.add(heading.id);
      }

      for (const group of questionGroups) {
        if (nodes[group.question.id]) {
          continue;
        }

        const belongsToSection =
          section.blockIds.includes(group.question.id) ||
          section.blockIds.some((id) => group.bodyBlockIds.includes(id)) ||
          (!heading && questionGroups.indexOf(group) === 0);

        if (!belongsToSection && heading) {
          const headingIndex = ordered.findIndex((b) => b.id === heading.id);
          const questionIndex = ordered.findIndex(
            (b) => b.id === group.question.id
          );
          const nextHeadingIndex = findNextHeadingIndex(
            ordered,
            headingIndex + 1
          );
          if (
            questionIndex <= headingIndex ||
            (nextHeadingIndex !== -1 && questionIndex >= nextHeadingIndex)
          ) {
            continue;
          }
        } else if (!belongsToSection) {
          continue;
        }

        const questionNode = toTextNode(
          group.question,
          section.id,
          ++globalReadingOrder
        );
        questionNode.kind = "question";
        nodes[questionNode.id] = questionNode;
        sectionNode.childIds.push(questionNode.id);

        for (const bodyId of group.bodyBlockIds) {
          const body = classifiedById.get(bodyId);
          if (!body || nodes[bodyId]) {
            continue;
          }
          const bodyNode = toTextNode(
            body,
            questionNode.id,
            ++globalReadingOrder
          );
          nodes[bodyNode.id] = bodyNode;
          questionNode.childIds.push(bodyNode.id);
        }

        for (const sub of group.subQuestions) {
          const subNode = toTextNode(
            sub.block,
            questionNode.id,
            ++globalReadingOrder
          );
          subNode.kind = "sub_question";
          nodes[subNode.id] = subNode;
          questionNode.childIds.push(subNode.id);

          for (const bodyId of sub.bodyBlockIds) {
            const body = classifiedById.get(bodyId);
            if (!body || nodes[bodyId]) {
              continue;
            }
            const bodyNode = toTextNode(body, subNode.id, ++globalReadingOrder);
            nodes[bodyNode.id] = bodyNode;
            subNode.childIds.push(bodyNode.id);
          }
        }
      }

      for (const blockId of section.blockIds) {
        if (claimedBlockIds.has(blockId) || nodes[blockId]) {
          continue;
        }
        const block = classifiedById.get(blockId);
        if (!block) {
          continue;
        }
        if (
          block.kind === "heading" ||
          block.kind === "title" ||
          block.kind === "section"
        ) {
          continue;
        }
        const node = toTextNode(block, section.id, ++globalReadingOrder);
        nodes[node.id] = node;
        sectionNode.childIds.push(node.id);
      }
    }

    for (const image of imagesByPage.get(page.pageNumber) ?? []) {
      const parentId =
        findNearestQuestionParent(nodes, page.pageNumber, image.bbox) ?? pageId;
      const figureNode: StructureFigureNode = {
        id: image.id,
        kind: "figure",
        pageNumber: page.pageNumber,
        bbox: image.bbox,
        parentId,
        childIds: [],
        readingOrder: ++globalReadingOrder,
        path: image.path,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
      };
      nodes[figureNode.id] = figureNode;
      nodes[parentId].childIds.push(figureNode.id);
      globalReadingOrder = attachNearbyCaptions(
        nodes,
        figureNode,
        ordered,
        globalReadingOrder
      );
    }

    for (const table of tablesByPage.get(page.pageNumber) ?? []) {
      const parentId =
        findNearestQuestionParent(nodes, page.pageNumber, table.bbox) ?? pageId;
      const tableNode: StructureTableNode = {
        id: table.id,
        kind: "table",
        pageNumber: page.pageNumber,
        bbox: table.bbox,
        parentId,
        childIds: [],
        readingOrder: ++globalReadingOrder,
        path: table.path,
        rows: table.rows,
        columns: table.columns,
      };
      nodes[tableNode.id] = tableNode;
      nodes[parentId].childIds.push(tableNode.id);
    }

    console.log("[Layout] Structure assembly finished", {
      pageNumber: page.pageNumber,
      ms: Date.now() - assemblyStarted,
    });
    console.log("[Layout] Page finished", {
      pageNumber: page.pageNumber,
      ms: Date.now() - pageStarted,
    });
  }

  const values = Object.values(nodes);

  console.log("[Layout] Document build finished", {
    jobId: raw.metadata.jobId,
    ms: Date.now() - started,
    pages: pageIds.length,
  });

  return {
    version: 1,
    metadata: {
      jobId: raw.metadata.jobId,
      sourceFilename: raw.metadata.sourceFilename,
      sourceMimeType: raw.metadata.sourceMimeType,
      detector: DETECTOR_NAME,
      structuredAt: new Date().toISOString(),
      pageCount: pageIds.length,
      sectionCount: values.filter((node) => node.kind === "section").length,
      questionCount: values.filter((node) => node.kind === "question").length,
      subQuestionCount: values.filter((node) => node.kind === "sub_question")
        .length,
      figureCount: values.filter((node) => node.kind === "figure").length,
      tableCount: values.filter((node) => node.kind === "table").length,
      captionCount: values.filter((node) => node.kind === "caption").length,
      durationMs: Date.now() - started,
    },
    rootId,
    nodes,
    pageIds,
  };
}

function toTextNode(
  block: ClassifiedTextBlock,
  parentId: string,
  readingOrder: number
): StructureTextNode {
  const kind =
    block.kind === "document" ||
    block.kind === "page" ||
    block.kind === "figure" ||
    block.kind === "table"
      ? "paragraph"
      : block.kind;

  return {
    id: block.id,
    kind,
    pageNumber: block.pageNumber,
    bbox: block.bbox,
    parentId,
    childIds: [],
    readingOrder,
    text: block.text,
    confidence: block.confidence,
  };
}

function groupByPage<T extends { pageNumber: number }>(
  items: T[]
): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const list = map.get(item.pageNumber) ?? [];
    list.push(item);
    map.set(item.pageNumber, list);
  }
  return map;
}

function findNextHeadingIndex(
  ordered: ClassifiedTextBlock[],
  startIndex: number
): number {
  for (let i = startIndex; i < ordered.length; i++) {
    const kind = ordered[i].kind;
    if (kind === "heading" || kind === "title" || kind === "section") {
      return i;
    }
  }
  return -1;
}

function locateQuestionMarkerBBox(
  textBlocks: Array<{ text: string; bbox: BoundingBox }>,
  questionIndex: number,
  pageWidth: number
): BoundingBox | null {
  for (const block of textBlocks) {
    const trimmed = block.text.trim();
    if (!trimmed) continue;
    const starts = findQuestionMarkerStarts(trimmed);
    if (starts.length === 0) continue;
    for (let i = 0; i < starts.length; i += 1) {
      const end = i + 1 < starts.length ? starts[i + 1] : trimmed.length;
      const slice = trimmed.slice(starts[i], end);
      const parsed = parseQuestionNumber(slice);
      if (parsed?.index !== questionIndex) continue;
      return sliceBoundingBoxByTextRange(
        block.bbox,
        pageWidth,
        starts[i],
        end,
        trimmed.length
      );
    }
  }
  return null;
}

function findNearestQuestionParent(
  nodes: Record<string, StructureNode>,
  pageNumber: number,
  bbox: BoundingBox
): string | null {
  let bestId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const node of Object.values(nodes)) {
    if (node.kind !== "question" && node.kind !== "sub_question") {
      continue;
    }
    if (node.pageNumber !== pageNumber) {
      continue;
    }

    const distance =
      Math.abs(node.bbox.y - bbox.y) +
      horizontalCenterDistance(node.bbox, bbox);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = node.id;
    }
  }

  return bestId;
}

function attachNearbyCaptions(
  nodes: Record<string, StructureNode>,
  figure: StructureFigureNode,
  ordered: ClassifiedTextBlock[],
  readingOrder: number
): number {
  let order = readingOrder;

  for (const block of ordered) {
    if (block.kind !== "caption") {
      continue;
    }

    const near =
      isVerticallyNear(figure.bbox, block.bbox, 48) &&
      horizontalCenterDistance(figure.bbox, block.bbox) <
        Math.max(figure.bbox.width, 120);

    if (!near) {
      continue;
    }

    if (nodes[block.id]) {
      const existing = nodes[block.id];
      if (existing.parentId && nodes[existing.parentId]) {
        nodes[existing.parentId].childIds = nodes[
          existing.parentId
        ].childIds.filter((id) => id !== existing.id);
      }
      existing.parentId = figure.id;
      if (!figure.childIds.includes(existing.id)) {
        figure.childIds.push(existing.id);
      }
      continue;
    }

    const captionNode = toTextNode(block, figure.id, ++order);
    captionNode.kind = "caption";
    nodes[captionNode.id] = captionNode;
    figure.childIds.push(captionNode.id);
  }

  return order;
}
