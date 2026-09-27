import type {
  AcademicDocument,
  StructuringRunSummary,
} from "./academic-document";
import type {
  AcademicAttachment,
  AcademicDiagram,
  AcademicDifficulty,
  AcademicExam,
  AcademicMetadata,
  AcademicQuestion,
  AcademicQuestionType,
  AcademicSubQuestion,
  AcademicTokenUsage,
  AcademicTopic,
  AcademicUnit,
} from "./academic-types";
import type { DiagramAsset } from "./diagram-metadata";
import { safeTrim, safeTrimOrNull } from "./string-normalize";

interface RawGeminiStructuringPayload {
  exam?: Partial<AcademicExam> | null;
  subject?: {
    code?: string | null;
    name?: string | null;
    title?: string | null;
    university?: string | null;
  } | null;
  units?: unknown[];
  topics?: unknown[];
  questions?: unknown[];
  diagrams?: unknown[];
}

/**
 * Parses Gemini JSON text into a normalized AcademicDocument.
 */
export function parseAcademicDocument(input: {
  rawText: string;
  metadata: AcademicMetadata;
  diagrams: DiagramAsset[];
  usage: AcademicTokenUsage | null;
}): AcademicDocument {
  const payload = extractJsonObject(
    input.rawText
  ) as RawGeminiStructuringPayload;

  const units = normalizeUnits(payload.units);
  const topics = normalizeTopics(payload.topics);
  const questions = normalizeQuestions(payload.questions);
  const diagrams = mergeDiagrams(payload.diagrams, input.diagrams, questions);

  attachDiagramsToQuestions(questions, diagrams);

  const subject = payload.subject ?? null;
  const metadata: AcademicMetadata = {
    ...input.metadata,
    subjectCode: safeTrim(subject?.code) || input.metadata.subjectCode,
    subjectName: safeTrim(subject?.name) || input.metadata.subjectName,
    subjectTitle: safeTrim(subject?.title) || input.metadata.subjectTitle,
    university: safeTrim(subject?.university) || input.metadata.university,
  };

  return {
    version: 1,
    metadata,
    exam: normalizeExam(payload.exam),
    units,
    topics,
    questions,
    diagrams,
    usage: input.usage,
  };
}

export function createEmptyAcademicDocument(input: {
  metadata: AcademicMetadata;
  diagrams: DiagramAsset[];
  usage: AcademicTokenUsage | null;
}): AcademicDocument {
  const diagrams = input.diagrams.map((diagram, index) =>
    diagramAssetToAcademic(diagram, index)
  );

  return {
    version: 1,
    metadata: input.metadata,
    exam: null,
    units: [],
    topics: [],
    questions: [],
    diagrams,
    usage: input.usage,
  };
}

export function toStructuringSummary(
  document: AcademicDocument,
  input: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
    academicDocumentPath: string;
  }
): StructuringRunSummary {
  return {
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationMs: input.durationMs,
    model: document.metadata.model,
    questionCount: document.questions.length,
    subQuestionCount: document.questions.reduce(
      (sum, question) => sum + question.subQuestions.length,
      0
    ),
    unitCount: document.units.length,
    topicCount: document.topics.length,
    diagramCount: document.diagrams.length,
    promptTokens: document.usage?.promptTokens ?? null,
    completionTokens: document.usage?.completionTokens ?? null,
    totalTokens: document.usage?.totalTokens ?? null,
    academicDocumentPath: input.academicDocumentPath,
  };
}

function extractJsonObject(rawText: unknown): Record<string, unknown> {
  const trimmed = safeTrim(rawText);
  if (!trimmed) {
    throw new Error("Gemini response was empty or not a string.");
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = safeTrim(fenced?.[1]) || trimmed;

  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1)) as Record<
        string,
        unknown
      >;
    }
    throw new Error("Gemini response was not valid JSON.");
  }
}

function normalizeExam(
  value: Partial<AcademicExam> | null | undefined
): AcademicExam | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return {
    exam: asNullableString(value.exam),
    year: asNullableNumber(value.year),
    month: asNullableString(value.month),
    maxMarks: asNullableNumber(value.maxMarks),
    time: asNullableString(value.time),
    commonInstructions: Array.isArray(value.commonInstructions)
      ? value.commonInstructions.map((item) => safeTrim(item)).filter(Boolean)
      : [],
    isPredicted:
      typeof value.isPredicted === "boolean" ? value.isPredicted : null,
    gradingSystem: asNullableString(value.gradingSystem),
  };
}

function normalizeUnits(value: unknown[] | undefined): AcademicUnit[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }

      const number = asNullableNumber(row.number);
      const title =
        asNullableString(row.title) ?? `Unit ${number ?? index + 1}`;
      const id = asNullableString(row.id) ?? `unit-${number ?? index + 1}`;

      return {
        id,
        number,
        title,
        hours: asNullableNumber(row.hours),
        topicIds: Array.isArray(row.topicIds)
          ? row.topicIds.map((idValue) => String(idValue))
          : [],
      } satisfies AcademicUnit;
    })
    .filter((unit): unit is AcademicUnit => unit !== null);
}

