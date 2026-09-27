/**
 * Verify paper-scoped ID uniqueness: validate pending-pyqs from the failed job.
 */
import fs from "fs";
import path from "path";

import { runValidationEngine } from "../../lib/content-pipeline/validation-engine";
import type { ProductionPyqsJson } from "../../lib/content-pipeline/schema-types";

const jobId = "job_315a2b7249f143569a6cb2e2c51cc9fa";
const jobDir = path.join(process.cwd(), ".cms", "uploads", jobId);
const pendingPath = path.join(jobDir, "pending-pyqs.json");

const pyqs = JSON.parse(
  fs.readFileSync(pendingPath, "utf8")
) as ProductionPyqsJson;

const report = runValidationEngine({
  pyqs,
  syllabus: null,
  jobDir,
  existingPaths: new Set(),
  pyqsPath: "pending-pyqs.json",
  syllabusPath: null,
});

const duplicateErrors = report.errors.filter(
  (e) =>
    e.code === "DUPLICATE_QUESTION_ID" ||
    e.code === "DUPLICATE_SUBQUESTION_ID"
);

console.log(
  JSON.stringify(
    {
      status: report.status,
      paperCount: pyqs.papers.length,
      errorCount: report.errors.length,
      warningCount: report.warnings.length,
      duplicateErrorCount: duplicateErrors.length,
      errorCodes: [...new Set(report.errors.map((e) => e.code))],
      firstError: report.errors[0] ?? null,
    },
    null,
    2
  )
);

if (report.status !== "PASS" || duplicateErrors.length > 0) {
  process.exitCode = 1;
}
