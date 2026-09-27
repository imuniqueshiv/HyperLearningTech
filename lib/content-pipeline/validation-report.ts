import type {
  ValidationIssue,
  ValidationReport,
  ValidationStatistics,
} from "./schema-types";

export function createIssue(input: {
  severity: ValidationIssue["severity"];
  code: string;
  message: string;
  path?: string;
  index: number;
}): ValidationIssue {
  return {
    id: `issue-${input.index}`,
    severity: input.severity,
    code: input.code,
    message: input.message,
    path: input.path,
  };
}

export function buildValidationReport(input: {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  statistics: Omit<ValidationStatistics, "errorCount" | "warningCount">;
  durationMs: number;
  pyqsPath: string | null;
  syllabusPath: string | null;
}): ValidationReport {
  const errorCount = input.errors.length;
  const warningCount = input.warnings.length;

  return {
    status: errorCount === 0 ? "PASS" : "FAILED",
    validatedAt: new Date().toISOString(),
    durationMs: input.durationMs,
    errors: input.errors,
    warnings: input.warnings,
    statistics: {
      ...input.statistics,
      errorCount,
      warningCount,
    },
    pyqsPath: input.pyqsPath,
    syllabusPath: input.syllabusPath,
  };
}
