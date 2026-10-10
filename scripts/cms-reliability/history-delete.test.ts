/**
 * History delete safety tests — jobId-only deletion, content preservation,
 * running-job block, path traversal rejection.
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, describe, it } from "node:test";

import {
  assertValidCmsJobId,
  deleteImportHistory,
  deleteImportHistoryBulk,
  HistoryDeleteError,
} from "../../lib/content-pipeline/history-delete-service";
import {
  writeHistoryIndex,
  writeHistoryRecord,
} from "../../lib/content-pipeline/history-storage";
import { writeJobMetadata } from "../../lib/content-pipeline/job-manager";
import { PipelineStage } from "../../lib/content-pipeline/pipeline-stage";
import { getJobDirectory } from "../../lib/content-pipeline/temp-storage";
import type { ImportHistoryRecord } from "../../lib/content-pipeline/history-types";
import type { UploadJobMetadata } from "../../lib/content-pipeline/types";
import { writeJsonAtomic } from "../../lib/content-pipeline/json-writer";

const HEX = "a1b2c3d4e5f6789012345678abcdef";
const FAILED_ID = `job_${HEX}01`;
const SAVED_ID = `job_${HEX}02`;
const RUNNING_ID = `job_${HEX}03`;
const ORPHAN_ID = `job_${HEX}04`;
const BULK_A = `job_${HEX}05`;
const BULK_B = `job_${HEX}06`;

const createdJobIds = [
  FAILED_ID,
  SAVED_ID,
  RUNNING_ID,
  ORPHAN_ID,
  BULK_A,
  BULK_B,
];

const QUEUE_PATH = path.join(process.cwd(), ".cms", "queue", "queue.json");
const CONTENT_SENTINEL = path.join(
  process.cwd(),
  "content",
  ".cms-history-delete-test-sentinel.json"
);

function meta(
  jobId: string,
  status: UploadJobMetadata["status"],
  stage: PipelineStage
): UploadJobMetadata {
  const dir = getJobDirectory(jobId);
  return {
    jobId,
    type: "pyq",
    filename: "original.pdf",
    originalFilename: "AL-405-test.pdf",
    mimeType: "application/pdf",
    fileSize: 1200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status,
    stage,
    validationStatus: "pending",
    branch: "csit",
    semester: "semester-4",
    subjectCode: "AL-405",
    year: 2026,
    examSession: "June",
    error: status === "failed" ? "validation failed" : null,
    temporaryPath: dir,
    originalFilePath: path.join(dir, "original.pdf"),
    sourceFiles: [],
  };
}

function history(
  jobId: string,
  status: ImportHistoryRecord["status"]
): ImportHistoryRecord {
  const now = new Date().toISOString();
  return {
    jobId,
    importDate: now.slice(0, 10),
    startedAt: now,
    completedAt: now,
    durationMs: 1000,
    uploadedFile: "AL-405-test.pdf",
    operator: "local-admin",
    pipelineType: "local-cms",
    branch: "csit",
    semester: "semester-4",
    subject: "AL-405",
    jobType: "pyq",
    status,
    stage:
      status === "completed"
        ? PipelineStage.LOCAL_SAVED
        : status === "failed"
          ? PipelineStage.FAILED
          : PipelineStage.OCR_PROCESSING,
    stagesCompleted: [],
    questionsImported: 0,
    topicsImported: 0,
    diagramsImported: 0,
    filesModified: [],
    warnings: 0,
    errors: status === "failed" ? 1 : 0,
    validationResult: "unknown",
    writerResult: "none",
    reviewResult: null,
    saveResult: status === "completed" ? "SUCCESS" : "none",
    progressPercent: 0,
    lastFailure: null,
    updatedAt: now,
  };
}

async function readQueue(): Promise<Array<{ jobId: string; status: string }>> {
  try {
    const raw = await fs.readFile(QUEUE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Array<{ jobId: string; status: string }>;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(
  entries: Array<{ jobId: string; status: string }>
): Promise<void> {
  await fs.mkdir(path.dirname(QUEUE_PATH), { recursive: true });
  await writeJsonAtomic(QUEUE_PATH, entries);
}

async function seedJob(
  jobId: string,
  status: UploadJobMetadata["status"],
  stage: PipelineStage,
  queueStatus: string
): Promise<void> {
  await cleanupJob(jobId);
  const dir = getJobDirectory(jobId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "artifact.txt"), "temp", "utf8");
  await writeJobMetadata(meta(jobId, status, stage));
  await writeHistoryRecord(
    history(
      jobId,
      status === "completed"
        ? "completed"
        : status === "failed"
          ? "failed"
          : status === "cancelled"
            ? "cancelled"
            : "processing"
    )
  );
  const queue = await readQueue();
  await writeQueue([
    ...queue.filter((e) => e.jobId !== jobId),
    { jobId, status: queueStatus },
  ]);
}

async function cleanupJob(jobId: string): Promise<void> {
  try {
    await fs.rm(getJobDirectory(jobId), { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  try {
    await fs.unlink(
      path.join(process.cwd(), ".cms", "history", `${jobId}.json`)
    );
  } catch {
    /* ignore */
  }
  const queue = await readQueue();
  await writeQueue(queue.filter((e) => e.jobId !== jobId));
  try {
    const indexPath = path.join(process.cwd(), ".cms", "history", "index.json");
    const raw = await fs.readFile(indexPath, "utf8");
    const index = JSON.parse(raw) as string[];
    await writeHistoryIndex(index.filter((id) => id !== jobId));
  } catch {
    /* ignore */
  }
}

