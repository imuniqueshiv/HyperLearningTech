import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import { generateTopicAnswer } from "@/lib/ai/topic-service";
import { WorkspaceAction } from "@/types/ai";
import { getPrimaryKey } from "@/lib/ai/key-manager";
import { trackMetric } from "@/lib/ai/metrics";

interface WorkspaceBody {
  branch?: string;
  semester?: string;
  topicId?: string;
  subjectCode?: string;
  action?: WorkspaceAction;
  forceRefresh?: boolean;
  question?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
}

const ALLOWED_ACTIONS: WorkspaceAction[] = [
  "EXPLAIN",
  "NOTES",
  "ANSWER_5",
  "ANSWER_7",
  "REVISION",
  "MCQ",
  "PYQ",
  "FORMULA",
];

function detectAction(question: string): WorkspaceAction {
  const q = question.toLowerCase();

  if (q.includes("5 mark") || q.includes("5mark")) return "ANSWER_5";
  if (q.includes("7 mark") || q.includes("7mark")) return "ANSWER_7";
  if (q.includes("10 mark") || q.includes("10mark")) return "ANSWER_5";
  if (
    q.includes("revision") ||
    q.includes("revise") ||
    q.includes("revision sheet") ||
    q.includes("quick notes")
  )
    return "REVISION";
  if (q.includes("mcq") || q.includes("multiple choice") || q.includes("quiz"))
    return "MCQ";
  if (
    q.includes("pyq") ||
    q.includes("previous year") ||
    q.includes("past question")
  )
    return "PYQ";
  if (q.includes("formula") || q.includes("equation")) return "FORMULA";
  if (
    q.includes("notes") ||
    q.includes("comprehensive") ||
    q.includes("detailed notes")
  )
    return "NOTES";
  if (
    q.includes("explain") ||
    q.includes("what is") ||
    q.includes("define") ||
    q.includes("describe")
  )
    return "EXPLAIN";

  return "EXPLAIN";
}

