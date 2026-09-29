import type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
  ValidationIssue,
} from "./schema-types";
import { createIssue } from "./validation-report";
import { asStringArray, safeTrim } from "./string-normalize";

export type ValidationContract = "incoming" | "repository";

export interface RuleContext {
  pyqs: ProductionPyqsJson | null;
  syllabus: ProductionSyllabusJson | null;
  jobDir: string;
  existingPaths: Set<string>;
  nextIndex: () => number;
  /**
   * incoming — strict CMS production preview (schema/validation stage).
   * repository — merged content that may include authoritative repo omissions
   * such as missing sub-question unit or string syllabus topics.
   */
  contract?: ValidationContract;
}

/**
 * Shared validation rules for PYQ + syllabus production preview JSON.
 */
export function runValidationRules(context: RuleContext): {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!context.pyqs && !context.syllabus) {
    errors.push(
      createIssue({
        severity: "error",
        code: "NO_ARTIFACTS",
        message:
          "No production-pyqs.json or production-syllabus.json available.",
        index: context.nextIndex(),
      })
    );
    return { errors, warnings };
  }

  if (context.pyqs) {
    validatePyqs(context.pyqs, context, errors, warnings);
  }

  if (context.syllabus) {
    validateSyllabus(context.syllabus, context, errors, warnings);
  }

  return { errors, warnings };
}

