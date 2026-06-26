import { GoogleGenAI } from "@google/genai";

import { buildPrompt } from "@/lib/ai/prompt-builder";
import { getSubjectInfo } from "@/lib/ai/subject-map";
import { getPrimaryKey } from "@/lib/ai/key-manager";
import { getCachedAnswer, saveAnswerToCache } from "@/lib/ai/answer-cache";

import { trackMetric } from "@/lib/ai/metrics";

export interface GenerateAnswerInput {
  question: string;
  subjectCode: string;
  forceRefresh?: boolean;
}

export interface GenerateAnswerResult {
  answer: string;
  cached: boolean;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(
  ai: GoogleGenAI,
  prompt: string,
  subjectCode: string
): Promise<string> {
  const maxAttempts = 3;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const started = Date.now();

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
      });

      const answer = response.text?.trim() || "No answer generated.";

      trackMetric("GENERATION_SUCCESS", {
        subjectCode,
        durationMs: Date.now() - started,
      });

      return answer;
    } catch (error) {
      lastError = error;

      trackMetric("GENERATION_RETRY", {
        subjectCode,
        message: `Attempt ${attempt} failed`,
      });

      if (attempt < maxAttempts) {
        await sleep(1500 * attempt);
      }
    }
  }

  trackMetric("GENERATION_FAILED", {
    subjectCode,
    message: String(lastError),
  });

  throw lastError;
}

export async function generateAnswer(
  input: GenerateAnswerInput
): Promise<GenerateAnswerResult> {
  const { question, subjectCode, forceRefresh = false } = input;

  if (!question?.trim()) {
    throw new Error("Question is required");
  }

  // CACHE FIRST
  if (!forceRefresh) {
    const cached = await getCachedAnswer(question, subjectCode);

    if (cached) {
      trackMetric("CACHE_HIT", {
        subjectCode,
      });

      return {
        answer: cached,
        cached: true,
      };
    }

    trackMetric("CACHE_MISS", {
      subjectCode,
    });
  }

  // SUBJECT LOOKUP
  const subject = getSubjectInfo(subjectCode);

  // PROMPT BUILD
  const prompt = buildPrompt({
    question,
    subjectCode,
    subjectType: subject.type,
  });

  // GEMINI CLIENT
  const ai = new GoogleGenAI({
    apiKey: getPrimaryKey(),
  });

  const answer = await generateWithRetry(ai, prompt, subjectCode);

  // SAVE CACHE
  await saveAnswerToCache(question, subjectCode, answer);

  return {
    answer,
    cached: false,
  };
}
