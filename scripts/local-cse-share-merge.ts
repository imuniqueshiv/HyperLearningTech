/**
 * Local-only merge of verified shared-subject PYQs into CSE.
 * Does not call any hosted AI or project APIs.
 *
 * Currently: ES-301 from CSIT → CSE (identical subject code / common paper series).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mergePyqs, papersMatch } from "../lib/content-pipeline/pyq-merger.js";
import { runValidationRules } from "../lib/content-pipeline/validation-rules.js";
import { validateJsonShapes } from "../lib/content-pipeline/json-validator.js";
import type { ProductionPyqsJson } from "../lib/content-pipeline/schema-types.js";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function readPyqs(rel: string): ProductionPyqsJson {
  const abs = path.join(REPO_ROOT, rel);
  return JSON.parse(fs.readFileSync(abs, "utf8")) as ProductionPyqsJson;
}

function writeAtomic(rel: string, data: ProductionPyqsJson): void {
  const abs = path.join(REPO_ROOT, rel);
  const tmp = `${abs}.tmp.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, abs);
}

function main() {
  const sourceRel = "content/rgpv/csit/semester-3/es-301/pyqs.json";
  const destRel = "content/rgpv/cse/semester-3/es-301/pyqs.json";
  const syllabusRel = "content/rgpv/cse/semester-3/es-301/syllabus.json";

  const source = readPyqs(sourceRel);
  const dest = readPyqs(destRel);
  const syllabus = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, syllabusRel), "utf8")
  );

  if ((source.subject?.code || "").toUpperCase() !== "ES-301") {
    throw new Error(`Unexpected source subject code: ${source.subject?.code}`);
  }

  const subject = {
    ...dest.subject,
    id: dest.subject?.id || "es-301-cse",
    code: "ES-301",
    name: dest.subject?.name || source.subject.name,
    title: dest.subject?.title || source.subject.title,
    semester: dest.subject?.semester || source.subject.semester || "III",
    gradingSystem:
      dest.subject?.gradingSystem ||
      source.subject.gradingSystem ||
      "Grading System (GS)",
    maxMarks: dest.subject?.maxMarks || source.subject.maxMarks || 70,
    time: dest.subject?.time || source.subject.time || "3 Hours",
    commonInstructions: dest.subject?.commonInstructions ||
      source.subject.commonInstructions || [
        "Attempt any five questions.",
        "All questions carry equal marks.",
      ],
  };

  const incoming: ProductionPyqsJson = {
    subject,
    papers: source.papers.map((paper) => {
      const clone = structuredClone(paper);
      clone.questions = (clone.questions || []).map((question, qIdx) => {
        const qNum = qIdx + 1;
        if (
          Array.isArray(question.subQuestions) &&
          question.subQuestions.length > 0
        ) {
          return question;
        }
        // Legacy flat question shape → single sub-question (no content invented).
        const flatText =
          typeof (question as { text?: string }).text === "string"
            ? (question as { text?: string }).text!.trim()
            : "";
        if (!flatText) {
          throw new Error(
            `Cannot normalize ${paper.exam} question ${question.id || qNum}: missing text/subQuestions`
          );
        }
        const unitFromQuestion = (question as { unit?: string }).unit;
        const unit: string =
          typeof unitFromQuestion === "string"
            ? unitFromQuestion
            : `Unit ${Math.min(5, qNum)}`;
        return {
          id: question.id || `q${qNum}`,
          questionNumber: question.questionNumber || `Q.${qNum}`,
          subQuestions: [
            {
              id: `${question.id || `q${qNum}`}a`,
              label: "a)",
              text: flatText,
              unit,
            },
          ],
        };
      });
      return clone;
    }),
  };

  // Only add papers not already present
  const already = new Set(
    (dest.papers || []).map((p) => `${p.month}|${p.year}`)
  );
  incoming.papers = incoming.papers.filter(
    (p) => !already.has(`${p.month}|${p.year}`)
  );

  if (incoming.papers.length === 0) {
    console.log("No new ES-301 papers to add.");
    return;
  }

  let issue = 0;
  const shape = validateJsonShapes({
    pyqs: incoming,
    syllabus,
    nextIndex: () => ++issue,
  });
  const rules = runValidationRules({
    pyqs: incoming,
    syllabus,
    jobDir: path.join(REPO_ROOT, "content/rgpv/cse/semester-3/es-301"),
    existingPaths: new Set(),
    nextIndex: () => ++issue,
    contract: "repository",
  });
  const errors = [...shape.errors, ...rules.errors];
  if (errors.length) {
    console.error("Incoming validation failed:", errors[0]);
    process.exit(1);
  }

  const beforeCount = dest.papers.length;
  const merged = mergePyqs(
    { ...dest, subject, papers: dest.papers || [] },
    incoming
  );

  // Guard: never drop existing papers
  for (const paper of dest.papers || []) {
    const stillThere = merged.pyqs.papers.some((p) => papersMatch(p, paper));
    if (!stillThere) {
      throw new Error(
        `Safety abort: existing paper missing after merge (${paper.exam})`
      );
    }
  }

  writeAtomic(destRel, merged.pyqs);
  console.log(
    `ES-301 CSE: papers ${beforeCount} -> ${merged.pyqs.papers.length} (added ${merged.stats.papersAdded})`
  );
  console.log("Exams:", merged.pyqs.papers.map((p) => p.exam).join(", "));
}

main();
