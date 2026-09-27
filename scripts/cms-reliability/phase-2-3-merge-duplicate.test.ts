/**
 * Phase 2 — Duplicate detection
 * Phase 3 — Merge + normalize ordering
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sortProductionPyqs } from "../../lib/content-pipeline/content-sorter";
import { mergePyqs, papersMatch } from "../../lib/content-pipeline/pyq-merger";
import {
  fixtureDuplicate2023December,
  fixtureExisting2022_2023,
  fixtureIncoming2024_2025,
} from "./fixtures/pyqs-fixtures";

describe("Phase 2: Duplicate detection", () => {
  it("papersMatch identifies same year+month+exam", () => {
    const existing = fixtureExisting2022_2023().papers[1];
    const incoming = fixtureDuplicate2023December().papers[0];
    assert.equal(papersMatch(existing, incoming), true);
  });

  it("second import of same paper adds zero papers", () => {
    const existing = fixtureExisting2022_2023();
    const duplicate = fixtureDuplicate2023December();
    const first = mergePyqs(null, existing);
    const second = mergePyqs(first.pyqs, duplicate);

    assert.equal(second.stats.papersAdded, 0);
    assert.equal(second.pyqs.papers.length, existing.papers.length);

    const years = second.pyqs.papers.map((p) => p.year).sort();
    assert.deepEqual(years, [2022, 2023]);
  });

  it("does not duplicate question or attachment IDs on re-import", () => {
    const existing = fixtureIncoming2024_2025();
    const again = mergePyqs(existing, existing);

    assert.equal(again.stats.papersAdded, 0);
    assert.equal(again.stats.questionsAdded, 0);
    assert.equal(again.stats.attachmentsAdded, 0);

    const scopedIds = again.pyqs.papers.flatMap((paper) =>
      paper.questions.flatMap((q) => [
        `${paper.year}:${paper.month}:${q.id}`,
        ...q.subQuestions.flatMap((s) => [
          `${paper.year}:${paper.month}:${s.id}`,
          ...(s.attachments?.map(
            (a) => `${paper.year}:${paper.month}:${a.id}`
          ) ?? []),
        ]),
      ])
    );
    assert.equal(scopedIds.length, new Set(scopedIds).size);
  });
});

describe("Phase 3: Merge + normalize", () => {
  it("merges 2024/2025 into 2022/2023 without overwrite", () => {
    const existing = fixtureExisting2022_2023();
    const incoming = fixtureIncoming2024_2025();
    const merged = mergePyqs(existing, incoming);
    const sorted = sortProductionPyqs(merged.pyqs);

    assert.equal(merged.stats.papersAdded, 2);
    assert.equal(sorted.papers.length, 4);

    const keys = sorted.papers.map((p) => `${p.year}-${p.month}`);
    assert.deepEqual(keys, [
      "2022-June",
      "2023-December",
      "2024-June",
      "2025-December",
    ]);

    // Existing 2022 text preserved
    assert.match(
      sorted.papers[0].questions[0].subQuestions[0].text,
      /OSI model/
    );
  });

  it("normalize keeps stable year → session order", () => {
    const shuffled = mergePyqs(
      fixtureIncoming2024_2025(),
      fixtureExisting2022_2023()
    );
    const sorted = sortProductionPyqs(shuffled.pyqs);
    const years = sorted.papers.map((p) => p.year);
    assert.deepEqual(years, [2022, 2023, 2024, 2025]);
  });
});