after(async () => {
  for (const id of createdJobIds) {
    await cleanupJob(id);
  }
  try {
    await fs.unlink(CONTENT_SENTINEL);
  } catch {
    /* ignore */
  }
});

describe("assertValidCmsJobId", () => {
  it("accepts canonical job ids", () => {
    assert.equal(assertValidCmsJobId(FAILED_ID), FAILED_ID);
  });

  it("rejects path traversal and arbitrary paths", () => {
    const bad = [
      "../../content/rgpv",
      "job_../etc/passwd",
      "job_a1b2c3d4e5f6789012345678abcdef01/../x",
      "content/rgpv/csit/pyqs.json",
      "",
      "job_short",
      "job_a1b2c3d4e5f6789012345678abcdef0", // 31 hex
    ];
    for (const id of bad) {
      assert.throws(
        () => assertValidCmsJobId(id),
        (error: unknown) =>
          error instanceof HistoryDeleteError && error.code === "JOB_ID_INVALID"
      );
    }
  });
});

describe("deleteImportHistory", () => {
  it("deletes failed job history and workspace, never content/", async () => {
    await seedJob(FAILED_ID, "failed", PipelineStage.FAILED, "failed");
    await fs.mkdir(path.dirname(CONTENT_SENTINEL), { recursive: true });
    await fs.writeFile(
      CONTENT_SENTINEL,
      JSON.stringify({ keep: true }),
      "utf8"
    );

    const result = await deleteImportHistory(FAILED_ID);
    assert.equal(result.contentPreserved, true);
    assert.ok(result.deleted.length > 0);

    await assert.rejects(() => fs.access(getJobDirectory(FAILED_ID)));
    const sentinel = await fs.readFile(CONTENT_SENTINEL, "utf8");
    assert.ok(sentinel.includes("keep"));
  });

  it("deletes LOCAL_SAVED history but preserves authoritative content", async () => {
    await seedJob(
      SAVED_ID,
      "completed",
      PipelineStage.LOCAL_SAVED,
      "completed"
    );
    await fs.mkdir(path.dirname(CONTENT_SENTINEL), { recursive: true });
    await fs.writeFile(
      CONTENT_SENTINEL,
      JSON.stringify({ paper: "AL-405", keep: true }),
      "utf8"
    );

    const result = await deleteImportHistory(SAVED_ID);
    assert.equal(result.wasSaved, true);
    assert.equal(result.contentPreserved, true);
    assert.match(result.message, /untouched/i);

    const sentinel = JSON.parse(
      await fs.readFile(CONTENT_SENTINEL, "utf8")
    ) as { keep: boolean };
    assert.equal(sentinel.keep, true);
    await assert.rejects(() => fs.access(getJobDirectory(SAVED_ID)));
  });

  it("blocks deletion of running imports", async () => {
    await seedJob(
      RUNNING_ID,
      "processing",
      PipelineStage.OCR_PROCESSING,
      "processing"
    );

    await assert.rejects(
      () => deleteImportHistory(RUNNING_ID),
      (error: unknown) =>
        error instanceof HistoryDeleteError &&
        error.code === "DELETE_BLOCKED_RUNNING"
    );

    // Workspace must still exist
    await fs.access(getJobDirectory(RUNNING_ID));
    await cleanupJob(RUNNING_ID);
  });

  it("rejects missing job when no orphan artifacts remain", async () => {
    const missing = `job_${HEX}99`;
    await assert.rejects(
      () => deleteImportHistory(missing),
      (error: unknown) =>
        error instanceof HistoryDeleteError && error.code === "JOB_NOT_FOUND"
    );
  });

  it("cleans orphan workspace without queue metadata", async () => {
    const dir = getJobDirectory(ORPHAN_ID);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "orphan.txt"), "x", "utf8");

    const result = await deleteImportHistory(ORPHAN_ID);
    assert.equal(result.contentPreserved, true);
    await assert.rejects(() => fs.access(dir));
  });

  it("bulk deletes with per-job results", async () => {
    await seedJob(BULK_A, "failed", PipelineStage.FAILED, "failed");
    await seedJob(BULK_B, "cancelled", PipelineStage.CANCELLED, "cancelled");

    const bulk = await deleteImportHistoryBulk([BULK_A, BULK_B, "not-a-job"]);
    assert.equal(bulk.results.length, 2);
    assert.ok(bulk.errors.length >= 1);
    assert.equal(
      bulk.results.every((r) => r.contentPreserved),
      true
    );
  });
});
