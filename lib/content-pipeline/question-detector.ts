import type { ClassifiedTextBlock } from "./block-detector";
import { isVerticallyNear } from "./reading-order";

export interface DetectedQuestionGroup {
  question: ClassifiedTextBlock;
  bodyBlockIds: string[];
  subQuestions: Array<{
    block: ClassifiedTextBlock;
    bodyBlockIds: string[];
  }>;
}

/**
 * Groups question / sub-question markers with following body paragraphs.
 * Detection is pattern + proximity based — not academic classification.
 */
export function detectQuestionGroups(
  orderedBlocks: ClassifiedTextBlock[]
): DetectedQuestionGroup[] {
  const groups: DetectedQuestionGroup[] = [];
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
      if (!current) {
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
      }

      currentSub = {
        block,
        bodyBlockIds: [],
      };
      current.subQuestions.push(currentSub);
      continue;
    }

    if (!current) {
      continue;
    }

    const anchor = currentSub?.block ?? current.question;
    const near =
      isVerticallyNear(anchor.bbox, block.bbox, 36) ||
      block.bbox.y >= anchor.bbox.y;

    if (!near && (block.kind === "heading" || block.kind === "section")) {
      current = null;
      currentSub = null;
      continue;
    }

    if (currentSub) {
      currentSub.bodyBlockIds.push(block.id);
    } else {
      current.bodyBlockIds.push(block.id);
    }
  }

  return groups;
}
