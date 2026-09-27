import type { AcademicDocument } from "./academic-document";
import type {
  ProductionSyllabusJson,
  ProductionSyllabusModule,
  ProductionSyllabusSubject,
  ProductionTopic,
} from "./schema-types";
import {
  buildCanonicalQuestionLinkId,
  buildModuleId,
  buildTopicId,
  extractQuestionIndex,
  normalizeSubjectCode,
  slugify,
  toSubjectId,
  toSubjectKey,
} from "./stable-id-generator";
import {
  firstNonEmpty,
  rethrowAsPipelineFieldError,
  safeTrim,
} from "./string-normalize";

/**
 * Builds production syllabus.json shape from AcademicDocument.
 * Production syllabus has modules → topics only (no nested subTopics).
 */
export function buildProductionSyllabus(
  document: AcademicDocument
): ProductionSyllabusJson {
  try {
    const subject = buildSyllabusSubject(document);
    const subjectKey = toSubjectKey(subject.code);
    const modules = buildModules(document, subjectKey);

    return {
      subject,
      modules,
    };
  } catch (error) {
    rethrowAsPipelineFieldError(error, "Schema Builder");
  }
}

function buildSyllabusSubject(
  document: AcademicDocument
): ProductionSyllabusSubject {
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
    university: firstNonEmpty(
      document.metadata.university,
      "Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal"
    ),
    scheme: "New Scheme Based On AICTE Flexible Curricula",
    semester: firstNonEmpty(document.metadata.semester, "I/II"),
    credits: 3,
    lectureTutorialPractical: "2L-0T-2P",
    commonTo: "All Disciplines",
  };
}

function buildModules(
  document: AcademicDocument,
  subjectKey: string
): ProductionSyllabusModule[] {
  const units =
    document.units.length > 0
      ? document.units
      : synthesizeUnitsFromTopics(document);

  return units.map((unit, index) => {
    const number = unit.number ?? index + 1;
    const moduleId = buildModuleId(subjectKey, number);
    const topics = buildTopicsForModule(document, unit.id, moduleId, number);
    const questionIds = collectQuestionIds(document, number, false);
    const predictedQuestionIds = collectQuestionIds(document, number, true);

    return {
      id: moduleId,
      number,
      title: firstNonEmpty(unit.title, `Unit ${number}`),
      hours: unit.hours ?? 8,
      topics,
      questionIds,
      predictedQuestionIds,
    };
  });
}

function synthesizeUnitsFromTopics(
  document: AcademicDocument
): AcademicDocument["units"] {
  if (document.topics.length === 0) {
    return [];
  }

  return [
    {
      id: "unit-1",
      number: 1,
      title: "Unit 1",
      hours: 8,
      topicIds: document.topics.map((topic) => topic.id),
    },
  ];
}

function buildTopicsForModule(
  document: AcademicDocument,
  academicUnitId: string,
  moduleId: string,
  unitNumber: number
): ProductionTopic[] {
  const matched = document.topics.filter(
    (topic) =>
      topic.unitId === academicUnitId ||
      (!topic.unitId && document.units.length <= 1)
  );

  const source =
    matched.length > 0
      ? matched
      : document.topics.filter((topic) => {
          const unitHint = safeTrim(topic.slug).match(/u(\d+)/i);
          return unitHint ? Number(unitHint[1]) === unitNumber : false;
        });

  return [...source]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((topic, index) => {
      const displayOrder = topic.displayOrder || index + 1;
      const title = firstNonEmpty(topic.title, `Topic ${displayOrder}`);
      const slug =
        slugify(firstNonEmpty(topic.slug, title)) || `topic-${displayOrder}`;
      return {
        id: buildTopicId(moduleId, slug, displayOrder),
        slug,
        title,
        displayOrder,
      };
    });
}

function collectQuestionIds(
  document: AcademicDocument,
  unitNumber: number,
  predictedOnly: boolean
): string[] {
  const isPredicted = document.exam?.isPredicted === true;
  if (predictedOnly && !isPredicted) {
    return [];
  }
  if (!predictedOnly && isPredicted) {
    return [];
  }

  const subjectKey = toSubjectKey(document.metadata.subjectCode);
  const month = document.exam?.month ?? null;
  const year = document.exam?.year ?? null;
  const ids: string[] = [];

  document.questions.forEach((question, qIndex) => {
    const questionIndex = extractQuestionIndex(
      question.questionNumber,
      qIndex + 1
    );
    const matchesUnit = question.subQuestions.some((sub) => {
      const unit = safeTrim(sub.unit, "");
      const match = unit.match(/(\d+)/);
      return match ? Number(match[1]) === unitNumber : unitNumber === 1;
    });

    if (!matchesUnit && document.units.length > 1) {
      return;
    }

    ids.push(
      buildCanonicalQuestionLinkId({
        subjectKey,
        unitNumber,
        month,
        year,
        questionIndex,
        isPredicted,
      })
    );
  });

  return [...new Set(ids)];
}
