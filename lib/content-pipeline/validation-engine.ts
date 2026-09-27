import { validateProductionArtifacts } from "./validator";
import type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
  ValidationReport,
} from "./schema-types";
import type { ValidationContract } from "./validation-rules";

/**
 * Validation engine entry point — keeps validators independent of builders.
 */
export function runValidationEngine(input: {
  pyqs: ProductionPyqsJson | null;
  syllabus: ProductionSyllabusJson | null;
  jobDir: string;
  existingPaths: Set<string>;
  pyqsPath: string | null;
  syllabusPath: string | null;
  contract?: ValidationContract;
}): ValidationReport {
  return validateProductionArtifacts(input);
}
