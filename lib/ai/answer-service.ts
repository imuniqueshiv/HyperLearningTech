import { GoogleGenAI } from "@google/genai";

import { buildPrompt } from "@/lib/ai/prompt-builder";
import { getSubjectInfo } from "@/lib/ai/subject-map";
import { getPrimaryKey } from "@/lib/ai/key-manager";
import { getCachedAnswer, saveAnswerToCache } from "@/lib/ai/answer-cache";

export interface GenerateAnswerInput {
  question: string;
  subjectCode: string;
  forceRefresh?: boolean;
}

export interface GenerateAnswerResult {
  answer: string;
  cached: boolean;
}

export async function generateAnswer(
  input: GenerateAnswerInput
): Promise<GenerateAnswerResult> {
  const { question, subjectCode, forceRefresh = false } = input;

  if (!question?.trim()) {
    throw new Error("Question is required");
  }

  // Cache First
  if (!forceRefresh) {
    const cached = await getCachedAnswer(question, subjectCode);

    if (cached) {
      return {
        answer: cached,
        cached: true,
      };
    }
  }

  // Subject Lookup
  const subject = getSubjectInfo(subjectCode);

  // Prompt Creation
  const prompt = buildPrompt({
    question,
    subjectCode,
    subjectType: subject.type,
  });

  // Gemini Client
  const ai = new GoogleGenAI({
    apiKey: getPrimaryKey(),
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
  });

  const answer = response.text?.trim() || "No answer generated.";

  // Save Cache
  await saveAnswerToCache(question, subjectCode, answer);

  return {
    answer,
    cached: false,
  };
}
