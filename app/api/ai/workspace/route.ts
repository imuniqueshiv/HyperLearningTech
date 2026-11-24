import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  generateTopicAnswer,
  TopicGenerationLockUnavailableError,
} from "@/lib/ai/topic-service";
import { generateFollowupAnswer } from "@/lib/ai/followup-service";
import { resolveTopicExplanation } from "@/lib/ai/resolve-topic-explanation";
import { getTopicCache } from "@/lib/ai/topic-cache";
import { WorkspaceAction } from "@/types/ai";
import { trackMetric } from "@/lib/ai/metrics";
import {
  acquireGenerationLock,
  checkSlidingWindowRateLimit,
  getTrustedClientIdentifier,
  releaseGenerationLock,
} from "@/lib/rate-limit";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_QUESTION_LENGTH = 4000;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES = 20;

interface WorkspaceBody {
  branch?: unknown;
  semester?: unknown;
  topicId?: unknown;
  subjectCode?: unknown;
  action?: unknown;
  forceRefresh?: unknown;
  question?: unknown;
  topic?: unknown;
  module?: unknown;
  cachedExplanation?: unknown;
  messages?: unknown;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readLimitedBody(
  request: NextRequest
): Promise<{ body?: string; status?: 400 | 413 }> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      return { status: 400 };
    }
    if (Number(contentLength) > MAX_BODY_BYTES) {
      return { status: 413 };
    }
  }

  if (!request.body) {
    return { body: "" };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return { status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { status: 400 };
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body: new TextDecoder().decode(body) };
}

function errorResponse(
  error: string,
  status: 400 | 413 | 429 | 503 | 500,
  retryAfter?: number
) {
  return NextResponse.json(
    { success: false, error },
    {
      status,
      headers:
        retryAfter === undefined
          ? undefined
          : { "Retry-After": String(retryAfter) },
    }
  );
}

function validateMessages(value: unknown): ConversationMessage[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_MESSAGES) return null;

  const messages: ConversationMessage[] = [];
  for (const message of value) {
    if (
      !isRecord(message) ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > MAX_MESSAGE_LENGTH
    ) {
      return null;
    }
    messages.push({
      role: message.role,
      content: message.content,
    });
  }
  return messages;
}

async function enforceRateLimit(
  request: NextRequest,
  namespace: string,
  limit: number
): Promise<NextResponse | null> {
  const identifier = getTrustedClientIdentifier(request.headers);
  if (!identifier) {
    return errorResponse("Unable to identify client for rate limiting.", 503);
  }

  const result = await checkSlidingWindowRateLimit({
    identifier,
    namespace,
    limit,
    windowSeconds: 10 * 60,
  });
  if (!result.available) {
    return errorResponse("AI rate limiting is temporarily unavailable.", 503);
  }
  if (!result.allowed) {
    return errorResponse(
      "Too many AI requests. Please try again later.",
      429,
      result.resetSeconds
    );
  }
  return null;
}

