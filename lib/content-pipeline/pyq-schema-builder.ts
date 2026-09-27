import type { AcademicDocument } from "./academic-document";
import type {
  ProductionPaper,
  ProductionPyqSubject,
  ProductionPyqsJson,
  ProductionQuestion,
  ProductionQuestionAttachment,
  ProductionSubQuestion,
} from "./schema-types";
import {
  buildAttachmentId,
  buildQuestionId,
  buildSubQuestionId,
  extractQuestionIndex,
  extractSubQuestionLetter,
  normalizeSubjectCode,
  toSubjectId,
} from "./stable-id-generator";
import {
  firstNonEmpty,
  PipelineFieldError,
  rethrowAsPipelineFieldError,
  requireNonEmptyString,
  safeTrim,
  safeTrimOrNull,
} from "./string-normalize";

/**
 * Builds production pyqs.json shape from AcademicDocument.
 */
export function buildProductionPyqs(
  document: AcademicDocument
): ProductionPyqsJson {
  try {
    const subject = buildPyqSubject(document);
    const paper = buildPaper(document);

    return {
      subject,
      papers: [paper],
    };
  } catch (error) {
    rethrowAsPipelineFieldError(error, "Schema Builder");
  }
}

function buildPyqSubject(document: AcademicDocument): ProductionPyqSubject {
  const code = normalizeSubjectCode(document.metadata.subjectCode);
  const name =
    firstNonEmpty(
      document.metadata.subjectName,
      document.metadata.subjectTitle,
      code
    ) || code;
  const title =
    firstNonEmpty(document.metadata.subjectTitle) || `${code} – ${name}`;

  return {
    id: toSubjectId(code),
    code,
    name,
    title,
    semester: firstNonEmpty(document.metadata.semester, "I & II"),
    gradingSystem: firstNonEmpty(
      document.exam?.gradingSystem,
      "Grading System (GS)"
    ),
    maxMarks: document.exam?.maxMarks ?? 70,
    time: firstNonEmpty(document.exam?.time, "3 Hours"),
    commonInstructions: document.exam?.commonInstructions?.length
      ? document.exam.commonInstructions
      : ["Attempt any five questions.", "All questions carry equal marks."],
  };
}

function buildPaper(document: AcademicDocument): ProductionPaper {
  const year = document.exam?.year ?? new Date().getFullYear();
  const month = firstNonEmpty(document.exam?.month, "Unknown");
  const exam = firstNonEmpty(document.exam?.exam, `${month} ${year}`);

  const questions = document.questions.map((question, index) =>
    buildQuestion(document, question, index)
  );

  const paper: ProductionPaper = {
    exam,
    year,
    month,
    questions,
  };

  if (document.exam?.isPredicted === true) {
    paper.isPredicted = true;
  }

  return paper;
}

function buildQuestion(
  document: AcademicDocument,
  question: AcademicDocument["questions"][number],
  index: number
): ProductionQuestion {
  const questionIndex = extractQuestionIndex(
    question.questionNumber,
    index + 1
  );
  const id = buildQuestionId(questionIndex);
  const questionNumber =
    safeTrim(question.questionNumber) || `Q.${questionIndex}`;

  return {
    id,
    questionNumber,
    subQuestions: question.subQuestions.map((sub, subIndex) =>
      buildSubQuestion(document, sub, questionIndex, subIndex, questionNumber)
    ),
  };
}

