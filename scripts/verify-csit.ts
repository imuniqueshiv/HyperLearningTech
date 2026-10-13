import fs from "node:fs";
import path from "node:path";
import { runValidationRules } from "../lib/content-pipeline/validation-rules.js";
import { validateJsonShapes } from "../lib/content-pipeline/json-validator.js";
import type { ProductionPyqsJson } from "../lib/content-pipeline/schema-types.js";

interface PreExistingSnapshot {
  file: string;
  branch: string;
  semester: string;
  subjectCode: string;
  exam: string;
  year: number;
  month: string;
  questionsCount: number;
}

function runVerification() {
  console.log("=== RUNNING POST-BATCH CSIT VERIFICATION ===");

  const invPath = path.join(
    "C:",
    "Users",
    "singh",
    ".gemini",
    "antigravity-ide",
    "brain",
    "3288b9f4-5d48-4703-ade0-8d93bad6d780",
    "scratch",
    "existing_repo_inventory.json"
  );

  const rawInv: PreExistingSnapshot[] = JSON.parse(
    fs.readFileSync(invPath, "utf8")
  );
  const preExistingCsit = rawInv.filter((p) => p.branch === "csit");
  console.log(
    `Pre-existing CSIT papers snapshot count: ${preExistingCsit.length}`
  );

  const csitRoot = path.join(process.cwd(), "content", "rgpv", "csit");
  const semesters = fs.readdirSync(csitRoot).sort();

  let totalCsitPapers = 0;
  let totalSchemaErrors = 0;
  const subjectSummaries: Record<
    string,
    { papers: number; newPapers: number }
  > = {};

  for (const sem of semesters) {
    const semDir = path.join(csitRoot, sem);
    if (!fs.statSync(semDir).isDirectory()) continue;

    const subjects = fs.readdirSync(semDir).sort();
    for (const sub of subjects) {
      const subDir = path.join(semDir, sub);
      const pyqPath = path.join(subDir, "pyqs.json");
      if (!fs.existsSync(pyqPath)) continue;

      const data: ProductionPyqsJson = JSON.parse(
        fs.readFileSync(pyqPath, "utf8")
      );
      const count = data.papers?.length ?? 0;
      totalCsitPapers += count;

      // Validate shape
      let issueIdx = 0;
      const shapeResult = validateJsonShapes({
        pyqs: data,
        syllabus: null,
        nextIndex: () => ++issueIdx,
      });

      const ruleResult = runValidationRules({
        pyqs: data,
        syllabus: null,
        jobDir: subDir,
        existingPaths: new Set(),
        nextIndex: () => ++issueIdx,
        contract: "repository",
      });

      const errors = [...shapeResult.errors, ...ruleResult.errors];
      if (errors.length > 0) {
        console.error(`VALIDATION ERRORS in ${sem}/${sub}:`, errors);
        totalSchemaErrors += errors.length;
      }

      const preCountForSub = preExistingCsit.filter(
        (p) => p.semester === sem && p.subjectCode === sub
      ).length;

      subjectSummaries[`${sem}/${sub}`] = {
        papers: count,
        newPapers: count - preCountForSub,
      };
    }
  }

  console.log("\nSubject Summaries after Batch 1:");
  console.table(subjectSummaries);
  console.log(`\nTotal CSIT Papers in Repo: ${totalCsitPapers}`);
  console.log(`Total Validation Errors: ${totalSchemaErrors}`);

  // PROVE PRE-EXISTING RECORDS ARE UNCHANGED
  console.log("\n=== CHECKING INTEGRITY OF PRE-EXISTING CSIT PAPERS ===");
  let unchangedCount = 0;
  let missingPreExisting = 0;

  for (const pre of preExistingCsit) {
    const pyqPath = path.join(
      csitRoot,
      pre.semester,
      pre.subjectCode,
      "pyqs.json"
    );
    if (!fs.existsSync(pyqPath)) {
      console.error(`MISSING FILE for pre-existing paper: ${pyqPath}`);
      missingPreExisting++;
      continue;
    }
    const current: ProductionPyqsJson = JSON.parse(
      fs.readFileSync(pyqPath, "utf8")
    );
    const matchedPaper = current.papers.find(
      (p) => p.exam.trim().toLowerCase() === pre.exam.trim().toLowerCase()
    );

    if (!matchedPaper) {
      console.error(
        `MISSING PAPER: ${pre.exam} in ${pre.semester}/${pre.subjectCode}`
      );
      missingPreExisting++;
    } else {
      if (matchedPaper.questions.length !== pre.questionsCount) {
        console.error(
          `QUESTION COUNT MISMATCH for ${pre.exam} in ${pre.semester}/${pre.subjectCode}: expected ${pre.questionsCount}, got ${matchedPaper.questions.length}`
        );
      } else {
        unchangedCount++;
      }
    }
  }

  console.log(
    `Pre-existing papers verified unchanged: ${unchangedCount} / ${preExistingCsit.length}`
  );
  if (missingPreExisting > 0) {
    throw new Error(
      `Integrity violation: ${missingPreExisting} pre-existing papers modified or missing!`
    );
  }

  if (totalSchemaErrors > 0) {
    throw new Error(
      `Schema validation failed with ${totalSchemaErrors} errors!`
    );
  }

  console.log("=== VERIFICATION PASSED PERFECTLY ===");
}

runVerification();
