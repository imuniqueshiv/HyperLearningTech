import type {
  ProductionPaper,
  ProductionPyqsJson,
  ProductionQuestion,
} from "./schema-types";
import {
  asStringArray,
  MergeMetadataError,
  normalizeRequiredString,
  preferNonEmptyString,
  safeTrim,
} from "./string-normalize";

export interface PyqMergeStats {
  papersAdded: number;
  questionsAdded: number;
  subQuestionsAdded: number;
  attachmentsAdded: number;
}

/**
 * Merges incoming PYQ JSON into existing production PYQ JSON.
 * Does not duplicate papers, questions, sub-questions, or attachments by id.
 */
export function mergePyqs(
  existing: ProductionPyqsJson | null,
  incoming: ProductionPyqsJson
): { pyqs: ProductionPyqsJson; stats: PyqMergeStats } {
  incoming.papers.forEach((paper, index) => {
    assertIncomingPaperIdentity(paper, `papers[${index}]`);
  });

  if (!existing) {
    return {
      pyqs: structuredClone(incoming),
      stats: countIncoming(incoming),
    };
  }

  const stats: PyqMergeStats = {
    papersAdded: 0,
    questionsAdded: 0,
    subQuestionsAdded: 0,
    attachmentsAdded: 0,
  };

  const papers = [...existing.papers];

  for (const incomingPaper of incoming.papers) {
    const index = papers.findIndex((paper) =>
      papersMatch(paper, incomingPaper)
    );

    if (index < 0) {
      papers.push(structuredClone(incomingPaper));
      const counted = countPaper(incomingPaper);
      stats.papersAdded += 1;
      stats.questionsAdded += counted.questionsAdded;
      stats.subQuestionsAdded += counted.subQuestionsAdded;
      stats.attachmentsAdded += counted.attachmentsAdded;
      continue;
    }

    const merged = mergePaper(papers[index], incomingPaper);
    papers[index] = merged.paper;
    stats.questionsAdded += merged.stats.questionsAdded;
    stats.subQuestionsAdded += merged.stats.subQuestionsAdded;
    stats.attachmentsAdded += merged.stats.attachmentsAdded;
  }

  const nothingAdded =
    stats.papersAdded === 0 &&
    stats.questionsAdded === 0 &&
    stats.subQuestionsAdded === 0 &&
    stats.attachmentsAdded === 0;

  if (nothingAdded) {
    return {
      pyqs: structuredClone(existing),
      stats,
    };
  }

  return {
    pyqs: {
      subject: mergeSubject(existing.subject, incoming.subject),
      papers,
    },
    stats,
  };
}

function mergeSubject(
  existing: ProductionPyqsJson["subject"],
  incoming: ProductionPyqsJson["subject"]
): ProductionPyqsJson["subject"] {
  const existingInstructions = asStringArray(existing.commonInstructions);
  const incomingInstructions = asStringArray(incoming.commonInstructions);

  return {
    id: preferNonEmptyString(existing.id, incoming.id),
    code: preferNonEmptyString(existing.code, incoming.code),
    name: preferNonEmptyString(existing.name, incoming.name),
    title: preferNonEmptyString(existing.title, incoming.title),
    semester: preferNonEmptyString(existing.semester, incoming.semester),
    gradingSystem: preferNonEmptyString(
      existing.gradingSystem,
      incoming.gradingSystem
    ),
    maxMarks:
      typeof existing.maxMarks === "number" && existing.maxMarks > 0
        ? existing.maxMarks
        : incoming.maxMarks,
    time: preferNonEmptyString(existing.time, incoming.time),
    commonInstructions:
      existingInstructions.length > 0
        ? existingInstructions
        : incomingInstructions,
  };
}

function mergePaper(
  existing: ProductionPaper,
  incoming: ProductionPaper
): {
  paper: ProductionPaper;
  stats: Omit<PyqMergeStats, "papersAdded">;
} {
  const stats = {
    questionsAdded: 0,
    subQuestionsAdded: 0,
    attachmentsAdded: 0,
  };

  const questions = [...existing.questions];

  for (const incomingQuestion of incoming.questions) {
    const index = questions.findIndex(
      (question) => question.id === incomingQuestion.id
    );

    if (index < 0) {
      questions.push(structuredClone(incomingQuestion));
      const counted = countQuestion(incomingQuestion);
      stats.questionsAdded += 1;
      stats.subQuestionsAdded += counted.subQuestionsAdded;
      stats.attachmentsAdded += counted.attachmentsAdded;
      continue;
    }

    const merged = mergeQuestion(questions[index], incomingQuestion);
    questions[index] = merged.question;
    stats.subQuestionsAdded += merged.stats.subQuestionsAdded;
    stats.attachmentsAdded += merged.stats.attachmentsAdded;
  }

  const paper: ProductionPaper = {
    exam: preferNonEmptyString(existing.exam, incoming.exam),
    year: existing.year || incoming.year,
    month: preferNonEmptyString(existing.month, incoming.month),
    questions,
  };

  if (existing.isPredicted === true || incoming.isPredicted === true) {
    paper.isPredicted = true;
  }

  return { paper, stats };
}

