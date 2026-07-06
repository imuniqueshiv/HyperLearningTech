import { NextRequest, NextResponse } from "next/server";

import { generateTopicAnswer } from "@/lib/ai/topic-service";
import { generateFollowupAnswer } from "@/lib/ai/followup-service";
import { WorkspaceAction } from "@/types/ai";
import { trackMetric } from "@/lib/ai/metrics";

interface WorkspaceBody {
  branch?: string;
  semester?: string;
  topicId?: string;
  subjectCode?: string;
  action?: WorkspaceAction;
  forceRefresh?: boolean;
  question?: string;
  topic?: string;
  module?: string;
  cachedExplanation?: string;
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

    // Follow-up question mode → followup-service (live, no cache)
    if (question) {
      const cachedExplanation = body.cachedExplanation?.trim();
      const topic = body.topic?.trim();
      const moduleTitle = body.module?.trim();

      if (!subjectCode) {
        return NextResponse.json(
          { success: false, error: "Subject code is required." },
          { status: 400 }
        );
      }
      if (!cachedExplanation) {
        return NextResponse.json(
          {
            success: false,
            error: "Cached explanation is required for follow-up questions.",
          },
          { status: 400 }
        );
      }
      if (!topic) {
        return NextResponse.json(
          { success: false, error: "Topic is required." },
          { status: 400 }
        );
      }
      if (!moduleTitle) {
        return NextResponse.json(
          { success: false, error: "Module is required." },
          { status: 400 }
        );
      }

      const result = await generateFollowupAnswer({
        subjectCode,
        module: moduleTitle,
        topic,
        cachedExplanation,
        question,
        messages,
      });

      return NextResponse.json({
        success: true,
        answer: result.answer,
        cached: false,
        mode: "followup",
      });
    }

    // Topic action mode → topic-service (cached)
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
      mode: "topic",
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
    modes: ["topic", "followup"],
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