function validatePyqs(
  pyqs: ProductionPyqsJson,
  context: RuleContext,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  const subject = pyqs.subject;
  requireString(
    subject.id,
    "MISSING_SUBJECT_ID",
    "subject.id",
    errors,
    context
  );
  requireString(
    subject.code,
    "MISSING_SUBJECT_CODE",
    "subject.code",
    errors,
    context
  );
  requireString(
    subject.name,
    "MISSING_SUBJECT_NAME",
    "subject.name",
    errors,
    context
  );
  requireString(
    subject.title,
    "MISSING_SUBJECT_TITLE",
    "subject.title",
    errors,
    context
  );

  if (!Array.isArray(pyqs.papers) || pyqs.papers.length === 0) {
    errors.push(
      createIssue({
        severity: "error",
        code: "EMPTY_PAPERS",
        message: "papers must contain at least one paper.",
        path: "papers",
        index: context.nextIndex(),
      })
    );
    return;
  }

  // Attachment IDs stay repository-wide; question/sub-question IDs are
  // paper-scoped to match the existing on-disk PYQ model (q1–q8 per paper).
  const attachmentIds = new Set<string>();

  pyqs.papers.forEach((paper, paperIndex) => {
    const paperPath = `papers[${paperIndex}]`;
    const questionIds = new Set<string>();
    const subQuestionIds = new Set<string>();

    if (!safeTrim(paper.exam)) {
      errors.push(
        createIssue({
          severity: "error",
          code: "MISSING_EXAM",
          message: "Paper exam label is required.",
          path: `${paperPath}.exam`,
          index: context.nextIndex(),
        })
      );
    }

    if (!Number.isFinite(paper.year) || paper.year < 2000) {
      errors.push(
        createIssue({
          severity: "error",
          code: "INVALID_YEAR",
          message: `Invalid paper year: ${paper.year}`,
          path: `${paperPath}.year`,
          index: context.nextIndex(),
        })
      );
    }

    if (!safeTrim(paper.month)) {
      errors.push(
        createIssue({
          severity: "error",
          code: "MISSING_MONTH",
          message: "Paper month is required.",
          path: `${paperPath}.month`,
          index: context.nextIndex(),
        })
      );
    }

    if (!Array.isArray(paper.questions) || paper.questions.length === 0) {
      errors.push(
        createIssue({
          severity: "error",
          code: "EMPTY_QUESTIONS",
          message: "Paper has no questions.",
          path: `${paperPath}.questions`,
          index: context.nextIndex(),
        })
      );
      return;
    }

    let previousNumber = 0;
    const seenQuestionNumbers = new Set<number>();
    const questionNumberList: number[] = [];

    paper.questions.forEach((question, qIndex) => {
      const qPath = `${paperPath}.questions[${qIndex}]`;

      if (!safeTrim(question.id)) {
        errors.push(
          createIssue({
            severity: "error",
            code: "MISSING_QUESTION_ID",
            message: "Question id is required.",
            path: `${qPath}.id`,
            index: context.nextIndex(),
          })
        );
      } else if (questionIds.has(question.id)) {
        errors.push(
          createIssue({
            severity: "error",
            code: "DUPLICATE_QUESTION_ID",
            message: `Duplicate question id: ${question.id}`,
            path: `${qPath}.id`,
            index: context.nextIndex(),
          })
        );
      } else {
        questionIds.add(question.id);
      }

      if (!/^Q\.\d+$/i.test(safeTrim(question.questionNumber))) {
        warnings.push(
          createIssue({
            severity: "warning",
            code: "QUESTION_NUMBERING",
            message: `Unexpected questionNumber format: ${safeTrim(question.questionNumber) || "(missing)"}`,
            path: `${qPath}.questionNumber`,
            index: context.nextIndex(),
          })
        );
      }

      const numberMatch = safeTrim(question.questionNumber).match(/(\d+)/);
      if (numberMatch) {
        const current = Number(numberMatch[1]);
        questionNumberList.push(current);
        if (seenQuestionNumbers.has(current)) {
          warnings.push(
            createIssue({
              severity: "warning",
              code: "DUPLICATE_QUESTION_NUMBER",
              message: `Duplicate question number: ${question.questionNumber}`,
              path: `${qPath}.questionNumber`,
              index: context.nextIndex(),
            })
          );
        }
        seenQuestionNumbers.add(current);
        if (current < previousNumber) {
          warnings.push(
            createIssue({
              severity: "warning",
              code: "INVALID_READING_ORDER",
              message: `Question numbering out of order near ${question.questionNumber}`,
              path: `${qPath}.questionNumber`,
              index: context.nextIndex(),
            })
          );
        }
        previousNumber = current;
      }

      if (!question.subQuestions?.length) {
        // Keep as warning so Gemini/OCR partials reach review instead of
        // hard-failing the whole import (operator can reject in review).
        warnings.push(
          createIssue({
            severity: "warning",
            code: "EMPTY_SUBQUESTIONS",
            message: `Question ${question.questionNumber} has no subQuestions.`,
            path: `${qPath}.subQuestions`,
            index: context.nextIndex(),
          })
        );
        return;
      }

      question.subQuestions.forEach((sub, sIndex) => {
        const sPath = `${qPath}.subQuestions[${sIndex}]`;

        if (!safeTrim(sub.id)) {
          errors.push(
            createIssue({
              severity: "error",
              code: "MISSING_SUBQUESTION_ID",
              message: "Sub-question id is required.",
              path: `${sPath}.id`,
              index: context.nextIndex(),
            })
          );
        } else if (subQuestionIds.has(sub.id)) {
          errors.push(
            createIssue({
              severity: "error",
              code: "DUPLICATE_SUBQUESTION_ID",
              message: `Duplicate sub-question id: ${sub.id}`,
              path: `${sPath}.id`,
              index: context.nextIndex(),
            })
          );
        } else {
          subQuestionIds.add(sub.id);
        }

        if (!safeTrim(sub.text)) {
          errors.push(
            createIssue({
              severity: "error",
              code: "MISSING_REQUIRED_FIELD",
              message: "Sub-question text is required.",
              path: `${sPath}.text`,
              index: context.nextIndex(),
            })
          );
        }

        if (!safeTrim(sub.unit)) {
          if (context.contract === "repository") {
            warnings.push(
              createIssue({
                severity: "warning",
                code: "OPTIONAL_UNIT_ABSENT",
                message:
                  "Sub-question unit is omitted. Allowed on existing repository papers.",
                path: `${sPath}.unit`,
                index: context.nextIndex(),
              })
            );
          } else {
            errors.push(
              createIssue({
                severity: "error",
                code: "MISSING_UNIT",
                message: "Sub-question unit is required.",
                path: `${sPath}.unit`,
                index: context.nextIndex(),
              })
            );
          }
        }

        if (!safeTrim(sub.type)) {
          warnings.push(
            createIssue({
              severity: "warning",
              code: "MISSING_TOPIC_TYPE",
              message: "Sub-question type (topic slug) is missing.",
              path: `${sPath}.type`,
              index: context.nextIndex(),
            })
          );
        }

        (sub.attachments ?? []).forEach((attachment, aIndex) => {
          const aPath = `${sPath}.attachments[${aIndex}]`;
          validateAttachment(
            attachment,
            aPath,
            attachmentIds,
            context,
            errors,
            warnings
          );
        });
      });

      // Phase 2: detect gaps in question serial numbers (do not invent missing Qs)
      if (questionNumberList.length >= 2) {
        const unique = [...new Set(questionNumberList)].sort((a, b) => a - b);
        for (let n = unique[0]; n <= unique[unique.length - 1]; n += 1) {
          if (!seenQuestionNumbers.has(n)) {
            warnings.push(
              createIssue({
                severity: "warning",
                code: "QUESTION_NUMBER_GAP",
                message: `Missing question number Q.${n} in paper sequence.`,
                path: `${paperPath}.questions`,
                index: context.nextIndex(),
              })
            );
          }
        }
      }
    });
  });
}

