import { GoogleGenAI } from "@google/genai";

import { buildChatPrompt } from "@/lib/ai/chat-prompt-builder";
import { getWorkspaceKey } from "@/lib/ai/key-manager";
import { getSubjectInfo } from "@/lib/ai/subject-map";
import { trackMetric } from "@/lib/ai/metrics";

export interface FollowupRequest {
  subjectCode: string;
  module: string;
  topic: string;
  cachedExplanation: string;
  question: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface FollowupResponse {
  answer: string;
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
        message: `Follow-up attempt ${attempt} failed`,
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

export async function generateFollowupAnswer(
  input: FollowupRequest
): Promise<FollowupResponse> {
  const {
    subjectCode,
    module,
    topic,
    cachedExplanation,
    question,
    messages = [],
  } = input;

  if (!question.trim()) {
    throw new Error("Question is required.");
  }

  if (!cachedExplanation.trim()) {
    throw new Error("Cached explanation is required for follow-up questions.");
  }

  if (!topic.trim()) {
    throw new Error("Topic is required.");
  }

  const subject = getSubjectInfo(subjectCode);

  const prompt = buildChatPrompt({
    subjectCode,
    subjectName: subject.name,
    subjectType: subject.type,
    module,
    topic,
    cachedExplanation,
    messages,
    question: question.trim(),
  });

  const ai = new GoogleGenAI({
    apiKey: getWorkspaceKey(),
  });

  const answer = await generateWithRetry(ai, prompt, subjectCode);

  return { answer };
}
