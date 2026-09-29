import type { BoundingBox } from "./coordinates";
import {
  isLikelyQuestionMarker,
  isLikelySubQuestionMarker,
} from "./question-number";
import type { StructureNodeKind } from "./structured-document";
import { safeTrim } from "./string-normalize";

export interface ClassifiedTextBlock {
  id: string;
  pageNumber: number;
  text: string;
  bbox: BoundingBox;
  confidence?: number;
  kind: StructureNodeKind;
}

const CAPTION_PATTERN = /^(?:fig(?:ure)?\.?\s*\d*|table\s*\d*)\b/i;

const HEADING_HINT_PATTERN =
  /^(?:unit|module|chapter|section|part)\b|^[A-Z0-9][A-Z0-9\s\-–—:]{8,}$/;

const INSTRUCTION_PATTERN =
  /^(?:note|instructions?|attempt\b|all questions are|use suitable|assume\b)/i;

/**
 * Classifies a single text block by layout patterns only.
 * Patterns like "Q.1" or "(a)" are structural markers — not academic meaning.
 */
export function classifyTextBlock(input: {
  id: string;
  pageNumber: number;
  text: string;
  bbox: BoundingBox;
  confidence?: number;
  pageWidth: number;
  pageHeight: number;
  medianTextHeight: number;
}): ClassifiedTextBlock {
  const text = safeTrim(input.text);
  const relativeY = input.pageHeight > 0 ? input.bbox.y / input.pageHeight : 0;
  const relativeBottom =
    input.pageHeight > 0
      ? (input.bbox.y + input.bbox.height) / input.pageHeight
      : 0;

  const degenerateSpatial =
    input.bbox.height >= input.pageHeight * 0.85 ||
    (input.bbox.y === 0 &&
      input.bbox.height >= input.pageHeight * 0.5 &&
      input.bbox.width >= input.pageWidth * 0.85);

  let kind: StructureNodeKind = "paragraph";

  // Structural markers always win over chrome heuristics — especially critical
  // when OCR bboxes are degenerate (full-page boxes → everything looks like a header).
  if (isLikelyQuestionMarker(text)) {
    kind = "question";
  } else if (isLikelySubQuestionMarker(text)) {
    kind = "sub_question";
  } else if (!degenerateSpatial && relativeY <= 0.08 && text.length <= 120) {
    kind = "header";
  } else if (
    !degenerateSpatial &&
    relativeBottom >= 0.92 &&
    text.length <= 120
  ) {
    kind = "footer";
  } else if (CAPTION_PATTERN.test(text)) {
    kind = "caption";
  } else if (INSTRUCTION_PATTERN.test(text)) {
    kind = text.length <= 80 ? "heading" : "paragraph";
  } else if (
    input.bbox.height >= input.medianTextHeight * 1.35 ||
    HEADING_HINT_PATTERN.test(text) ||
    (text.length <= 64 && /^[A-Z]/.test(text) && text === text.toUpperCase())
  ) {
    kind = text.length <= 80 ? "heading" : "section";
  } else if (
    !degenerateSpatial &&
    relativeY <= 0.18 &&
    text.length <= 90 &&
    input.bbox.height >= input.medianTextHeight * 1.2
  ) {
    kind = "title";
  }

  return {
    id: input.id,
    pageNumber: input.pageNumber,
    text,
    bbox: input.bbox,
    confidence: input.confidence,
    kind,
  };
}

export function computeMedianTextHeight(
  heights: number[],
  fallback = 12
): number {
  if (heights.length === 0) {
    return fallback;
  }

  const sorted = [...heights].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}
