// lib/content/question-mapper.ts

import type { PYQData } from "@/types/pyq";

interface Module {
  number: number;
}

export function getQuestionsForModule(module: Module, pyqs: PYQData | null) {
  if (!pyqs?.papers) return [];

  return pyqs.papers.flatMap((paper) =>
    paper.questions.flatMap((question) =>
      question.subQuestions
        .filter((subQuestion) => subQuestion.unit === `Unit ${module.number}`)
        .map((subQuestion) => ({
          ...subQuestion,
          exam: paper.exam,
          year: paper.year,
          month: paper.month,
        }))
    )
  );
}

export type { PYQData } from "@/types/pyq";
