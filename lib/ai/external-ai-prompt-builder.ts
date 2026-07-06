import { ChatMessage } from "@/types/ai";

export interface ExternalAIPromptContext {
  subjectName: string;
  subjectCode: string;
  module: string;
  topic: string;
  cachedExplanation: string;
  messages: ChatMessage[];
}

function formatConversation(messages: ChatMessage[]): string {
  const followups = messages.filter(
    (m, index) => !(index === 0 && m.role === "assistant")
  );

  if (followups.length === 0) {
    return "No follow-up questions yet.";
  }

  return followups
    .map((m) => {
      const label = m.role === "user" ? "Student" : "Assistant";
      return `${label}:\n${m.content}`;
    })
    .join("\n\n");
}

export function buildExternalAIPrompt(
  context: ExternalAIPromptContext
): string {
  const conversation = formatConversation(context.messages);

  return `Continue this engineering learning session.

Subject:
${context.subjectName}

Module:
${context.module}

Topic:
${context.topic}

Official Hyper AI Explanation

${context.cachedExplanation}

Conversation

${conversation}

Continue answering naturally from here.

Do not repeat the original explanation unless necessary.`;
}