function mergeQuestion(
  existing: ProductionQuestion,
  incoming: ProductionQuestion
): {
  question: ProductionQuestion;
  stats: { subQuestionsAdded: number; attachmentsAdded: number };
} {
  const stats = { subQuestionsAdded: 0, attachmentsAdded: 0 };
  const subQuestions = [...existing.subQuestions];

  for (const incomingSub of incoming.subQuestions) {
    const index = subQuestions.findIndex((sub) => sub.id === incomingSub.id);

    if (index < 0) {
      subQuestions.push(structuredClone(incomingSub));
      stats.subQuestionsAdded += 1;
      stats.attachmentsAdded += incomingSub.attachments?.length ?? 0;
    }
    // Existing sub-questions stay repository-authoritative.
  }

  return {
    question: {
      id: existing.id,
      questionNumber: preferNonEmptyString(
        existing.questionNumber,
        incoming.questionNumber
      ),
      subQuestions,
    },
    stats,
  };
}

/**
 * Deterministic paper identity for duplicate detection.
 * Canonical identity is year + month/session. Exam labels differ between
 * the repository ("June 2023") and CMS schema output ("B.Tech. Examination")
 * and must not create a second paper for the same sitting.
 */
export function papersMatch(a: ProductionPaper, b: ProductionPaper): boolean {
  return (
    a.year === b.year &&
    safeTrim(a.month).toLowerCase() === safeTrim(b.month).toLowerCase()
  );
}

function countIncoming(pyqs: ProductionPyqsJson): PyqMergeStats {
  return pyqs.papers.reduce<PyqMergeStats>(
    (acc, paper) => {
      const counted = countPaper(paper);
      return {
        papersAdded: acc.papersAdded + 1,
        questionsAdded: acc.questionsAdded + counted.questionsAdded,
        subQuestionsAdded: acc.subQuestionsAdded + counted.subQuestionsAdded,
        attachmentsAdded: acc.attachmentsAdded + counted.attachmentsAdded,
      };
    },
    {
      papersAdded: 0,
      questionsAdded: 0,
      subQuestionsAdded: 0,
      attachmentsAdded: 0,
    }
  );
}

function countPaper(
  paper: ProductionPaper
): Omit<PyqMergeStats, "papersAdded"> {
  return paper.questions.reduce(
    (acc, question) => {
      const counted = countQuestion(question);
      return {
        questionsAdded: acc.questionsAdded + 1,
        subQuestionsAdded: acc.subQuestionsAdded + counted.subQuestionsAdded,
        attachmentsAdded: acc.attachmentsAdded + counted.attachmentsAdded,
      };
    },
    { questionsAdded: 0, subQuestionsAdded: 0, attachmentsAdded: 0 }
  );
}

function countQuestion(question: ProductionQuestion): {
  subQuestionsAdded: number;
  attachmentsAdded: number;
} {
  return {
    subQuestionsAdded: question.subQuestions.length,
    attachmentsAdded: question.subQuestions.reduce(
      (sum, sub) => sum + (sub.attachments?.length ?? 0),
      0
    ),
  };
}

function assertIncomingPaperIdentity(
  paper: ProductionPaper,
  path: string
): void {
  if (!Number.isFinite(paper.year) || paper.year < 2000) {
    throw new MergeMetadataError({
      field: `${path}.year`,
      received: paper.year,
      message: "Incoming paper year is required for merge identity.",
      recoveryHint:
        "Confirm year metadata before merge. Do not rerun OCR/Gemini.",
    });
  }
  normalizeRequiredString(
    paper.month,
    `${path}.month`,
    "Re-extract or confirm exam session (June/November/December) before merge."
  );
  normalizeRequiredString(
    paper.exam,
    `${path}.exam`,
    "Confirm exam label on the production paper before merge."
  );
}
