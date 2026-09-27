/**
 * Shared fixtures for CMS reliability verification.
 * Deterministic, offline — no OCR/Gemini.
 */

import type {
  ProductionPaper,
  ProductionPyqsJson,
  ProductionQuestion,
  ProductionSubQuestion,
} from "../../../lib/content-pipeline/schema-types";

export function makeSubject(
  overrides: Partial<ProductionPyqsJson["subject"]> = {}
): ProductionPyqsJson["subject"] {
  return {
    id: "cy-301",
    code: "CY-301",
    name: "Computer Networks",
    title: "CY-301 – Computer Networks",
    semester: "III",
    gradingSystem: "Grading System (GS)",
    maxMarks: 70,
    time: "3 Hours",
    commonInstructions: ["Attempt any five questions."],
    ...overrides,
  };
}

export function makeSub(
  id: string,
  label: string,
  text: string,
  extras: Partial<ProductionSubQuestion> = {}
): ProductionSubQuestion {
  return {
    id,
    label,
    text,
    unit: "Unit 1",
    type: "theory",
    ...extras,
  };
}

export function makeQuestion(
  id: string,
  questionNumber: string,
  subs: ProductionSubQuestion[]
): ProductionQuestion {
  return { id, questionNumber, subQuestions: subs };
}

export function makePaper(
  year: number,
  month: string,
  questions: ProductionQuestion[],
  exam?: string
): ProductionPaper {
  return {
    exam: exam ?? `${month} ${year}`,
    year,
    month,
    questions,
  };
}

export function makePyqs(
  papers: ProductionPaper[],
  subject = makeSubject()
): ProductionPyqsJson {
  return { subject, papers };
}

/** Existing corpus: 2022 + 2023 papers. */
export function fixtureExisting2022_2023(): ProductionPyqsJson {
  return makePyqs([
    makePaper(2022, "June", [
      makeQuestion("q1", "Q.1", [
        makeSub("q1a", "a)", "Define OSI model layers."),
      ]),
    ]),
    makePaper(2023, "December", [
      makeQuestion("q1", "Q.1", [
        makeSub("q1a", "a)", "Explain TCP congestion control."),
      ]),
    ]),
  ]);
}

/** Incoming new papers: 2024 + 2025. */
export function fixtureIncoming2024_2025(): ProductionPyqsJson {
  return makePyqs([
    makePaper(2024, "June", [
      makeQuestion("q1", "Q.1", [
        makeSub("q1a", "a)", "Compare IPv4 and IPv6."),
        makeSub("q1b", "b)", "Describe subnetting with an example.", {
          attachments: [
            {
              id: "att1",
              type: "image",
              path: "diagrams/june-2024/Q.1-b-june-2024.webp",
              title: "Subnet diagram",
              alt: "Subnet diagram",
              caption: "",
              aiContext: "Shows subnet mask allocation.",
            },
          ],
        }),
      ]),
    ]),
    makePaper(2025, "December", [
      makeQuestion("q1", "Q.1", [
        makeSub("q1a", "a)", "Explain BGP path selection."),
      ]),
    ]),
  ]);
}

/** Exact duplicate of 2023 December paper (same identity). */
export function fixtureDuplicate2023December(): ProductionPyqsJson {
  return makePyqs([
    makePaper(2023, "December", [
      makeQuestion("q1", "Q.1", [
        makeSub("q1a", "a)", "Explain TCP congestion control."),
      ]),
    ]),
  ]);
}

/** Incomplete paper for validation rejection scenarios. */
export function fixtureIncompletePaper(): ProductionPyqsJson {
  return {
    subject: makeSubject(),
    papers: [
      {
        exam: "",
        year: 1999,
        month: "",
        questions: [
          {
            id: "",
            questionNumber: "bad",
            subQuestions: [
              {
                id: "",
                label: "",
                text: "",
                unit: "",
              },
            ],
          },
        ],
      },
    ],
  };
}
