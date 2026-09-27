import type { AcademicDocument } from "./academic-document";
import { buildProductionPyqs } from "./pyq-schema-builder";
import type { SchemaBuildResult } from "./schema-types";
import { buildProductionSyllabus } from "./syllabus-schema-builder";

/**
 * Orchestrates PYQ + syllabus production preview JSON from AcademicDocument.
 */
export function buildProductionSchemas(
  document: AcademicDocument
): SchemaBuildResult {
  const hasQuestions = document.questions.length > 0;
  const hasSyllabusSignal =
    document.units.length > 0 || document.topics.length > 0;

  const pyqs =
    hasQuestions || document.metadata.jobType === "pyq"
      ? buildProductionPyqs(document)
      : null;

  const syllabus =
    hasSyllabusSignal || document.metadata.jobType === "syllabus"
      ? buildProductionSyllabus(document)
      : null;

  const diagramCount = countAttachments(pyqs) || document.diagrams.length;

  return {
    pyqs,
    syllabus,
    questionCount: pyqs?.papers[0]?.questions.length ?? 0,
    subQuestionCount:
      pyqs?.papers[0]?.questions.reduce(
        (sum, question) => sum + question.subQuestions.length,
        0
      ) ?? 0,
    moduleCount: syllabus?.modules.length ?? 0,
    topicCount:
      syllabus?.modules.reduce(
        (sum, module) => sum + module.topics.length,
        0
      ) ?? 0,
    diagramCount,
  };
}

function countAttachments(pyqs: SchemaBuildResult["pyqs"]): number {
  if (!pyqs) {
    return 0;
  }

  return pyqs.papers.reduce(
    (paperSum, paper) =>
      paperSum +
      paper.questions.reduce(
        (qSum, question) =>
          qSum +
          question.subQuestions.reduce(
            (sSum, sub) => sSum + (sub.attachments?.length ?? 0),
            0
          ),
        0
      ),
    0
  );
}
