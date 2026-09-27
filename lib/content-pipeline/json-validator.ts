import type { ValidationIssue } from "./schema-types";
import { createIssue } from "./validation-report";

/**
 * Lightweight JSON shape checks before semantic rules.
 */
export function validateJsonShapes(input: {
  pyqs: unknown;
  syllabus: unknown;
  nextIndex: () => number;
}): { errors: ValidationIssue[]; warnings: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (input.pyqs != null) {
    if (!isObject(input.pyqs)) {
      errors.push(
        createIssue({
          severity: "error",
          code: "INVALID_JSON_SHAPE",
          message: "production-pyqs.json root must be an object.",
          path: "pyqs",
          index: input.nextIndex(),
        })
      );
    } else {
      const pyqs = input.pyqs;
      if (!isObject(pyqs.subject) || !Array.isArray(pyqs.papers)) {
        errors.push(
          createIssue({
            severity: "error",
            code: "SCHEMA_MISMATCH",
            message: "PYQ JSON must include subject object and papers array.",
            path: "pyqs",
            index: input.nextIndex(),
          })
        );
      }
    }
  }

  if (input.syllabus != null) {
    if (!isObject(input.syllabus)) {
      errors.push(
        createIssue({
          severity: "error",
          code: "INVALID_JSON_SHAPE",
          message: "production-syllabus.json root must be an object.",
          path: "syllabus",
          index: input.nextIndex(),
        })
      );
    } else {
      const syllabus = input.syllabus;
      if (!isObject(syllabus.subject) || !Array.isArray(syllabus.modules)) {
        errors.push(
          createIssue({
            severity: "error",
            code: "SCHEMA_MISMATCH",
            message:
              "Syllabus JSON must include subject object and modules array.",
            path: "syllabus",
            index: input.nextIndex(),
          })
        );
      }
    }
  }

  return { errors, warnings };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
