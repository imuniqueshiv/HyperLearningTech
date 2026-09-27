import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyHighConfidenceMetadata,
  extractMetadata,
  extractSubjectCodes,
  normalizeBranch,
  normalizeSemester,
  normalizeSubjectCode,
  parseExamSession,
  parseYear,
} from "../../lib/content-pipeline/metadata-extractor";

const catalog = [
  {
    branch: "aiml",
    semester: "semester-4",
    subjectCode: "AL-402",
  },
  {
    branch: "cse",
    semester: "semester-4",
    subjectCode: "CS-403",
  },
];

describe("metadata extraction and normalization", () => {
  it("parses AL/CD-402 style codes without inventing a single branch", () => {
    const codes = extractSubjectCodes(
      "al-cd-402-analysis-and-design-of-algorithm-jun-2022.pdf"
    );
    assert.ok(codes.includes("AL-402"));
    assert.ok(codes.includes("CD-402"));

    const extracted = extractMetadata({
      filename: "al-cd-402-analysis-and-design-of-algorithm-jun-2022.pdf",
      ocrText:
        "B.Tech. IV Semester Examination, June 2022\nAL/CD-402 (GS) Analysis and Design of Algorithm",
      catalog,
    });

    assert.equal(extracted.subjectCode.value, "AL-402");
    assert.equal(extracted.subjectCode.needsConfirmation, true);
    assert.equal(extracted.year.value, 2022);
    assert.equal(extracted.examSession.value, "June");
    assert.equal(extracted.semester.value, "semester-4");
    assert.equal(extracted.branch.value, "aiml");
    assert.equal(extracted.branch.needsConfirmation, true);
  });

  it("auto-fills high-confidence unique catalog matches", () => {
    const extracted = extractMetadata({
      filename: "cs-403-jun-2024.pdf",
      catalog,
    });
    assert.equal(extracted.subjectCode.value, "CS-403");
    assert.equal(extracted.branch.value, "cse");
    assert.equal(extracted.branch.needsConfirmation, false);
    assert.equal(extracted.year.value, 2024);
    assert.equal(extracted.examSession.value, "June");
  });

  it("never overwrites administrator overrides", () => {
    const extracted = extractMetadata({
      filename: "cs-403-jun-2024.pdf",
      catalog,
      overrides: { branch: "aiml", subjectCode: "AL-402" },
    });
    assert.equal(extracted.branch.value, "aiml");
    assert.equal(extracted.branch.source, "admin");
    assert.equal(extracted.subjectCode.value, "AL-402");
  });

  it("normalizes semester and branch aliases", () => {
    assert.equal(normalizeSemester("IV"), "semester-4");
    assert.equal(normalizeSemester("4th Semester"), "semester-4");
    assert.equal(normalizeSemester("Semester IV"), "semester-4");
    assert.equal(
      normalizeBranch("Artificial Intelligence and Machine Learning"),
      "aiml"
    );
    assert.equal(normalizeSubjectCode("AL402"), "AL-402");
    assert.equal(parseYear("June 2022 Examination"), 2022);
    assert.equal(parseExamSession("End Sem June 2022"), "June");
    assert.equal(parseExamSession("nov-2023"), "November");
    assert.equal(parseExamSession("December 2024"), "December");
  });

  it("does not invent metadata when there is no evidence", () => {
    const extracted = extractMetadata({ filename: "scan.png", catalog: [] });
    assert.equal(extracted.branch.value, null);
    assert.equal(extracted.subjectCode.value, null);
    assert.equal(extracted.year.value, null);
    assert.equal(extracted.examSession.value, null);
  });

  it("applies medium+ confidence into empty job fields only", () => {
    const extracted = extractMetadata({
      filename: "cs-403-jun-2024.pdf",
      catalog,
    });
    const applied = applyHighConfidenceMetadata(
      {
        branch: null,
        semester: null,
        subjectCode: "KEEP-ME",
        year: null,
        examSession: null,
      },
      extracted,
      { subjectCode: true }
    );
    assert.equal(applied.subjectCode, "KEEP-ME");
    assert.equal(applied.branch, "cse");
    assert.equal(applied.year, 2024);
  });
});