function normalizeTopics(value: unknown[] | undefined): AcademicTopic[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }

      const title = asNullableString(row.title);
      if (!title) {
        return null;
      }

      const slug =
        asNullableString(row.slug) ?? slugify(title) ?? `topic-${index + 1}`;

      return {
        id: asNullableString(row.id) ?? `topic-${index + 1}`,
        unitId: asNullableString(row.unitId),
        slug,
        title,
        displayOrder: asNullableNumber(row.displayOrder) ?? index + 1,
      } satisfies AcademicTopic;
    })
    .filter((topic): topic is AcademicTopic => topic !== null);
}

function normalizeQuestions(value: unknown[] | undefined): AcademicQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }

      const questionNumber =
        asNullableString(row.questionNumber) ?? `Q.${index + 1}`;
      const id = asNullableString(row.id) ?? `q${index + 1}`;
      const subQuestions = normalizeSubQuestions(
        row.subQuestions,
        id,
        questionNumber
      );

      return {
        id,
        questionNumber,
        marks: asNullableNumber(row.marks),
        subQuestions,
      } satisfies AcademicQuestion;
    })
    .filter((question): question is AcademicQuestion => question !== null);
}

function normalizeSubQuestions(
  value: unknown,
  questionId: string,
  questionNumber: string
): AcademicSubQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }

      const text = asNullableString(row.text);
      if (!text) {
        return null;
      }

      const label = asNullableString(row.label) ?? "";
      const id =
        asNullableString(row.id) ??
        `${questionId}${labelToSuffix(label, index)}`;

      const attachmentPaths = Array.isArray(row.attachmentSourcePaths)
        ? row.attachmentSourcePaths.map((path) => String(path))
        : [];

      return {
        id,
        label,
        text,
        latex: asNullableString(row.latex),
        unit: asNullableString(row.unit),
        type: asNullableString(row.type),
        marks: asNullableNumber(row.marks),
        difficulty: asDifficulty(row.difficulty),
        questionType: asQuestionType(row.questionType),
        attachments: attachmentPaths.map((sourcePath, attachmentIndex) =>
          stubAttachment({
            id: `${id}-img-${attachmentIndex + 1}`,
            sourcePath,
            questionNumber,
            label,
          })
        ),
      } satisfies AcademicSubQuestion;
    })
    .filter((sub): sub is AcademicSubQuestion => sub !== null);
}

function mergeDiagrams(
  rawDiagrams: unknown[] | undefined,
  assets: DiagramAsset[],
  questions: AcademicQuestion[]
): AcademicDiagram[] {
  const byPath = new Map<string, Record<string, unknown>>();

  if (Array.isArray(rawDiagrams)) {
    for (const item of rawDiagrams) {
      const row = asRecord(item);
      const sourcePath = asNullableString(row?.sourcePath);
      if (row && sourcePath) {
        byPath.set(sourcePath.replace(/\\/g, "/"), row);
      }
    }
  }

  if (assets.length === 0) {
    return [...byPath.entries()].map(([sourcePath, row], index) => ({
      id: asNullableString(row.id) ?? `diagram-${index + 1}`,
      sourcePath,
      filename: sourcePath.split("/").pop() ?? `diagram-${index + 1}.webp`,
      pageNumber: asNullableNumber(row.pageNumber) ?? 0,
      relatedQuestionId: asNullableString(row.relatedQuestionId),
      relatedSubQuestionId: asNullableString(row.relatedSubQuestionId),
      title: asNullableString(row.title) ?? "Diagram",
      alt: asNullableString(row.alt) ?? "Exam diagram",
      caption: asNullableString(row.caption) ?? "",
      aiContext: asNullableString(row.aiContext) ?? "",
      category: asNullableString(row.category),
      width: asNullableNumber(row.width) ?? 0,
      height: asNullableNumber(row.height) ?? 0,
    }));
  }

  return assets.map((asset) => {
    const row = byPath.get(asset.path.replace(/\\/g, "/")) ?? {};
    const related = inferRelatedIds(asset, questions, row);

    return {
      id: asNullableString(row.id) ?? asset.id,
      sourcePath: asset.path,
      filename: asset.filename,
      pageNumber: asset.pageNumber,
      relatedQuestionId: related.questionId,
      relatedSubQuestionId: related.subQuestionId,
      title: asNullableString(row.title) ?? "Diagram",
      alt: asNullableString(row.alt) ?? `Diagram ${asset.filename}`,
      caption: asNullableString(row.caption) ?? "",
      aiContext: asNullableString(row.aiContext) ?? "",
      category: asNullableString(row.category),
      width: asset.width,
      height: asset.height,
    } satisfies AcademicDiagram;
  });
}