function validateSyllabus(
  syllabus: ProductionSyllabusJson,
  context: RuleContext,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  requireString(
    syllabus.subject.id,
    "MISSING_SUBJECT_ID",
    "subject.id",
    errors,
    context
  );
  requireString(
    syllabus.subject.code,
    "MISSING_SUBJECT_CODE",
    "subject.code",
    errors,
    context
  );

  if (!Array.isArray(syllabus.modules) || syllabus.modules.length === 0) {
    errors.push(
      createIssue({
        severity: "error",
        code: "EMPTY_MODULES",
        message: "Syllabus has no modules.",
        path: "modules",
        index: context.nextIndex(),
      })
    );
    return;
  }

  const moduleIds = new Set<string>();
  const topicIds = new Set<string>();

  syllabus.modules.forEach((module, mIndex) => {
    const mPath = `modules[${mIndex}]`;

    if (!safeTrim(module.id)) {
      errors.push(
        createIssue({
          severity: "error",
          code: "INVALID_MODULE_ID",
          message: "Module id is required.",
          path: `${mPath}.id`,
          index: context.nextIndex(),
        })
      );
    } else if (moduleIds.has(module.id)) {
      errors.push(
        createIssue({
          severity: "error",
          code: "DUPLICATE_MODULE_ID",
          message: `Duplicate module id: ${module.id}`,
          path: `${mPath}.id`,
          index: context.nextIndex(),
        })
      );
    } else {
      moduleIds.add(module.id);
    }

    if (!Number.isFinite(module.number) || module.number < 1) {
      errors.push(
        createIssue({
          severity: "error",
          code: "INVALID_MODULE_NUMBER",
          message: `Invalid module number: ${module.number}`,
          path: `${mPath}.number`,
          index: context.nextIndex(),
        })
      );
    }

    if (!safeTrim(module.title)) {
      errors.push(
        createIssue({
          severity: "error",
          code: "MISSING_REQUIRED_FIELD",
          message: "Module title is required.",
          path: `${mPath}.title`,
          index: context.nextIndex(),
        })
      );
    }

    const topics = Array.isArray(module.topics) ? module.topics : [];

    if (!topics.length) {
      warnings.push(
        createIssue({
          severity: "warning",
          code: "MISSING_TOPICS",
          message: `Module ${module.id} has no topics.`,
          path: `${mPath}.topics`,
          index: context.nextIndex(),
        })
      );
    }

    topics.forEach((topic, tIndex) => {
      const tPath = `${mPath}.topics[${tIndex}]`;

      if (typeof topic === "string") {
        if (context.contract !== "repository") {
          errors.push(
            createIssue({
              severity: "error",
              code: "SCHEMA_MISMATCH",
              message:
                "Incoming syllabus topics must be objects with id, slug, and title.",
              path: tPath,
              index: context.nextIndex(),
            })
          );
        } else if (!safeTrim(topic)) {
          errors.push(
            createIssue({
              severity: "error",
              code: "MISSING_REQUIRED_FIELD",
              message: "Topic title is required.",
              path: tPath,
              index: context.nextIndex(),
            })
          );
        }
        return;
      }

      if (!safeTrim(topic.id)) {
        errors.push(
          createIssue({
            severity: "error",
            code: "INVALID_TOPIC_ID",
            message: "Topic id is required.",
            path: `${tPath}.id`,
            index: context.nextIndex(),
          })
        );
      } else if (topicIds.has(topic.id)) {
        errors.push(
          createIssue({
            severity: "error",
            code: "DUPLICATE_TOPIC_ID",
            message: `Duplicate topic id: ${topic.id}`,
            path: `${tPath}.id`,
            index: context.nextIndex(),
          })
        );
      } else {
        topicIds.add(topic.id);
        if (!topic.id.startsWith(module.id)) {
          warnings.push(
            createIssue({
              severity: "warning",
              code: "BROKEN_PARENT_REFERENCE",
              message: `Topic id ${topic.id} does not start with module id ${module.id}.`,
              path: `${tPath}.id`,
              index: context.nextIndex(),
            })
          );
        }
      }

      if (!safeTrim(topic.slug) || !safeTrim(topic.title)) {
        errors.push(
          createIssue({
            severity: "error",
            code: "MISSING_REQUIRED_FIELD",
            message: "Topic slug and title are required.",
            path: tPath,
            index: context.nextIndex(),
          })
        );
      }
    });
  });

  // Orphan topics check is N/A for production flat modules; cross-check questionIds uniqueness
  const linkIds = new Set<string>();
  for (const syllabusModule of syllabus.modules) {
    for (const id of [
      ...asStringArray(syllabusModule.questionIds),
      ...asStringArray(syllabusModule.predictedQuestionIds),
    ]) {
      if (linkIds.has(id)) {
        warnings.push(
          createIssue({
            severity: "warning",
            code: "DUPLICATE_QUESTION_LINK",
            message: `Duplicate syllabus question link id: ${id}`,
            path: `modules`,
            index: context.nextIndex(),
          })
        );
      }
      linkIds.add(id);
    }
  }
}

