import type { ClassifiedTextBlock } from "./block-detector";
import { parseSubQuestionLabel } from "./question-number";
import { isVerticallyNear } from "./reading-order";

export interface DetectedQuestionGroup {
  question: ClassifiedTextBlock;
  bodyBlockIds: string[];
  subQuestions: Array<{
    block: ClassifiedTextBlock;
    bodyBlockIds: string[];
  }>;
}

function centerX(block: ClassifiedTextBlock): number {
  return block.bbox.x + block.bbox.width / 2;
}

function centerY(block: ClassifiedTextBlock): number {
  return block.bbox.y + block.bbox.height / 2;
}

function sameColumn(
  a: ClassifiedTextBlock,
  b: ClassifiedTextBlock,
  pageWidthHint?: number
): boolean {
  const width =
    pageWidthHint ??
    Math.max(a.bbox.x + a.bbox.width, b.bbox.x + b.bbox.width, 1);
  // Wide blocks (column-bleed OCR) are treated as compatible with any column.
  const aWide = a.bbox.width >= width * 0.55;
  const bWide = b.bbox.width >= width * 0.55;
  if (aWide || bWide) return true;
  const mid = width / 2;
  const aLeft = centerX(a) < mid;
  const bLeft = centerX(b) < mid;
  return aLeft === bLeft;
}

function verticalDistance(
  question: ClassifiedTextBlock,
  block: ClassifiedTextBlock
): number {
  const qBottom = question.bbox.y + question.bbox.height;
  if (block.bbox.y >= question.bbox.y - 4) {
    return Math.max(0, block.bbox.y - qBottom);
  }
  // Prefer not to attach content clearly above the question.
  return 10_000 + (question.bbox.y - block.bbox.y);
}

function groupHasSubLabel(
  group: DetectedQuestionGroup,
  label: string | null
): boolean {
  if (!label) return false;
  return group.subQuestions.some((sub) => {
    const parsed = parseSubQuestionLabel(sub.block.text);
    return parsed?.canonical === label;
  });
}

/**
 * Pick the best open question group for a sub-question.
 * Landscape two-column RGPV: (b) parts sit beside their (a) parent — score by
 * horizontal center first, then vertical proximity; avoid duplicate labels.
 */
function bestGroupForSubQuestion(
  groups: DetectedQuestionGroup[],
  block: ClassifiedTextBlock,
  pageWidth?: number
): DetectedQuestionGroup | null {
  if (groups.length === 0) return null;

  const label = parseSubQuestionLabel(block.text)?.canonical ?? null;
  const width =
    pageWidth ??
    Math.max(
      ...groups.map((g) => g.question.bbox.x + g.question.bbox.width),
      1
    );
  const blockWide = block.bbox.width >= width * 0.55;

  let best: DetectedQuestionGroup | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const group of groups) {
    const q = group.question;
    const yDist = Math.abs(centerY(q) - centerY(block));
    const xDist = Math.abs(centerX(q) - centerX(block));
    const abovePenalty =
      block.bbox.y + block.bbox.height < q.bbox.y - 28 ? 800 : 0;
    const colMismatch = !blockWide && !sameColumn(q, block, width) ? 350 : 0;
    const dupPenalty = groupHasSubLabel(group, label) ? 2_000 : 0;
    // Wide (b) blobs: horizontal alignment to sliced question columns dominates.
    const score = blockWide
      ? xDist * 1.2 + yDist * 0.45 + abovePenalty + dupPenalty
      : yDist + xDist * 0.15 + colMismatch + abovePenalty + dupPenalty;

    if (score < bestScore) {
      bestScore = score;
      best = group;
    }
  }

  return best;
}

/**
 * Pick the best open question group for a body paragraph.
 * Prefers same column and nearest question above the block.
 */
