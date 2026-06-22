// lib/content/question-mapper.ts

interface SubQuestion {
  id: string;
  label: string;
  text: string;
  latex?: string;
  unit: string;
  type?: string;
}

interface Question {
  id: string;
  questionNumber: string;
  subQuestions: SubQuestion[];
}

interface Paper {
  exam: string;
  year: number;
  month: string;
  questions: Question[];
}

interface PYQData {
  papers: Paper[];
}

interface Module {
  number: number;
}

export function getQuestionsForModule(
  module: Module,
  pyqs: PYQData | null
) {
  if (!pyqs?.papers) return [];

  return pyqs.papers.flatMap((paper) =>
    paper.questions.flatMap((question) =>
      question.subQuestions
        .filter(
          (subQuestion) =>
            subQuestion.unit === `Unit ${module.number}`
        )
        .map((subQuestion) => ({
          ...subQuestion,
          exam: paper.exam,
          year: paper.year,
          month: paper.month,
        }))
    )
  );
}