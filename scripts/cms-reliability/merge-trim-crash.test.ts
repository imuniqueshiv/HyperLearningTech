/**
 * Regression for the production merge TypeError:
 * Cannot read properties of undefined (reading 'trim')
 *
 * Proven stack (job_ba81539e055f4a9c8ee4781ee6ec6237):
 *   preferExisting → mergeSubject → mergePyqs → mergeProductionContent
 * Field: existing repository subject.semester (absent on AL-402 pyqs.json)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { mergeAttachments } from "../../lib/content-pipeline/attachment-merger";
import {
  sortProductionPyqs,
  sortProductionSyllabus,
} from "../../lib/content-pipeline/content-sorter";
import { mergeProductionContent } from "../../lib/content-pipeline/merge-service";
import { mergePyqs, papersMatch } from "../../lib/content-pipeline/pyq-merger";
import type {
  ProductionPaper,
  ProductionPyqsJson,
} from "../../lib/content-pipeline/schema-types";
import {
  MergeMetadataError,
  preferNonEmptyString,
} from "../../lib/content-pipeline/string-normalize";
import { mergeSyllabus } from "../../lib/content-pipeline/syllabus-merger";
import { runValidationEngine } from "../../lib/content-pipeline/validation-engine";
import { validateForWrite } from "../../lib/content-pipeline/writer-validator";
import {
  fixtureExisting2022_2023,
  fixtureIncoming2024_2025,
  makePaper,
  makePyqs,
  makeQuestion,
  makeSub,
} from "./fixtures/pyqs-fixtures";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const AL402_PYQS = path.join(
  REPO_ROOT,
  "content/rgpv/aiml/semester-4/al-402/pyqs.json"
);
const AL402_SYLLABUS = path.join(
  REPO_ROOT,
  "content/rgpv/aiml/semester-4/al-402/syllabus.json"
);
const JOB_DIR = path.join(
  REPO_ROOT,
  ".cms/uploads/job_ba81539e055f4a9c8ee4781ee6ec6237"
);
const JOB_PYQS = path.join(JOB_DIR, "production-pyqs.json");
const JOB_SYLLABUS = path.join(JOB_DIR, "production-syllabus.json");

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

describe("AL-402 June 2023 trim crash (exact job artifacts)", () => {
  it("does not throw TypeError.trim when existing subject.semester is undefined", () => {
    const existing = readJson<ProductionPyqsJson>(AL402_PYQS);
    const incoming = readJson<ProductionPyqsJson>(JOB_PYQS);
    const incomingSnapshot = JSON.stringify(incoming);

    assert.equal(existing.subject.semester, undefined);
    assert.equal(incoming.papers[0]?.month, "June");
    assert.equal(incoming.papers[0]?.year, 2023);

    const result = mergePyqs(existing, incoming);

    assert.equal(incomingSnapshot, JSON.stringify(incoming));
    assert.doesNotThrow(() => sortProductionPyqs(result.pyqs));
    assert.ok(result.pyqs.papers.some((paper) => paper.questions.length > 0));
  });

  it("treats CMS exam label vs repo 'June 2023' as the same sitting", () => {
    const existing = readJson<ProductionPyqsJson>(AL402_PYQS);
    const incoming = readJson<ProductionPyqsJson>(JOB_PYQS);
    const existingJune2023 = existing.papers.find(
      (paper) => paper.year === 2023 && paper.month === "June"
    );
    assert.ok(existingJune2023);
    assert.equal(papersMatch(existingJune2023, incoming.papers[0]), true);

    const result = mergePyqs(existing, incoming);
    assert.equal(result.stats.papersAdded, 0);
    assert.equal(result.stats.questionsAdded, 0);
    assert.equal(existing.papers.length, result.pyqs.papers.length);
    // Repo q8 is a single blob (id "q8"); incoming split it into q8a–d.
    assert.equal(result.stats.subQuestionsAdded, 4);

    const again = mergePyqs(result.pyqs, incoming);
    assert.equal(again.stats.papersAdded, 0);
    assert.equal(again.stats.questionsAdded, 0);
    assert.equal(again.stats.subQuestionsAdded, 0);
  });

  it("merges real syllabus without converting string topics", () => {
    const existing = readJson<{
      subject: { semester?: string; university?: string };
      modules: Array<{ topics: unknown[] }>;
    }>(AL402_SYLLABUS);
    const incoming = readJson(JOB_SYLLABUS) as Parameters<
      typeof mergeSyllabus
    >[1];

    assert.equal(typeof existing.modules[0]?.topics[0], "string");
    assert.equal(existing.subject.university, undefined);

    const result = mergeSyllabus(existing as never, incoming);
    assert.equal(result.stats.modulesAdded, 0);
    assert.equal(result.stats.topicsAdded, 0);
    assert.equal(typeof result.syllabus.modules[0]?.topics[0], "string");
    assert.doesNotThrow(() => sortProductionSyllabus(result.syllabus as never));
  });

  it("write-path validation accepts merged repo + incoming artifacts", () => {
    const existingPyqs = readJson<ProductionPyqsJson>(AL402_PYQS);
    const incomingPyqs = readJson<ProductionPyqsJson>(JOB_PYQS);
    const existingSyllabus = readJson(AL402_SYLLABUS);
    const incomingSyllabus = readJson(JOB_SYLLABUS);

    const merged = mergeProductionContent({
      existingPyqs,
      incomingPyqs,
      existingSyllabus: existingSyllabus as never,
      incomingSyllabus: incomingSyllabus as never,
    });

    const report = validateForWrite({
      pyqs: sortProductionPyqs(merged.pyqs!),
      syllabus: sortProductionSyllabus(merged.syllabus as never),
      existingPaths: new Set(),
      pyqsPath: "pyqs.json",
      syllabusPath: "syllabus.json",
    });

    assert.equal(report.status, "PASS", JSON.stringify(report.errors, null, 2));
  });
});

describe("preferNonEmptyString contract", () => {
  const cases: Array<[unknown, unknown, string]> = [
    [undefined, "June", "June"],
    [null, "June", "June"],
    ["", "June", "June"],
    ["   ", "June", "June"],
    ["June", "December", "June"],
    ["  June  ", undefined, "June"],
    [undefined, undefined, ""],
    [undefined, "  ", ""],
  ];

  for (const [existing, incoming, expected] of cases) {
    it(`existing=${String(existing)} incoming=${String(incoming)} → ${JSON.stringify(expected)}`, () => {
      assert.equal(preferNonEmptyString(existing, incoming), expected);
    });
  }
});

describe("incoming paper identity is required", () => {
  function paperWith(overrides: Partial<ProductionPaper>): ProductionPyqsJson {
    return makePyqs([
      {
        ...makePaper(2023, "June", [
          makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "Text.")]),
        ]),
        ...overrides,
      },
    ]);
  }

  it("throws MERGE_METADATA_INVALID when incoming month is undefined", () => {
    const incoming = paperWith({ month: undefined as unknown as string });
    assert.throws(
      () => mergePyqs(fixtureExisting2022_2023(), incoming),
      (error: unknown) => {
        assert.ok(error instanceof MergeMetadataError);
        assert.equal(error.code, "MERGE_METADATA_INVALID");
        assert.match(error.message, /papers\[0\]\.month/);
        assert.match(error.message, /undefined/);
        return true;
      }
    );
  });

  it("throws MERGE_METADATA_INVALID when incoming exam is empty", () => {
    const incoming = paperWith({ exam: "   " });
    assert.throws(
      () => mergePyqs(null, incoming),
      (error: unknown) => {
        assert.ok(error instanceof MergeMetadataError);
        assert.match(error.message, /papers\[0\]\.exam/);
        return true;
      }
    );
  });

  it("incoming validation still requires unit; write validation does not", () => {
    const pyqs = makePyqs([
      makePaper(2023, "June", [
        makeQuestion("q1", "Q.1", [
          makeSub("q1a", "a)", "Text.", {
            unit: undefined as unknown as string,
          }),
        ]),
      ]),
    ]);

    const incoming = runValidationEngine({
      pyqs,
      syllabus: null,
      jobDir: "",
      existingPaths: new Set(),
      pyqsPath: "production-pyqs.json",
      syllabusPath: null,
      contract: "incoming",
    });
    assert.equal(incoming.status, "FAILED");
    assert.ok(incoming.errors.some((issue) => issue.code === "MISSING_UNIT"));

    const merged = runValidationEngine({
      pyqs,
      syllabus: null,
      jobDir: "",
      existingPaths: new Set(),
      pyqsPath: "pyqs.json",
      syllabusPath: null,
      contract: "repository",
    });
    assert.equal(merged.status, "PASS");
  });
});

describe("merge idempotency and paper-scoped IDs", () => {
  it("CASE A: re-import of the same paper adds nothing", () => {
    const existing = fixtureExisting2022_2023();
    const again = mergePyqs(existing, existing);
    assert.equal(again.stats.papersAdded, 0);
    assert.equal(again.stats.questionsAdded, 0);
    assert.deepEqual(again.pyqs, existing);
  });

  it("CASE B: a new sitting is appended", () => {
    const merged = mergePyqs(
      fixtureExisting2022_2023(),
      fixtureIncoming2024_2025()
    );
    assert.equal(merged.stats.papersAdded, 2);
    assert.ok(merged.stats.questionsAdded > 0);
  });

  it("CASE C: two papers may both use q1", () => {
    const existing = makePyqs([
      makePaper(2022, "June", [
        makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "Old.")]),
      ]),
    ]);
    const incoming = makePyqs([
      makePaper(2023, "June", [
        makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "New.")]),
      ]),
    ]);
    const merged = mergePyqs(existing, incoming);
    assert.equal(merged.stats.papersAdded, 1);
    const report = validateForWrite({
      pyqs: merged.pyqs,
      syllabus: null,
      existingPaths: new Set(),
      pyqsPath: "pyqs.json",
      syllabusPath: null,
    });
    assert.equal(report.status, "PASS");
    assert.equal(
      merged.pyqs.papers.filter((paper) => paper.questions[0]?.id === "q1")
        .length,
      2
    );
  });

  it("same year+month with different exam labels is one paper", () => {
    const existing = makePyqs([
      makePaper(2023, "June", [
        makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "Repo text.")]),
      ]),
    ]);
    existing.papers[0].exam = "June 2023";
    const incoming = makePyqs([
      makePaper(2023, "June", [
        makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "CMS text.")]),
      ]),
    ]);
    incoming.papers[0].exam = "B.Tech. Examination";

    const merged = mergePyqs(existing, incoming);
    assert.equal(merged.stats.papersAdded, 0);
    assert.equal(merged.pyqs.papers.length, 1);
    assert.equal(merged.pyqs.papers[0].exam, "June 2023");
    assert.equal(
      merged.pyqs.papers[0].questions[0].subQuestions[0].text,
      "Repo text."
    );
  });
});

describe("attachment merge does not trim undefined paths", () => {
  it("matches and merges when one path is missing", () => {
    const result = mergeAttachments(
      [
        {
          id: "a1",
          type: "image",
          path: undefined as unknown as string,
          title: "",
          alt: "",
          caption: "",
          aiContext: "",
        },
      ],
      [
        {
          id: "a1",
          type: "image",
          path: "diagrams/x.webp",
          title: "T",
          alt: "A",
          caption: "C",
          aiContext: "ctx",
        },
      ]
    );
    assert.equal(result.stats.attachmentsAdded, 0);
    assert.equal(result.attachments?.[0]?.path, "diagrams/x.webp");
  });
});