function buildSubQuestion(
  document: AcademicDocument,
  sub: AcademicDocument["questions"][number]["subQuestions"][number],
  questionIndex: number,
  subIndex: number,
  parentQuestionNumber: string
): ProductionSubQuestion {
  const letter = extractSubQuestionLetter(sub.label, subIndex);
  const id = buildSubQuestionId(questionIndex, letter);
  const label = normalizeLabel(sub.label, letter);
  const questionRef = `${parentQuestionNumber}(${letter})`;

  const attachments = buildAttachments(document, sub, id, questionRef);

  const text = requireNonEmptyString(sub.text, {
    stage: "Schema Builder",
    field: "text",
    question: questionRef,
  });

  const unit = requireNonEmptyString(
    firstNonEmpty(sub.unit, inferUnitFallback(document, sub)),
    {
      stage: "Schema Builder",
      field: "unit",
      question: questionRef,
      fallback: "Unit 1",
    }
  );

  const result: ProductionSubQuestion = {
    id,
    label,
    text,
    unit,
  };

  const latex = safeTrimOrNull(sub.latex);
  if (latex) {
    result.latex = latex;
  }

  const type = safeTrimOrNull(sub.type);
  if (type) {
    result.type = type;
  }

  if (document.exam?.isPredicted === true) {
    result.isPredicted = true;
  }

  if (attachments.length > 0) {
    result.attachments = attachments;
  }

  return result;
}

function buildAttachments(
  document: AcademicDocument,
  sub: AcademicDocument["questions"][number]["subQuestions"][number],
  subQuestionId: string,
  questionRef: string
): ProductionQuestionAttachment[] {
  const fromSub = sub.attachments ?? [];
  const fromDiagrams = document.diagrams.filter(
    (diagram) => diagram.relatedSubQuestionId === sub.id
  );

  const byPath = new Map<string, ProductionQuestionAttachment>();

  fromSub.forEach((attachment, index) => {
    const path = safeTrim(attachment?.sourcePath, "").replace(/\\/g, "/");
    if (!path) {
      throw new PipelineFieldError({
        stage: "Schema Builder",
        field: "attachment.sourcePath",
        question: questionRef,
        expected: "string path",
        received: attachment?.sourcePath,
      });
    }
    byPath.set(path, {
      id: buildAttachmentId(subQuestionId, index + 1),
      type: "image",
      path,
      title: firstNonEmpty(attachment?.title, "Diagram"),
      alt: firstNonEmpty(attachment?.alt, "Exam diagram"),
      caption: safeTrim(attachment?.caption, ""),
      aiContext: safeTrim(attachment?.aiContext, ""),
    });
  });

  fromDiagrams.forEach((diagram) => {
    const path = safeTrim(diagram?.sourcePath, "").replace(/\\/g, "/");
    if (!path) {
      return;
    }
    if (byPath.has(path)) {
      const existing = byPath.get(path)!;
      byPath.set(path, {
        ...existing,
        title: firstNonEmpty(diagram.title, existing.title),
        alt: firstNonEmpty(diagram.alt, existing.alt),
        caption: firstNonEmpty(diagram.caption, existing.caption),
        aiContext: firstNonEmpty(diagram.aiContext, existing.aiContext),
      });
      return;
    }

    byPath.set(path, {
      id: buildAttachmentId(subQuestionId, byPath.size + 1),
      type: "image",
      path,
      title: firstNonEmpty(diagram.title, "Diagram"),
      alt: firstNonEmpty(diagram.alt, `Diagram ${safeTrim(diagram.filename)}`),
      caption: safeTrim(diagram.caption, ""),
      aiContext: safeTrim(diagram.aiContext, ""),
    });
  });

  return [...byPath.values()].map((attachment, index) => ({
    ...attachment,
    id: buildAttachmentId(subQuestionId, index + 1),
  }));
}

function normalizeLabel(label: unknown, letter: string): string {
  const trimmed = safeTrim(label, "");
  if (!trimmed) {
    return `${letter})`;
  }
  if (/^[a-z0-9]+\)$/i.test(trimmed) || /^\([a-z0-9]+\)$/i.test(trimmed)) {
    return trimmed;
  }
  return trimmed.endsWith(")") ? trimmed : `${trimmed})`;
}

function inferUnitFallback(
  document: AcademicDocument,
  sub: AcademicDocument["questions"][number]["subQuestions"][number]
): string {
  const existing = safeTrimOrNull(sub.unit);
  if (existing) {
    return existing;
  }

  if (document.units.length === 1 && document.units[0].number != null) {
    return `Unit ${document.units[0].number}`;
  }

  return "Unit 1";
}
