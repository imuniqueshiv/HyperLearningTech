import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { getPYQs } from "../../lib/content";
import {
  paperMatchesSlug,
  toPaperSlug,
  toPaperSlugFromParam,
} from "../../lib/content/paper-slug";
import { validateJsonShapes } from "../../lib/content-pipeline/json-validator";
import { runValidationRules } from "../../lib/content-pipeline/validation-rules";
import { subjects } from "../../lib/data/subjects";

const SEM5_SUBJECTS = [
  "al-501",
  "al-502",
  "al-503-a",
  "al-503-b",
  "al-504-a",
  "al-504-b",
] as const;

test("paper slug helper normalizes abbreviations and case", () => {
  assert.equal(toPaperSlug("June", 2025), "june-2025");
  assert.equal(toPaperSlugFromParam("jun-2025"), "june-2025");
  assert.equal(toPaperSlugFromParam("June-2025"), "june-2025");
  assert.equal(toPaperSlugFromParam("nov-2023"), "november-2023");
  assert.equal(toPaperSlugFromParam("dec-2024"), "december-2024");
  assert.equal(
    paperMatchesSlug({ month: "November", year: 2022 }, "nov-2022"),
    true
  );
  assert.equal(
    paperMatchesSlug({ month: "June", year: 2025 }, "july-2025"),
    false
  );
});

test("AIML semester-5 catalogue contentSlug values match content directories", () => {
  for (const slug of SEM5_SUBJECTS) {
    const entry = subjects.find(
      (subject) =>
        subject.branchId === "aiml" &&
        subject.semesterId === "semester-5" &&
        (subject.contentSlug ?? subject.slug) === slug
    );
    assert.ok(entry, `missing catalogue entry for ${slug}`);
    const dir = path.join(
      process.cwd(),
      "content",
      "rgpv",
      "aiml",
      "semester-5",
      slug,
      "pyqs.json"
    );
    assert.ok(fs.existsSync(dir), `missing pyqs.json for ${slug}`);
  }
});

test("getPYQs loads every AIML semester-5 subject and resolves paper slugs", async () => {
  for (const slug of SEM5_SUBJECTS) {
    const pyqs = await getPYQs("aiml", "semester-5", slug);
    assert.ok(pyqs, `getPYQs returned null for ${slug}`);
    assert.ok(Array.isArray(pyqs.papers) && pyqs.papers.length > 0);

    let issueIndex = 0;
    const nextIndex = () => ++issueIndex;
    const shape = validateJsonShapes({
      pyqs,
      syllabus: null,
      nextIndex,
    });
    issueIndex = 0;
    const rules = runValidationRules({
      pyqs,
      syllabus: null,
      nextIndex,
      contract: "repository",
      jobDir: path.join(
        process.cwd(),
        "content",
        "rgpv",
        "aiml",
        "semester-5",
        slug
      ),
      existingPaths: new Set(),
    });
    assert.equal(shape.errors.length, 0, `${slug} shape errors`);
    assert.equal(rules.errors.length, 0, `${slug} rule errors`);

    const seen = new Set<string>();
    for (const paper of pyqs.papers) {
      const canonical = toPaperSlug(paper.month, paper.year);
      assert.ok(!seen.has(canonical), `duplicate session ${slug} ${canonical}`);
      seen.add(canonical);

      assert.ok(
        paperMatchesSlug(paper, canonical),
        `${slug} canonical slug mismatch`
      );
      const abbreviated = canonical
        .replace("june-", "jun-")
        .replace("november-", "nov-")
        .replace("december-", "dec-");
      assert.ok(
        paperMatchesSlug(paper, abbreviated),
        `${slug} abbreviated slug should resolve: ${abbreviated}`
      );

      for (const question of paper.questions) {
        assert.match(
          question.questionNumber,
          /^Q\.\d+$/,
          `${slug} ${paper.exam} bad questionNumber ${question.questionNumber}`
        );
      }
    }

    assert.equal(
      paperMatchesSlug(pyqs.papers[0], "not-a-real-session-1999"),
      false
    );
  }
});
