import type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
  ValidationReport,
} from "./schema-types";
import { validateJsonShapes } from "./json-validator";
import { buildValidationReport } from "./validation-report";
import {
  runValidationRules,
  type ValidationContract,
} from "./validation-rules";

export interface ValidateProductionInput {
  pyqs: ProductionPyqsJson | null;
  syllabus: ProductionSyllabusJson | null;
  jobDir: string;
  existingPaths: Set<string>;
  pyqsPath: string | null;
  syllabusPath: string | null;
  contract?: ValidationContract;
}

/**
 * Validates production preview JSON for both PYQ and syllabus artifacts.
 */
export function validateProductionArtifacts(
  input: ValidateProductionInput
): ValidationReport {
  const started = Date.now();
  let issueIndex = 0;
  const nextIndex = () => {
    issueIndex += 1;
    return issueIndex;
  };

  const shape = validateJsonShapes({
    pyqs: input.pyqs,
    syllabus: input.syllabus,
    nextIndex,
  });

  const semantic = runValidationRules({
    pyqs: input.pyqs,
    syllabus: input.syllabus,
    jobDir: input.jobDir,
    existingPaths: input.existingPaths,
    nextIndex,
    contract: input.contract ?? "incoming",
  });

  const errors = [...shape.errors, ...semantic.errors];
  const warnings = [...shape.warnings, ...semantic.warnings];

  return buildValidationReport({
    errors,
    warnings,
    statistics: {
      questionCount:
        input.pyqs?.papers.reduce(
          (sum, paper) => sum + paper.questions.length,
          0
        ) ?? 0,
      subQuestionCount:
        input.pyqs?.papers.reduce(
          (sum, paper) =>
            sum +
            paper.questions.reduce(
              (qSum, question) => qSum + question.subQuestions.length,
              0
            ),
          0
        ) ?? 0,
      moduleCount: input.syllabus?.modules.length ?? 0,
      topicCount:
        input.syllabus?.modules.reduce(
          (sum, module) => sum + module.topics.length,
          0
        ) ?? 0,
      diagramCount:
        input.pyqs?.papers.reduce(
          (sum, paper) =>
            sum +
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
        ) ?? 0,
      attachmentCount:
        input.pyqs?.papers.reduce(
          (sum, paper) =>
            sum +
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
        ) ?? 0,
    },
    durationMs: Date.now() - started,
    pyqsPath: input.pyqsPath,
    syllabusPath: input.syllabusPath,
  });
}
