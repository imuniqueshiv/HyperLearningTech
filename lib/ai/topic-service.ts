import { GoogleGenAI } from "@google/genai";

import { buildWorkspacePrompt } from "@/lib/ai/workspace-prompt-builder";
import { WorkspaceAction } from "@/types/ai";

import { getTopicById } from "@/lib/content";
import { getSubjectInfo } from "@/lib/ai/subject-map";
import { getWorkspaceKey } from "@/lib/ai/key-manager";
import {
  getTopicCache,
  saveTopicCache,
  deleteTopicCache,
} from "@/lib/ai/topic-cache";
import { trackMetric } from "@/lib/ai/metrics";

export interface TopicRequest {
  branch: string;
  semester: string;
  topicId: string;
  subjectCode: string;
  action: WorkspaceAction;
  forceRefresh?: boolean;
}

export interface TopicResponse {
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

export async function generateTopicAnswer(
  input: TopicRequest
): Promise<TopicResponse> {
  const {
    branch,
    semester,
    topicId,
    subjectCode,
    action,
    forceRefresh = false,
  } = input;

  if (!forceRefresh) {
    const cached = await getTopicCache(topicId);

    if (cached) {
      trackMetric("CACHE_HIT", {
        subjectCode,
      });

      return {
        answer: cached.answer,
        cached: true,
      };
    }

    trackMetric("CACHE_MISS", {
      subjectCode,
    });
  }

  if (forceRefresh) {
    trackMetric("CACHE_REFRESH", {
      subjectCode,
    });

    await deleteTopicCache(topicId);
  }

  const topicData = await getTopicById(
    branch,
    semester,
    subjectCode.toLowerCase(),
    topicId
  );

  if (!topicData) {
    throw new Error(
      `Topic not found: branch=${branch}, semester=${semester}, subject=${subjectCode}, topicId=${topicId}`
    );
  }

  const topic = topicData.topic.title;
  const moduleTitle = topicData.module.title;

  if (!topic.trim()) {
    throw new Error("Topic is required.");
  }

  const subject = getSubjectInfo(subjectCode);

  const prompt = buildWorkspacePrompt({
    action,
    topic,
    module: moduleTitle,
    subjectCode,
    subjectName: subject.name,
    subjectType: subject.type,
  });

  const ai = new GoogleGenAI({
    apiKey: getWorkspaceKey(),
  });

  const answer = await generateWithRetry(ai, prompt, subjectCode);

  await saveTopicCache({
    topicId,
    answer,
    model: "gemini-2.5-flash-lite",
  });

  return {
    answer,
    cached: false,
  };
}
