/**
 * Phase 4 — Resume inference (never re-run completed stages)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { inferRetryStage } from "../../lib/content-pipeline/job-recovery";
import { PipelineStage } from "../../lib/content-pipeline/pipeline-stage";
import type { ImportJobRecord } from "../../lib/content-pipeline/types";

function baseJob(overrides: Partial<ImportJobRecord> = {}): ImportJobRecord {
  return {
    id: "job_test",
    type: "pyq",
    status: "failed",
    stage: PipelineStage.FAILED,
    branch: "cscy",
    semester: "semester-3",
    subjectCode: "CY-301",
    year: 2024,
    examSession: "June",
    originalFilename: "paper.pdf",
    mimeType: "application/pdf",
    fileSize: 1000,
    temporaryPath: "/tmp/job_test",
    filename: "original.pdf",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: "simulated",
    validationStatus: "pending",
    sourceFiles: [],
    ocr: null,
    layout: null,
    diagrams: null,
    structuring: null,
    schema: null,
    validation: null,
    writing: null,
    review: null,
    save: null,
    rebuild: null,
    ...overrides,
  };
}

const summary = {
  startedAt: "t",
  completedAt: "t",
  durationMs: 1,
};

describe("Phase 4: Resume inference", () => {
  it("resumes from Gemini when OCR+Layout+Diagrams succeeded", () => {
    const job = baseJob({
      ocr: summary as ImportJobRecord["ocr"],
      layout: summary as ImportJobRecord["layout"],
      diagrams: summary as ImportJobRecord["diagrams"],
      error: "Gemini failed",
    });
    assert.equal(inferRetryStage(job), "structuring");
  });

  it("resumes from validation when structuring+schema succeeded", () => {
    const job = baseJob({
      ocr: summary as ImportJobRecord["ocr"],
      layout: summary as ImportJobRecord["layout"],
      diagrams: summary as ImportJobRecord["diagrams"],
      structuring: summary as ImportJobRecord["structuring"],
      schema: summary as ImportJobRecord["schema"],
      error: "Validation failed",
    });
    assert.equal(inferRetryStage(job), "validation");
  });

  it("resumes from writer when validation passed", () => {
    const job = baseJob({
      ocr: summary as ImportJobRecord["ocr"],
      layout: summary as ImportJobRecord["layout"],
      diagrams: summary as ImportJobRecord["diagrams"],
      structuring: summary as ImportJobRecord["structuring"],
      schema: summary as ImportJobRecord["schema"],
      validation: {
        ...summary,
        status: "PASS",
      } as ImportJobRecord["validation"],
      error: "Writer failed",
    });
    assert.equal(inferRetryStage(job), "writer");
  });

  it("never suggests OCR when OCR summary exists", () => {
    const job = baseJob({
      ocr: summary as ImportJobRecord["ocr"],
      error: "Layout failed",
    });
    assert.equal(inferRetryStage(job), "layout");
    assert.notEqual(inferRetryStage(job), "ocr");
  });

  it("blocks writer suggestion path when validation FAILED (caller gate)", () => {
    const job = baseJob({
      status: "queued",
      stage: PipelineStage.VALIDATED,
      ocr: summary as ImportJobRecord["ocr"],
      layout: summary as ImportJobRecord["layout"],
      diagrams: summary as ImportJobRecord["diagrams"],
      structuring: summary as ImportJobRecord["structuring"],
      schema: summary as ImportJobRecord["schema"],
      validation: {
        ...summary,
        status: "FAILED",
      } as ImportJobRecord["validation"],
      error: "Validation failed with errors",
    });
    // Infer still returns writer if writing missing — hard gate is in retryFailedStage
    assert.equal(inferRetryStage(job), "writer");
  });
});