function bestGroupForBody(
  groups: DetectedQuestionGroup[],
  block: ClassifiedTextBlock,
  pageWidth?: number
): DetectedQuestionGroup | null {
  if (groups.length === 0) return null;

  let best: DetectedQuestionGroup | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const group of groups) {
    const q = group.question;
    if (!sameColumn(q, block, pageWidth)) continue;
    const dist = verticalDistance(q, block);
    const score = dist + Math.abs(centerX(q) - centerX(block)) * 0.05;
    if (score < bestScore) {
      bestScore = score;
      best = group;
    }
  }

  // Fallback: nearest question above regardless of column (degenerate bboxes).
  if (!best) {
    for (const group of groups) {
      const dist = verticalDistance(group.question, block);
      if (dist < bestScore) {
        bestScore = dist;
        best = group;
      }
    }
  }

  return best;
}

/**
 * Groups question / sub-question markers with following body paragraphs.
 * Detection is pattern + proximity based — not academic classification.
 * Two-column RGPV pages: sub-questions attach to the nearest same-column parent.
 */
export function detectQuestionGroups(
  orderedBlocks: ClassifiedTextBlock[],
  pageWidth?: number
): DetectedQuestionGroup[] {
  const groups: DetectedQuestionGroup[] = [];
  const width =
    pageWidth ??
    Math.max(...orderedBlocks.map((b) => b.bbox.x + b.bbox.width), 1);

  let current: DetectedQuestionGroup | null = null;
  let currentSub: DetectedQuestionGroup["subQuestions"][number] | null = null;

  for (const block of orderedBlocks) {
    if (block.kind === "header" || block.kind === "footer") {
      continue;
    }

    if (block.kind === "question") {
      current = {
        question: block,
        bodyBlockIds: [],
        subQuestions: [],
      };
      currentSub = null;
      groups.push(current);
      continue;
    }

    if (block.kind === "sub_question") {
      const parent: DetectedQuestionGroup | null =
        bestGroupForSubQuestion(groups, block, width) ??
        (current && sameColumn(current.question, block, width)
          ? current
          : null);

      if (!parent) {
        current = {
          question: {
            ...block,
            kind: "question",
            id: `${block.id}-as-question`,
          },
          bodyBlockIds: [],
          subQuestions: [],
        };
        groups.push(current);
        currentSub = null;
        continue;
      }

      current = parent;
      currentSub = {
        block,
        bodyBlockIds: [],
      };
      parent.subQuestions.push(currentSub);
      continue;
    }

    if (!current) {
      continue;
    }

    const parent: DetectedQuestionGroup =
      bestGroupForBody(groups, block, width) ?? current;
    const anchor =
      parent === current && currentSub ? currentSub.block : parent.question;
    const near =
      isVerticallyNear(anchor.bbox, block.bbox, 36) ||
      block.bbox.y >= anchor.bbox.y;

    if (!near && (block.kind === "heading" || block.kind === "section")) {
      current = null;
      currentSub = null;
      continue;
    }

    // Prefer continuing the active sub when geometry still points at it.
    // Interleaved two-column reading order can briefly visit the other column
    // (headers/junk) without ending the open (b) continuation.
    if (
      currentSub &&
      sameColumn(currentSub.block, block, width) &&
      block.bbox.y + 4 >= currentSub.block.bbox.y
    ) {
      const subBottom = currentSub.block.bbox.y + currentSub.block.bbox.height;
      const gap = Math.max(0, block.bbox.y - subBottom);
      if (gap <= 72) {
        currentSub.bodyBlockIds.push(block.id);
        // Keep current on the sub's parent question.
        current =
          groups.find((g) => g.subQuestions.includes(currentSub!)) ?? current;
        continue;
      }
    }

    if (parent === current && currentSub) {
      currentSub.bodyBlockIds.push(block.id);
    } else {
      parent.bodyBlockIds.push(block.id);
      if (parent !== current) {
        // Cross-column body (other column's junk/header): attach there but do
        // NOT abandon the open sub-question in the current column.
        if (currentSub && !sameColumn(currentSub.block, block, width)) {
          // keep current + currentSub
        } else {
          current = parent;
          currentSub = null;
        }
      }
    }
  }

  return groups;
}
