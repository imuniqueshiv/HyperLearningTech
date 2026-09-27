import type {
  ProductionPaper,
  ProductionPyqsJson,
  ProductionQuestion,
  ProductionQuestionAttachment,
  ProductionSubQuestion,
  ProductionSyllabusJson,
  ProductionSyllabusModule,
  ProductionTopic,
} from "./schema-types";
import { asStringArray, safeTrim } from "./string-normalize";

const MONTH_ORDER: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

/**
 * Deterministic sorting for production PYQ and syllabus objects.
 */
export function sortProductionPyqs(
  pyqs: ProductionPyqsJson
): ProductionPyqsJson {
  return {
    ...pyqs,
    papers: [...pyqs.papers].map(sortPaper).sort(comparePapers),
  };
}

export function sortProductionSyllabus(
  syllabus: ProductionSyllabusJson
): ProductionSyllabusJson {
  return {
    ...syllabus,
    modules: [...syllabus.modules]
      .map(sortModule)
      .sort((a, b) => a.number - b.number),
  };
}

function sortPaper(paper: ProductionPaper): ProductionPaper {
  return {
    ...paper,
    questions: [...paper.questions].map(sortQuestion).sort(compareQuestions),
  };
}

function sortQuestion(question: ProductionQuestion): ProductionQuestion {
  return {
    ...question,
    subQuestions: [...question.subQuestions]
      .map(sortSubQuestion)
      .sort(compareSubQuestions),
  };
}

function sortSubQuestion(
  subQuestion: ProductionSubQuestion
): ProductionSubQuestion {
  if (!subQuestion.attachments?.length) {
    return subQuestion;
  }

  return {
    ...subQuestion,
    attachments: [...subQuestion.attachments].sort(compareAttachments),
  };
}

function sortModule(
  syllabusModule: ProductionSyllabusModule
): ProductionSyllabusModule {
  const topics = Array.isArray(syllabusModule.topics)
    ? [...syllabusModule.topics]
    : [];
  const sortedTopics = topics.every(
    (topic) => topic !== null && typeof topic === "object"
  )
    ? (topics as ProductionTopic[]).sort(compareTopics)
    : [...topics].sort((a, b) =>
        String(a ?? "").localeCompare(String(b ?? ""))
      );

  const sorted: ProductionSyllabusModule = {
    ...syllabusModule,
    topics: sortedTopics as ProductionSyllabusModule["topics"],
  };

  if (syllabusModule.questionIds !== undefined) {
    sorted.questionIds = asStringArray(syllabusModule.questionIds);
  }
  if (syllabusModule.predictedQuestionIds !== undefined) {
    sorted.predictedQuestionIds = asStringArray(
      syllabusModule.predictedQuestionIds
    );
  }

  return sorted;
}

function comparePapers(a: ProductionPaper, b: ProductionPaper): number {
  const yearA =
    typeof a.year === "number" && Number.isFinite(a.year) ? a.year : 0;
  const yearB =
    typeof b.year === "number" && Number.isFinite(b.year) ? b.year : 0;

  if (yearA !== yearB) {
    return yearA - yearB;
  }

  const monthA = MONTH_ORDER[safeTrim(a.month).toLowerCase()] ?? 99;
  const monthB = MONTH_ORDER[safeTrim(b.month).toLowerCase()] ?? 99;

  if (monthA !== monthB) {
    return monthA - monthB;
  }

  return safeTrim(a.exam).localeCompare(safeTrim(b.exam));
}

function compareQuestions(
  a: ProductionQuestion,
  b: ProductionQuestion
): number {
  const numA =
    extractTrailingNumber(a.questionNumber) ?? Number.MAX_SAFE_INTEGER;
  const numB =
    extractTrailingNumber(b.questionNumber) ?? Number.MAX_SAFE_INTEGER;

  if (numA !== numB) {
    return numA - numB;
  }

  return safeTrim(a.id).localeCompare(safeTrim(b.id));
}

function compareSubQuestions(
  a: ProductionSubQuestion,
  b: ProductionSubQuestion
): number {
  const labelA = normalizeSubLabel(a.label);
  const labelB = normalizeSubLabel(b.label);

  if (labelA !== labelB) {
    return labelA.localeCompare(labelB);
  }

  return safeTrim(a.id).localeCompare(safeTrim(b.id));
}

function compareAttachments(
  a: ProductionQuestionAttachment,
  b: ProductionQuestionAttachment
): number {
  return safeTrim(a.id).localeCompare(safeTrim(b.id));
}

function compareTopics(a: ProductionTopic, b: ProductionTopic): number {
  if (a.displayOrder !== b.displayOrder) {
    return a.displayOrder - b.displayOrder;
  }

  return safeTrim(a.id).localeCompare(safeTrim(b.id));
}

function extractTrailingNumber(value: string): number | null {
  const match = safeTrim(value).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function normalizeSubLabel(label: string): string {
  return safeTrim(label).toLowerCase().replace(/[()]/g, "");
}
