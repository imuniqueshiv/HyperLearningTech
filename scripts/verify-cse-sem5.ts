import fs from "node:fs";
import path from "node:path";
import { runValidationRules } from "../lib/content-pipeline/validation-rules.js";
import { validateJsonShapes } from "../lib/content-pipeline/json-validator.js";
import type { ProductionPyqsJson } from "../lib/content-pipeline/schema-types.js";

const subjects = [
  "cs-501",
  "cs-502",
  "cs-503-a",
  "cs-503-b",
  "cs-503-c",
  "cs-504-a",
];
let totalErrors = 0;
let totalWarnings = 0;

console.log("=== VERIFYING INTEGRATED CSE SEMESTER 5 PYQS ===");

for (const sub of subjects) {
  const filePath = path.join(
    process.cwd(),
    "content",
    "rgpv",
    "cse",
    "semester-5",
    sub,
    "pyqs.json"
  );
  const syllabusPath = path.join(
    process.cwd(),
    "content",
    "rgpv",
    "cse",
    "semester-5",
    sub,
    "syllabus.json"
  );

  if (!fs.existsSync(filePath)) {
    console.error(`Missing pyqs.json for ${sub}`);
    totalErrors++;
    continue;
  }

  const pyqs: ProductionPyqsJson = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
  const syllabus = fs.existsSync(syllabusPath)
    ? JSON.parse(fs.readFileSync(syllabusPath, "utf8"))
    : null;

  let issueIdx = 0;
  const shape = validateJsonShapes({
    pyqs,
    syllabus,
    nextIndex: () => ++issueIdx,
  });
  const rules = runValidationRules({
    pyqs,
    syllabus,
    jobDir: path.dirname(filePath),
    existingPaths: new Set(),
    nextIndex: () => ++issueIdx,
    contract: "repository",
  });

  const errs = [...shape.errors, ...rules.errors];
  const warns = [...shape.warnings, ...rules.warnings];

  const totalQuestions = pyqs.papers.reduce(
    (sum, p) => sum + p.questions.length,
    0
  );
  const totalSubQuestions = pyqs.papers.reduce(
    (sum, p) =>
      sum + p.questions.reduce((qSum, q) => qSum + q.subQuestions.length, 0),
    0
  );

  console.log(
    `[${sub.toUpperCase()}] ${pyqs.papers.length} papers | ${totalQuestions} questions | ${totalSubQuestions} subquestions | Errors: ${errs.length} | Warnings: ${warns.length}`
  );

  if (errs.length > 0) {
    console.error(`  Errors in ${sub}:`, errs);
  }
  totalErrors += errs.length;
  totalWarnings += warns.length;
}

console.log("\n=== SUMMARY ===");
console.log(`Total Validation Errors: ${totalErrors}`);
console.log(`Total Validation Warnings: ${totalWarnings}`);

if (totalErrors > 0) {
  process.exit(1);
}
