import { getTopicById } from "@/lib/content";
import { getTopicCache } from "@/lib/ai/topic-cache";
import { generateTopicAnswer } from "@/lib/ai/topic-service";

export interface ResolveTopicContext {
  branch: string;
  semester: string;
  topicId: string;
  subjectCode: string;
}

export interface ResolvedTopic {
  topic: string;
  module: string;
  explanation: string;
  cached: boolean;
}

export async function resolveTopicExplanation(
  input: ResolveTopicContext
): Promise<ResolvedTopic> {
  const { branch, semester, topicId, subjectCode } = input;

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

  const cached = await getTopicCache(topicId);

  if (cached?.answer) {
    return {
      topic: topicData.topic.title,
      module: topicData.module.title,
      explanation: cached.answer,
      cached: true,
    };
  }

  const result = await generateTopicAnswer({
    branch,
    semester,
    topicId,
    subjectCode,
    action: "EXPLAIN",
  });

  return {
    topic: topicData.topic.title,
    module: topicData.module.title,
    explanation: result.answer,
    cached: result.cached,
  };
}