function followupLockIdentity(input: {
  branch: string;
  semester: string;
  subjectCode: string;
  topicId: string;
  question: string;
  messages: ConversationMessage[];
  topic?: string;
  module?: string;
  cachedExplanation?: string;
}) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export async function POST(request: NextRequest) {
  const readResult = await readLimitedBody(request);
  if (readResult.status) {
    return errorResponse(
      readResult.status === 413
        ? "Request body is too large."
        : "Invalid Content-Length header.",
      readResult.status
    );
  }

  let body: WorkspaceBody;
  try {
    const parsed: unknown = JSON.parse(readResult.body ?? "");
    if (!isRecord(parsed)) {
      return errorResponse("Request body must be a JSON object.", 400);
    }
    body = parsed;
  } catch {
    return errorResponse("Invalid JSON request.", 400);
  }

  const branch =
    typeof body.branch === "string" ? body.branch.trim().toLowerCase() : "";
  const semester =
    typeof body.semester === "string" ? body.semester.trim().toLowerCase() : "";
  const topicId = typeof body.topicId === "string" ? body.topicId.trim() : "";
  const subjectCode =
    typeof body.subjectCode === "string"
      ? body.subjectCode.trim().toUpperCase()
      : "";

  if (!branch || branch.length > 40) {
    return errorResponse("Branch is required and must be valid.", 400);
  }
  if (!semester || semester.length > 40) {
    return errorResponse("Semester is required and must be valid.", 400);
  }
  if (!topicId || topicId.length > 500) {
    return errorResponse("Topic ID is required and must be valid.", 400);
  }
  if (!subjectCode || subjectCode.length > 40) {
    return errorResponse("Subject code is required and must be valid.", 400);
  }

  if (
    (Object.prototype.hasOwnProperty.call(body, "forceRefresh") &&
      typeof body.forceRefresh !== "boolean") ||
    (body.topic !== undefined &&
      (typeof body.topic !== "string" || body.topic.length > 500)) ||
    (body.module !== undefined &&
      (typeof body.module !== "string" || body.module.length > 500)) ||
    (body.cachedExplanation !== undefined &&
      (typeof body.cachedExplanation !== "string" ||
        body.cachedExplanation.length > 12_000))
  ) {
    return errorResponse("Invalid or oversized workspace payload.", 400);
  }

  const messages = validateMessages(body.messages);
  if (!messages) {
    return errorResponse("Invalid or oversized conversation history.", 400);
  }

  const questionPresent = Object.prototype.hasOwnProperty.call(
    body,
    "question"
  );
  if (questionPresent && typeof body.question !== "string") {
    return errorResponse("Question must be a string.", 400);
  }
  const question = questionPresent
    ? (body.question as string).trim()
    : undefined;
  if (questionPresent && !question) {
    return errorResponse("Question is required.", 400);
  }
  if (question && question.length > MAX_QUESTION_LENGTH) {
    return errorResponse("Question is too long.", 400);
  }

  if (question !== undefined) {
    if (body.forceRefresh === true || body.action !== undefined) {
      return errorResponse(
        "forceRefresh and topic actions are not valid for follow-up requests.",
        400
      );
    }

    const rateLimitResponse = await enforceRateLimit(
      request,
      "ai-followup",
      30
    );
    if (rateLimitResponse) return rateLimitResponse;

    const cachedExplanation = await getTopicCache({
      branch,
      semester,
      subjectCode,
      topicId,
    });
    if (!cachedExplanation?.answer) {
      const topicLimitResponse = await enforceRateLimit(
        request,
        "ai-topic-generation",
        20
      );
      if (topicLimitResponse) return topicLimitResponse;
    }

    const lockIdentity = followupLockIdentity({
      branch,
      semester,
      subjectCode,
      topicId,
      question,
      messages,
      topic: typeof body.topic === "string" ? body.topic.trim() : undefined,
      module: typeof body.module === "string" ? body.module.trim() : undefined,
      cachedExplanation:
        typeof body.cachedExplanation === "string"
          ? body.cachedExplanation.trim()
          : undefined,
    });
    const lockToken = await acquireGenerationLock(
      "ai-followup",
      lockIdentity,
      120
    );
    if (lockToken === null) {
      return errorResponse(
        "AI generation protection is temporarily unavailable.",
        503
      );
    }
    if (lockToken === false) {
      return errorResponse(
        "An identical follow-up is already being generated. Please retry shortly.",
        429,
        2
      );
    }

    try {
      const resolved = await resolveTopicExplanation({
        branch,
        semester,
        topicId,
        subjectCode,
      });

      const topic =
        typeof body.topic === "string" && body.topic.trim()
          ? body.topic.trim()
          : resolved.topic;
      const moduleTitle =
        typeof body.module === "string" && body.module.trim()
          ? body.module.trim()
          : resolved.module;
      const cachedExplanation =
        typeof body.cachedExplanation === "string" &&
        body.cachedExplanation.trim()
          ? body.cachedExplanation.trim()
          : resolved.explanation;

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
    } catch (error) {
      console.error("Workspace API Error:", error);
      trackMetric("GENERATION_FAILED", {
        subjectCode,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      if (error instanceof TopicGenerationLockUnavailableError) {
        return errorResponse(
          "AI generation protection is temporarily unavailable.",
          503
        );
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      return errorResponse(
        message.includes("API key") || message.includes("Gemini")
          ? "AI service is not configured. Please try again later."
          : "Unable to generate content. Please try again.",
        500
      );
    } finally {
      await releaseGenerationLock("ai-followup", lockIdentity, lockToken);
    }
  }

  if (
    typeof body.action !== "string" ||
    !ALLOWED_ACTIONS.includes(body.action as WorkspaceAction)
  ) {
    return errorResponse("Invalid workspace action.", 400);
  }
  const action = body.action as WorkspaceAction;

  const rateLimitResponse = await enforceRateLimit(
    request,
    "ai-topic-generation",
    20
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const result = await generateTopicAnswer({
      branch,
      semester,
      subjectCode,
      topicId,
      action,
      forceRefresh: body.forceRefresh === true,
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
      subjectCode,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof TopicGenerationLockUnavailableError) {
      return errorResponse(
        "AI generation protection is temporarily unavailable.",
        503
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error:
          message.includes("API key") || message.includes("Gemini")
            ? "AI service is not configured. Please try again later."
            : "Unable to generate content. Please try again.",
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
