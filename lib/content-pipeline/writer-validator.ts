import { runValidationEngine } from "./validation-engine";
import type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
  ValidationReport,
} from "./schema-types";
import type { ValidationContract } from "./validation-rules";

/**
 * Writer-facing validation wrapper — reuses the shared validation engine.
 * Defaults to the repository contract because merged output includes
 * existing papers that omit CMS-only fields such as sub-question unit.
 */
export function validateForWrite(input: {
  pyqs: ProductionPyqsJson | null;
  syllabus: ProductionSyllabusJson | null;
  existingPaths: Set<string>;
  pyqsPath: string | null;
  syllabusPath: string | null;
  contract?: ValidationContract;
}): ValidationReport {
  return runValidationEngine({
    pyqs: input.pyqs,
    syllabus: input.syllabus,
    jobDir: "",
    existingPaths: input.existingPaths,
    pyqsPath: input.pyqsPath,
    syllabusPath: input.syllabusPath,
    contract: input.contract ?? "repository",
  });
}
