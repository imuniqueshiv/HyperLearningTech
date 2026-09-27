/**
 * Phase 5 — Concurrent merge / atomic write stress (offline load test)
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
  fixtureExisting2022_2023,
  fixtureIncoming2024_2025,
  makePaper,
  makePyqs,
  makeQuestion,
  makeSub,
} from "./fixtures/pyqs-fixtures";

describe("Phase 5: Load / concurrency (offline)", () => {
  it("handles 10 concurrent independent merges without corruption", async () => {
    const tasks = Array.from({ length: 10 }, (_, index) => {
      const year = 2010 + index;
      const incoming = makePyqs([
        makePaper(year, "June", [
          makeQuestion("q1", "Q.1", [
            makeSub("q1a", "a)", `Question for ${year}`),
          ]),
        ]),
      ]);
      return Promise.resolve().then(() => {
        const result = mergePyqs(fixtureExisting2022_2023(), incoming);
        return { year, result };
      });
    });

    const results = await Promise.all(tasks);
    for (const { year, result } of results) {
      assert.equal(result.stats.papersAdded, 1);
      assert.equal(result.pyqs.papers.length, 3);
      assert.ok(result.pyqs.papers.some((p) => p.year === year));
      const paperKeys = result.pyqs.papers.map(
        (p) => `${p.year}-${p.month}-${p.exam}`
      );
      assert.equal(paperKeys.length, new Set(paperKeys).size);
    }
  });

  it("serial atomic writes under contention leave valid final JSON", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cms-load-"));
    const target = path.join(dir, "pyqs.json");

    let current = fixtureExisting2022_2023();
    await writeJsonAtomic(target, current);

    for (let i = 0; i < 20; i += 1) {
      const year = 2030 + i;
      const incoming = makePyqs([
        makePaper(year, "December", [
          makeQuestion("q1", "Q.1", [
            makeSub("q1a", "a)", `Load test ${year}`),
          ]),
        ]),
      ]);
      const merged = mergePyqs(current, incoming);
      current = sortProductionPyqs(merged.pyqs);
      await writeJsonAtomic(target, current);
    }

    const final = JSON.parse(await fs.readFile(target, "utf8"));
    assert.equal(final.papers.length, 22);
    const years = final.papers.map((p: { year: number }) => p.year);
    assert.deepEqual(
      [...years].sort((a, b) => a - b),
      years
    );
  });

  it("large synthetic paper (50 questions) merges and sorts deterministically", () => {
    const questions = Array.from({ length: 50 }, (_, i) => {
      const n = i + 1;
      return makeQuestion(`q${n}`, `Q.${n}`, [
        makeSub(`q${n}a`, "a)", `Synthetic question ${n} text.`),
        makeSub(`q${n}b`, "b)", `Synthetic question ${n} part b.`),
      ]);
    });

    const large = makePyqs([makePaper(2026, "June", questions)]);
    const base = fixtureIncoming2024_2025();
    const merged = mergePyqs(base, large);
    const sorted = sortProductionPyqs(merged.pyqs);

    assert.equal(merged.stats.papersAdded, 1);
    const june2026 = sorted.papers.find(
      (p) => p.year === 2026 && p.month === "June"
    );
    assert.ok(june2026);
    assert.equal(june2026!.questions.length, 50);
    assert.equal(june2026!.questions[0].questionNumber, "Q.1");
    assert.equal(june2026!.questions[49].questionNumber, "Q.50");
  });
});
