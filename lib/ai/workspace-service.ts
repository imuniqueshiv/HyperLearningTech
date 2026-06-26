import { GoogleGenAI } from "@google/genai";

import { buildWorkspacePrompt } from "@/lib/ai/workspace-prompt-builder";
import { WorkspaceAction } from "@/types/ai";

import { getSubjectInfo } from "@/lib/ai/subject-map";
import { getWorkspaceKey } from "@/lib/ai/key-manager";
import {
  getWorkspaceCache,
  saveWorkspaceCache,
} from "@/lib/ai/workspace-cache";
import { trackMetric } from "@/lib/ai/metrics";

export interface WorkspaceRequest {
  topic: string;
  module: string;
  subjectCode: string;
  action: WorkspaceAction;
  forceRefresh?: boolean;
}

export interface WorkspaceResponse {
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
        message: `Workspace attempt ${attempt} failed`,
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

export async function generateWorkspace(
  input: WorkspaceRequest
): Promise<WorkspaceResponse> {
  const { topic, module, subjectCode, action, forceRefresh = false } = input;

  if (!topic.trim()) {
    throw new Error("Topic is required.");
  }

  if (!forceRefresh) {
    const cached = await getWorkspaceCache(action, topic, subjectCode);

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

  const subject = getSubjectInfo(subjectCode);

  const prompt = buildWorkspacePrompt({
    action,
    topic,
    module,
    subjectCode,
    subjectName: subject.name,
    subjectType: subject.type,
  });

  const ai = new GoogleGenAI({
    apiKey: getWorkspaceKey(),
  });

  const answer = await generateWithRetry(ai, prompt, subjectCode);

  await saveWorkspaceCache(action, topic, subjectCode, answer);

  return {
    answer,
    cached: false,
  };
}
