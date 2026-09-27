/**
 * Offline checks for pipeline supervisor resume/timeout contracts.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PipelineStage } from "../../lib/content-pipeline/pipeline-stage";
import { inferResumeStage } from "../../lib/content-pipeline/pipeline-supervisor";
import {
  STAGE_TIMEOUT_MS,
  StageTimeoutError,
} from "../../lib/content-pipeline/stage-runtime";
import { getImportSessionStatus } from "../../lib/content-pipeline/session-status";
import type { ImportJobRecord } from "../../lib/content-pipeline/types";

function baseJob(overrides: Partial<ImportJobRecord> = {}): ImportJobRecord {
  return {
    id: "job_test",
    type: "pyq",
    status: "processing",
    stage: PipelineStage.STRUCTURING,
    filename: "t.pdf",
    originalFilename: "t.pdf",
    mimeType: "application/pdf",
    fileSize: 1,
    temporaryPath: ".cms/uploads/job_test",
    originalFilePath: null,
    branch: "common",
    semester: "semester-1",
    subjectCode: "BT-201",
    year: 2026,
    examSession: "June",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: null,
    ocr: {
      startedAt: "",
      completedAt: "",
      durationMs: 1,
      pageCount: 1,
      imageCount: 0,
      tableCount: 0,
      textBlockCount: 1,
      engine: "local",
      rawDocumentPath: "raw-document.json",
    },
    layout: {
      startedAt: "",
      completedAt: "",
      durationMs: 1,
      pageCount: 1,
      sectionCount: 0,
      questionCount: 0,
      subQuestionCount: 0,
      figureCount: 0,
      tableCount: 0,
      captionCount: 0,
      detector: "local",
      structuredDocumentPath: "structured-document.json",
    },
    diagrams: {
      startedAt: "",
      completedAt: "",
      durationMs: 1,
      diagramCount: 0,
      totalBytes: 0,
      diagramsDir: "diagrams",
      diagrams: [],
    },
    structuring: null,
    schema: null,
    validation: null,
    writing: null,
    review: null,
    save: null,
    rebuild: null,
    ...overrides,
  } as ImportJobRecord;
}

describe("pipeline supervisor contracts", () => {
  it("infers resume at structuring when diagrams done", () => {
    const job = baseJob();
    assert.equal(inferResumeStage(job), "structuring");
  });

  it("infers resume at validation when schema summary exists", () => {
    const job = baseJob({
      stage: PipelineStage.SCHEMA_READY,
      structuring: {
        questionCount: 1,
      } as unknown as ImportJobRecord["structuring"],
      schema: { paperCount: 1 } as unknown as ImportJobRecord["schema"],
    });
    assert.equal(inferResumeStage(job), "validation");
  });

  it("maps TIMEOUT to Failed session status", () => {
    const job = baseJob({
      stage: PipelineStage.TIMEOUT,
      status: "failed",
      error: "Stage timed out",
    });
    assert.equal(getImportSessionStatus(job), "Failed");
  });

  it("maps CANCELLED to Failed session status", () => {
    const job = baseJob({
      stage: PipelineStage.CANCELLED,
      status: "failed",
      error: "Cancelled",
    });
    assert.equal(getImportSessionStatus(job), "Failed");
  });

  it("exposes stage timeouts", () => {
    assert.ok(STAGE_TIMEOUT_MS.structuring >= 60_000);
    assert.ok(STAGE_TIMEOUT_MS.reconstruction >= 60_000);
    const err = new StageTimeoutError("structuring", 1000);
    assert.equal(err.code, "STAGE_TIMEOUT");
  });
});
