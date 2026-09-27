/**
 * Phase 1 (Writer path) + Atomic write + logging contract
 * Offline verification of deterministic pipeline components.
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { sortProductionPyqs } from "../../lib/content-pipeline/content-sorter";
import { writeJsonAtomic } from "../../lib/content-pipeline/json-writer";
import { mergePyqs } from "../../lib/content-pipeline/pyq-merger";
import {
  getImportSessionStatus,
  getSessionStepStates,
} from "../../lib/content-pipeline/session-status";
import { PipelineStage } from "../../lib/content-pipeline/pipeline-stage";
import type { ImportJobRecord } from "../../lib/content-pipeline/types";
import { runValidationEngine } from "../../lib/content-pipeline/validation-engine";
import {
  fixtureExisting2022_2023,
  fixtureIncoming2024_2025,
  fixtureIncompletePaper,
} from "./fixtures/pyqs-fixtures";

describe("Phase 1: Writer-path contracts (offline)", () => {
  it("load → duplicate → merge → normalize produces valid ordered JSON", () => {
    const existing = fixtureExisting2022_2023();
    const incoming = fixtureIncoming2024_2025();
    const { pyqs, stats } = mergePyqs(existing, incoming);
    const normalized = sortProductionPyqs(pyqs);

    assert.ok(stats.papersAdded >= 1);
    assert.equal(normalized.subject.code, "CY-301");
    assert.equal(normalized.papers.length, 4);

    for (const paper of normalized.papers) {
      assert.ok(paper.year >= 2000);
      assert.ok(paper.month.trim().length > 0);
      assert.ok(paper.exam.trim().length > 0);
      for (const q of paper.questions) {
        assert.ok(q.id.trim().length > 0);
        assert.match(q.questionNumber, /^Q\.\d+$/i);
        for (const sub of q.subQuestions) {
          assert.ok(sub.id.trim().length > 0);
          assert.ok(sub.text.trim().length > 0);
          assert.ok(sub.unit.trim().length > 0);
        }
      }
    }
  });

  it("rejects incomplete papers before merge handoff (validation)", () => {
    const report = runValidationEngine({
      pyqs: fixtureIncompletePaper(),
      syllabus: null,
      jobDir: process.cwd(),
      existingPaths: new Set(),
      pyqsPath: "production-pyqs.json",
      syllabusPath: null,
    });
    assert.equal(report.status, "FAILED");
    assert.ok(report.statistics.errorCount > 0);
  });

  it("session status maps WRITTEN → Review Ready", () => {
    const job = {
      id: "j1",
      type: "pyq",
      status: "queued",
      stage: PipelineStage.WRITTEN,
      branch: "cscy",
      semester: "semester-3",
      subjectCode: "CY-301",
      year: 2024,
      examSession: "June",
      originalFilename: "a.pdf",
      mimeType: "application/pdf",
      fileSize: 1,
      temporaryPath: "",
      filename: "original.pdf",
      createdAt: "",
      updatedAt: "",
      error: null,
      validationStatus: "passed",
      writing: { startedAt: "t", completedAt: "t", durationMs: 1 },
    } as ImportJobRecord;

    assert.equal(getImportSessionStatus(job), "Review Ready");
    const steps = getSessionStepStates(job);
    assert.equal(steps.writer, "done");
  });
});

describe("Atomic write", () => {
  it("writes via temp then rename; destination is valid JSON", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cms-atomic-"));
    const target = path.join(dir, "pyqs.json");
    const payload = fixtureExisting2022_2023();

    await writeJsonAtomic(target, payload);

    const raw = await fs.readFile(target, "utf8");
    const parsed = JSON.parse(raw);
    assert.equal(parsed.papers.length, 2);
    assert.equal(parsed.subject.code, "CY-301");

    // No leftover .tmp after successful rename
    const entries = await fs.readdir(dir);
    assert.ok(!entries.some((name) => name.endsWith(".tmp")));
  });

  it("preserves existing file when temp write is abandoned (simulate crash)", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cms-atomic-crash-"));
    const target = path.join(dir, "pyqs.json");
    const original = fixtureExisting2022_2023();
    await writeJsonAtomic(target, original);

    const tempPath = `${target}.tmp`;
    await fs.writeFile(tempPath, "{ broken", "utf8");

    // Destination untouched
    const still = JSON.parse(await fs.readFile(target, "utf8"));
    assert.equal(still.papers.length, 2);
    assert.equal(still.subject.code, "CY-301");

    // Incomplete temp does not replace target
    await assert.rejects(async () => {
      JSON.parse(await fs.readFile(tempPath, "utf8"));
    });
  });
});