function validateAttachment(
  attachment: {
    id: string;
    type: string;
    path: string;
    title: string;
    alt: string;
    caption: string;
    aiContext: string;
  },
  path: string,
  attachmentIds: Set<string>,
  context: RuleContext,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  if (!safeTrim(attachment.id)) {
    errors.push(
      createIssue({
        severity: "error",
        code: "INVALID_ATTACHMENT_ID",
        message: "Attachment id is required.",
        path: `${path}.id`,
        index: context.nextIndex(),
      })
    );
  } else if (attachmentIds.has(attachment.id)) {
    errors.push(
      createIssue({
        severity: "error",
        code: "DUPLICATE_ATTACHMENT_ID",
        message: `Duplicate attachment id: ${attachment.id}`,
        path: `${path}.id`,
        index: context.nextIndex(),
      })
    );
  } else {
    attachmentIds.add(attachment.id);
  }

  if (attachment.type !== "image") {
    errors.push(
      createIssue({
        severity: "error",
        code: "UNKNOWN_ATTACHMENT_TYPE",
        message: `Unknown attachment type: ${attachment.type}`,
        path: `${path}.type`,
        index: context.nextIndex(),
      })
    );
  }

  if (!safeTrim(attachment.path) || safeTrim(attachment.path).includes("..")) {
    errors.push(
      createIssue({
        severity: "error",
        code: "BROKEN_ATTACHMENT_PATH",
        message: `Invalid attachment path: ${attachment.path}`,
        path: `${path}.path`,
        index: context.nextIndex(),
      })
    );
  } else if (!context.existingPaths.has(attachment.path.replace(/\\/g, "/"))) {
    // Incoming CMS jobs must resolve attachments inside the job workspace.
    // Repository / merged write validation includes existing papers whose
    // diagram paths already live under content/.../diagrams/ — those files
    // are not present in the job workspace Set, so treat as warning only.
    const issue = createIssue({
      severity: context.contract === "repository" ? "warning" : "error",
      code: "BROKEN_DIAGRAM_REFERENCE",
      message: `Attachment file missing in job workspace: ${attachment.path}`,
      path: `${path}.path`,
      index: context.nextIndex(),
    });
    if (context.contract === "repository") {
      warnings.push(issue);
    } else {
      errors.push(issue);
    }
  }

  if (!safeTrim(attachment.title)) {
    warnings.push(
      createIssue({
        severity: "warning",
        code: "MISSING_CAPTION_TITLE",
        message: "Attachment title is empty.",
        path: `${path}.title`,
        index: context.nextIndex(),
      })
    );
  }

  if (!safeTrim(attachment.alt)) {
    errors.push(
      createIssue({
        severity: "error",
        code: "MISSING_ALT_TEXT",
        message: "Attachment alt text is required.",
        path: `${path}.alt`,
        index: context.nextIndex(),
      })
    );
  }

  if (!safeTrim(attachment.caption)) {
    warnings.push(
      createIssue({
        severity: "warning",
        code: "MISSING_CAPTION",
        message: "Attachment caption is empty.",
        path: `${path}.caption`,
        index: context.nextIndex(),
      })
    );
  }

  if (!safeTrim(attachment.aiContext)) {
    // Diagram reconstruction is out of scope ([DIAGRAM_PRESENT] only).
    // Missing Gemini/diagram aiContext must not hard-fail the pipeline —
    // surface as REVIEW_REQUIRED via warning instead.
    warnings.push(
      createIssue({
        severity: "warning",
        code: "MISSING_AI_CONTEXT",
        message:
          "Attachment aiContext is empty; review diagram placeholder before publish.",
        path: `${path}.aiContext`,
        index: context.nextIndex(),
      })
    );
  }
}

function requireString(
  value: string | null | undefined,
  code: string,
  path: string,
  errors: ValidationIssue[],
  context: RuleContext
): void {
  if (!safeTrim(value)) {
    errors.push(
      createIssue({
        severity: "error",
        code,
        message: `Missing required field at ${path}.`,
        path,
        index: context.nextIndex(),
      })
    );
  }
}
