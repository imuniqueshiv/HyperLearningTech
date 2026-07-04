import type { Topic } from "./topic";

export interface SyllabusModule {
  id: string;
  number: number;
  title: string;
  hours: number;
  topics: Topic[];
  questionIds: string[];
  predictedQuestionIds: string[];
}
