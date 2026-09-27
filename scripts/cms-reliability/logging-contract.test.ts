/**
 * Stage logger contract — duration, recovery hint, merge/resume names
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import {
  logStageFailure,
  logStageStart,
  logStageSuccess,
} from "../../lib/content-pipeline/stage-logger";

const jobId = `job_log_${Date.now()}`;
let uploadsRoot: string;
let previousCwd: string;

describe("Logging contracts", () => {
  before(async () => {
    previousCwd = process.cwd();
    uploadsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cms-logs-"));
    // stage-logger resolves .cms/uploads from process.cwd()
    process.chdir(uploadsRoot);
    await fs.mkdir(path.join(uploadsRoot, ".cms", "uploads", jobId), {
      recursive: true,
    });
  });

  after(async () => {
    process.chdir(previousCwd);
  });

  it("writes SUCCESS block with DurationMs and RecoveryHint", async () => {
    const startedAt = await logStageStart({
      jobId,
      stage: "ocr",
      details: { pageCount: 2 },
    });
    await logStageSuccess({
      jobId,
      stage: "ocr",
      startedAt,
      details: { pageCount: 2 },
    });

    const logPath = path.join(
      uploadsRoot,
      ".cms",
      "uploads",
      jobId,
      "logs",
      "ocr.log"
    );
    const text = await fs.readFile(logPath, "utf8");
    assert.match(text, /DurationMs:/);
    assert.match(text, /Result: SUCCESS/);
    assert.match(text, /RecoveryHint:/);
    assert.match(text, /Job ID: /);
  });

  it("writes FAILURE block with stack and resume hint", async () => {
    const startedAt = await logStageStart({ jobId, stage: "structuring" });
    await logStageFailure({
      jobId,
      stage: "structuring",
      startedAt,
      error: new Error("Gemini timeout"),
    });

    const logPath = path.join(
      uploadsRoot,
      ".cms",
      "uploads",
      jobId,
      "logs",
      "structuring.log"
    );
    const text = await fs.readFile(logPath, "utf8");
    assert.match(text, /Result: FAILURE/);
    assert.match(text, /Gemini timeout/);
    assert.match(text, /Resume from stage "structuring"/);
  });

  it("supports merge and resume log names", async () => {
    const mergeStart = await logStageStart({ jobId, stage: "merge" });
    await logStageSuccess({
      jobId,
      stage: "merge",
      startedAt: mergeStart,
    });
    const resumeStart = await logStageStart({ jobId, stage: "resume" });
    await logStageSuccess({
      jobId,
      stage: "resume",
      startedAt: resumeStart,
    });

    await fs.access(
      path.join(uploadsRoot, ".cms", "uploads", jobId, "logs", "merge.log")
    );
    await fs.access(
      path.join(uploadsRoot, ".cms", "uploads", jobId, "logs", "resume.log")
    );
  });
});