function attachDiagramsToQuestions(
  questions: AcademicQuestion[],
  diagrams: AcademicDiagram[]
): void {
  for (const diagram of diagrams) {
    if (!diagram.relatedSubQuestionId && !diagram.relatedQuestionId) {
      continue;
    }

    for (const question of questions) {
      if (
        diagram.relatedQuestionId &&
        question.id !== diagram.relatedQuestionId
      ) {
        continue;
      }

      for (const sub of question.subQuestions) {
        if (
          diagram.relatedSubQuestionId &&
          sub.id !== diagram.relatedSubQuestionId
        ) {
          continue;
        }

        if (
          !diagram.relatedSubQuestionId &&
          diagram.relatedQuestionId &&
          question.subQuestions.length > 1
        ) {
          continue;
        }

        const exists = sub.attachments.some(
          (attachment) => attachment.sourcePath === diagram.sourcePath
        );

        if (!exists) {
          sub.attachments.push({
            id: `${sub.id}-img-${sub.attachments.length + 1}`,
            type: "image",
            sourcePath: diagram.sourcePath,
            title: diagram.title,
            alt: diagram.alt,
            caption: diagram.caption,
            aiContext: diagram.aiContext,
            category: diagram.category,
          });
        } else {
          sub.attachments = sub.attachments.map((attachment) =>
            attachment.sourcePath === diagram.sourcePath
              ? {
                  ...attachment,
                  title: diagram.title || attachment.title,
                  alt: diagram.alt || attachment.alt,
                  caption: diagram.caption || attachment.caption,
                  aiContext: diagram.aiContext || attachment.aiContext,
                  category: diagram.category ?? attachment.category,
                }
              : attachment
          );
        }
      }
    }
  }
}

function inferRelatedIds(
  asset: DiagramAsset,
  questions: AcademicQuestion[],
  row: Record<string, unknown>
): { questionId: string | null; subQuestionId: string | null } {
  let questionId = asNullableString(row.relatedQuestionId);
  let subQuestionId = asNullableString(row.relatedSubQuestionId);

  if (questionId && subQuestionId) {
    return { questionId, subQuestionId };
  }

  const basename = asset.filename.replace(/\.webp$/i, "");
  const match = basename.match(/^Q\.?(\d+)(?:-([a-z0-9]+))?$/i);

  if (match) {
    const number = match[1];
    const sub = match[2]?.toLowerCase() ?? null;
    const question =
      questions.find(
        (item) =>
          item.questionNumber.replace(/\s+/g, "").toLowerCase() ===
            `q.${number}` || item.id === `q${number}`
      ) ?? null;

    if (question) {
      questionId = questionId ?? question.id;
      if (sub) {
        const subQuestion =
          question.subQuestions.find((item) =>
            item.id.toLowerCase().endsWith(sub)
          ) ??
          question.subQuestions.find((item) =>
            item.label.toLowerCase().includes(sub)
          ) ??
          null;
        subQuestionId = subQuestionId ?? subQuestion?.id ?? null;
      }
    }
  }

  return { questionId, subQuestionId };
}

function diagramAssetToAcademic(
  asset: DiagramAsset,
  index: number
): AcademicDiagram {
  return {
    id: asset.id || `diagram-${index + 1}`,
    sourcePath: asset.path,
    filename: asset.filename,
    pageNumber: asset.pageNumber,
    relatedQuestionId: null,
    relatedSubQuestionId: null,
    title: "Diagram",
    alt: `Diagram ${asset.filename}`,
    caption: "",
    aiContext: "",
    category: null,
    width: asset.width,
    height: asset.height,
  };
}

function stubAttachment(input: {
  id: string;
  sourcePath: string;
  questionNumber: string;
  label: string;
}): AcademicAttachment {
  return {
    id: input.id,
    type: "image",
    sourcePath: input.sourcePath,
    title: "Diagram",
    alt: `Figure for ${input.questionNumber}${input.label ? `(${input.label.replace(/[()]/g, "")})` : ""}`,
    caption: "",
    aiContext: "",
    category: null,
  };
}

function labelToSuffix(label: string, index: number): string {
  const cleaned = label.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return cleaned || String.fromCharCode(97 + index);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNullableString(value: unknown): string | null {
  return safeTrimOrNull(value);
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && safeTrim(value)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asDifficulty(value: unknown): AcademicDifficulty | null {
  if (
    value === "easy" ||
    value === "medium" ||
    value === "hard" ||
    value === "unknown"
  ) {
    return value;
  }
  return null;
}

function asQuestionType(value: unknown): AcademicQuestionType | null {
  if (
    value === "numerical" ||
    value === "theory" ||
    value === "diagram" ||
    value === "mixed" ||
    value === "unknown"
  ) {
    return value;
  }
  return null;
}
