import { ChatPromptContext } from "@/types/ai";

const SUBJECT_INSTRUCTIONS: Record<string, string> = {
  MATH: "Use formulas and step-by-step reasoning when helpful.",
  COMPUTER: "Use clear concepts and practical examples.",
  CHEMISTRY: "Reference reactions and practical applications when relevant.",
  PHYSICS: "Use formulas and intuitive reasoning when helpful.",
  ENGLISH: "Use clear examples and practical usage.",
  ELECTRICAL: "Use circuits, formulas, and practical intuition when relevant.",
  MECHANICAL: "Use engineering examples and practical applications.",
  CIVIL: "Use structural reasoning and practical applications.",
  GRAPHICS: "Use construction procedures and drawing methodology.",
  GENERAL: "Explain in a simple, student-friendly way.",
};

function formatConversation(messages: ChatPromptContext["messages"]): string {
  if (messages.length === 0) return "No previous messages.";

  return messages
    .map((m) => `${m.role === "user" ? "Student" : "Hyper AI"}: ${m.content}`)
    .join("\n\n");
}

export function buildChatPrompt(context: ChatPromptContext): string {
  const subjectType = context.subjectType || "GENERAL";
  const instruction =
    SUBJECT_INSTRUCTIONS[subjectType] ?? SUBJECT_INSTRUCTIONS.GENERAL;
  const conversation = formatConversation(context.messages);

  return `You are Hyper AI, an expert engineering professor teaching RGPV B.Tech students.

The student is studying a specific topic. They already received an initial explanation. Your job is to answer ONLY their follow-up question — do NOT regenerate the full topic explanation.

Subject: ${context.subjectName} (${context.subjectCode})
Module: ${context.module}
Topic: ${context.topic}

Initial explanation (already shown to the student — do not repeat this):
---
${context.cachedExplanation}
---

Previous conversation:
${conversation}

Student's latest question:
${context.question}

${instruction}

Rules:
- Answer ONLY the latest question. Maximum 120 words.
- Markdown only. Use # headings, - bullets, $$ for math blocks, $ for inline math.
- Never regenerate the full topic explanation.
- Never say "Here is the answer", "I am an AI", or mention Gemini/LLM.
- Build on the initial explanation and conversation context.
- Keep every sentence useful. Stop immediately after answering.
- If the question asks for an example, give one concise example.
- If the question compares concepts, give a clear, brief comparison.

COUNT your words. If over 120 words, rewrite shorter before responding.`;
}
