/**
 * Regression for November 2023 AL-402 validation failure mis-attributed to Merge.
 *
 * Proven artifacts (job_0756c2040aee4df09dba44e4a7c28e0b):
 * - academic-document.json exam.year = 2023
 * - metadata.year admin override = 1984
 * - applySessionExamHints overwrote Gemini year → production-pyqs year=1984
 * - validation-report INVALID_YEAR
 * - UI painted Validation ✓ / Merge ✗ because any validation summary marked done
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import type { AcademicDocument } from "../../lib/content-pipeline/academic-document";
import {
  isValidExamYear,
  parseExamSession,
} from "../../lib/content-pipeline/metadata-extractor";
import { PipelineStage } from "../../lib/content-pipeline/pipeline-stage";
import { applySessionExamHints } from "../../lib/content-pipeline/schema-builder-service";
import {
  getImportSessionStatus,
  getSessionStepStates,
} from "../../lib/content-pipeline/session-status";
import type {
  ImportJobRecord,
  UploadJobMetadata,
} from "../../lib/content-pipeline/types";
import { buildProductionPyqs } from "../../lib/content-pipeline/pyq-schema-builder";
import { runValidationEngine } from "../../lib/content-pipeline/validation-engine";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
/**
 * Proven job artifacts live under fixtures/ (not .cms/) so CI can run the
 * same regression without the gitignored upload workspace.
 */
const JOB_DIR = path.join(
  REPO_ROOT,
  "scripts/cms-reliability/fixtures/job_0756c2040aee4df09dba44e4a7c28e0b"
);

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

describe("Nov 2023 INVALID_YEAR / UI mis-map (exact job)", () => {
  it("does not let invalid admin year 1984 overwrite Gemini year 2023", () => {
    const academic = readJson<AcademicDocument>(
      path.join(JOB_DIR, "academic-document.json")
    );
    assert.equal(academic.exam?.year, 2023);
    assert.equal(academic.exam?.month, "November");

    const metadata = {
      year: 1984,
      examSession: null,
      subjectCode: "AL-402",
      semester: "semester-4",
      branch: "aiml",
    } as UploadJobMetadata;

    const enriched = applySessionExamHints(academic, metadata);
    assert.equal(enriched.exam?.year, 2023);
    assert.equal(enriched.exam?.month, "November");

    const pyqs = buildProductionPyqs(enriched);
    assert.equal(pyqs.papers[0].year, 2023);
    assert.equal(pyqs.papers[0].month, "November");

    const report = runValidationEngine({
      pyqs,
      syllabus: null,
      jobDir: JOB_DIR,
      existingPaths: new Set([
        "diagrams/page-2/diagram-002.webp",
        "diagrams/page-3/diagram-003.webp",
      ]),
      pyqsPath: "production-pyqs.json",
      syllabusPath: null,
      contract: "incoming",
    });
    assert.equal(report.status, "PASS");
  });

  it("applies valid November admin session onto Gemini output", () => {
    const academic = readJson<AcademicDocument>(
      path.join(JOB_DIR, "academic-document.json")
    );
    const enriched = applySessionExamHints(academic, {
      year: 2023,
      examSession: "November",
      subjectCode: "AL-402",
      semester: "semester-4",
      branch: "aiml",
    } as UploadJobMetadata);
    assert.equal(enriched.exam?.year, 2023);
    assert.equal(enriched.exam?.month, "November");
  });

  it("marks Validation failed — not Merge — when validationStatus=failed", () => {
    const job = {
      id: "job_0756c2040aee4df09dba44e4a7c28e0b",
      type: "pyq",
      status: "queued",
      stage: PipelineStage.VALIDATED,
      branch: "aiml",
      semester: "semester-4",
      subjectCode: "AL-402",
      year: 1984,
      examSession: null,
      originalFilename:
        "al-cd-402-analysis-and-design-of-algorithm-nov-2023.pdf",
      mimeType: "application/pdf",
      fileSize: 1,
      temporaryPath: "",
      filename: "original.pdf",
      createdAt: "",
      updatedAt: "",
      error:
        "VALIDATION_FAILED (1): INVALID_YEAR at papers[0].year: Invalid paper year: 1984",
      validationStatus: "failed",
      ocr: { startedAt: "t", completedAt: "t", durationMs: 1 },
      layout: { startedAt: "t", completedAt: "t", durationMs: 1 },
      diagrams: { startedAt: "t", completedAt: "t", durationMs: 1 },
      structuring: { startedAt: "t", completedAt: "t", durationMs: 1 },
      schema: { startedAt: "t", completedAt: "t", durationMs: 1 },
      validation: {
        startedAt: "t",
        completedAt: "t",
        durationMs: 1,
        status: "FAILED",
        errorCount: 1,
        warningCount: 0,
      },
    } as ImportJobRecord;

    assert.equal(getImportSessionStatus(job), "Failed");
    const steps = getSessionStepStates(job);
    assert.equal(steps.schema, "done");
    assert.equal(steps.validation, "failed");
    assert.equal(steps.merge, "pending");
    assert.equal(steps.writer, "pending");
  });
});

describe("exam session / year contracts", () => {
  it("parses November from filename tokens", () => {
    assert.equal(
      parseExamSession(
        "al-cd-402-analysis-and-design-of-algorithm-nov-2023.pdf"
      ),
      "November"
    );
    assert.equal(parseExamSession("Examination, November 2023"), "November");
  });

  it("rejects years outside 2000–2099", () => {
    assert.equal(isValidExamYear(1984), false);
    assert.equal(isValidExamYear(1999), false);
    assert.equal(isValidExamYear(2023), true);
    assert.equal(isValidExamYear(2100), false);
  });
});