async function generateRelatedTopics(
  topic: string,
  subjectCode: string
): Promise<string[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: getPrimaryKey() });

    const prompt = `You are an academic advisor for engineering students.
Based on the topic "${topic}" for subject "${subjectCode}", suggest 5 related sub-topics a student should study next.
Return ONLY a JSON array of short topic names. No explanations, no markdown, no extra text.
Example: ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const text = response.text?.trim() || "[]";

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 5);
    } catch {
      const match = text.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          const extracted = JSON.parse(match[0]);
          if (Array.isArray(extracted)) return extracted.slice(0, 5);
        } catch {}
      }
    }

    return [];
  } catch (error) {
    console.error("Failed to generate related topics:", error);
    return [];
  }
}

function buildChatPrompt(
  question: string,
  action: WorkspaceAction,
  topic?: string,
  moduleTitle?: string,
  subjectCode?: string,
  context?: string
): string {
  const wordLimits: Record<WorkspaceAction, string> = {
    EXPLAIN: "HARD LIMIT: 140 words. Count words. Rewrite if over 150.",
    NOTES: "HARD LIMIT: 200 words. Count words. Rewrite if over 200.",
    ANSWER_5: "HARD LIMIT: 200 words. Structured 5-mark answer.",
    ANSWER_7: "HARD LIMIT: 220 words. Structured 7-mark answer.",
    REVISION: "HARD LIMIT: 80 words. Key points only.",
    MCQ: "Generate exactly 5 MCQs with 4 options each and answers.",
    PYQ: "List only 5-7 previous year questions. No explanations.",
    FORMULA: "HARD LIMIT: 60 words. Formula + brief variable explanation only.",
  };

  const formatMap: Record<WorkspaceAction, string> = {
    EXPLAIN: `# [Topic]\n## Concept\n[explanation]\n## Example\n[one example]\n## Exam Tip\n[one tip]`,
    NOTES: `# [Topic] - Notes\n## Overview\n## Key Concepts\n## Important Points\n## Applications`,
    ANSWER_5: `# [Topic] - 5 Mark Answer\n## Introduction\n## Main Content\n## Conclusion`,
    ANSWER_7: `# [Topic] - 7 Mark Answer\n## Introduction\n## Detailed Explanation\n## Applications\n## Conclusion`,
    REVISION: `# [Topic] - Quick Revision\n## Key Points\n## Formula (if any)\n## Exam Focus`,
    MCQ: `## Question N\n**Question?**\n- A) \n- B) \n- C) \n- D) \n**Answer:** X)\n**Explanation:** [brief]`,
    PYQ: `# [Topic] - PYQs\n1. [Year] - [Question]\n2. ...`,
    FORMULA: `# [Topic] - Formula\n$$formula$$\n**Variables:** ...\n**Use:** ...`,
  };

  return `You are Hyper AI, an expert engineering professor for RGPV B.Tech students.

Subject: ${subjectCode || "Engineering"}
${topic ? `Topic: ${topic}` : ""}
${moduleTitle ? `Module: ${moduleTitle}` : ""}
Action: ${action}

${context ? `Previous conversation:\n${context}\n` : ""}
User question: ${question}

${wordLimits[action]}

Use this markdown structure:
${formatMap[action]}

Rules:
- Markdown only. Use # headings, - bullets, $$ for math blocks, $ for inline math.
- Never write introductions like "Welcome" or "Great question".
- Never say "I am an AI" or mention Gemini.
- No background history or classifications unless directly asked.
- Answer ONLY what was asked. Stop immediately after.
- COUNT your words. If over limit, delete sentences until under limit.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WorkspaceBody;

    const branch = body.branch?.trim().toLowerCase();
    const semester = body.semester?.trim().toLowerCase();
    const topicId = body.topicId?.trim();
    const subjectCode = body.subjectCode?.trim().toUpperCase();
    const forceRefresh = body.forceRefresh ?? false;
    const question = body.question?.trim();
    const messages = body.messages ?? [];

    // Chat/question mode
    if (question) {
      const ai = new GoogleGenAI({ apiKey: getPrimaryKey() });
      const startTime = Date.now();

      const detectedAction = detectAction(question);

      const context = messages
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");

      const prompt = buildChatPrompt(
        question,
        detectedAction,
        undefined,
        undefined,
        subjectCode,
        context
      );

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
      });

      const answer = response.text?.trim() || "No answer generated.";

      trackMetric("GENERATION_SUCCESS", {
        subjectCode: subjectCode || "unknown",
        durationMs: Date.now() - startTime,
      });

      const relatedTopics = await generateRelatedTopics(
        question,
        subjectCode || "unknown"
      );

      return NextResponse.json({
        success: true,
        answer,
        relatedTopics,
        cached: false,
        action: detectedAction,
      });
    }

    // Workspace action mode
    const action = body.action;

    if (!branch) {
      return NextResponse.json(
        { success: false, error: "Branch is required." },
        { status: 400 }
      );
    }
    if (!semester) {
      return NextResponse.json(
        { success: false, error: "Semester is required." },
        { status: 400 }
      );
    }
    if (!topicId) {
      return NextResponse.json(
        { success: false, error: "Topic ID is required." },
        { status: 400 }
      );
    }
    if (!subjectCode) {
      return NextResponse.json(
        { success: false, error: "Subject code is required." },
        { status: 400 }
      );
    }
    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid workspace action." },
        { status: 400 }
      );
    }

    const result = await generateTopicAnswer({
      branch,
      semester,
      subjectCode,
      topicId,
      action,
      forceRefresh,
    });

    return NextResponse.json({
      success: true,
      answer: result.answer,
      cached: result.cached,
      action,
      relatedTopics: [],
    });
  } catch (error) {
    console.error("Workspace API Error:", error);

    trackMetric("GENERATION_FAILED", {
      subjectCode: "unknown",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate content. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    service: "Hyper AI Workspace",
    status: "healthy",
    supportedActions: ALLOWED_ACTIONS,
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
