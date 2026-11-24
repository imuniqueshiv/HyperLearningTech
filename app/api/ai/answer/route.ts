import { NextRequest, NextResponse } from "next/server";

import { generateAnswer } from "@/lib/ai/answer-service";
import { generateCacheKey, getCachedAnswer } from "@/lib/ai/answer-cache";
import {
  acquireGenerationLock,
  checkSlidingWindowRateLimit,
  getTrustedClientIdentifier,
  releaseGenerationLock,
} from "@/lib/rate-limit";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_QUESTION_LENGTH = 4000;

interface AnswerBody {
  question?: unknown;
  subjectCode?: unknown;
  forceRefresh?: unknown;
}

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

  let body: AnswerBody;
  try {
    const parsed: unknown = JSON.parse(readResult.body ?? "");
    if (!isRecord(parsed)) {
      return errorResponse("Request body must be a JSON object.", 400);
    }
    body = parsed;
  } catch {
    return errorResponse("Invalid JSON request.", 400);
  }

  if (typeof body.question !== "string") {
    return errorResponse("Question is required and must be a string.", 400);
  }
  const question = body.question.trim();
  if (!question) {
    return errorResponse("Question is required.", 400);
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return errorResponse("Question is too long.", 400);
  }

  if (typeof body.subjectCode !== "string") {
    return errorResponse("Subject code is required and must be a string.", 400);
  }
  const subjectCode = body.subjectCode.trim();
  if (!subjectCode || subjectCode.length > 40) {
    return errorResponse("Subject code is invalid.", 400);
  }

  if (
    Object.prototype.hasOwnProperty.call(body, "forceRefresh") &&
    typeof body.forceRefresh !== "boolean"
  ) {
    return errorResponse("forceRefresh must be a boolean.", 400);
  }
  const forceRefresh = body.forceRefresh === true;

  const identifier = getTrustedClientIdentifier(request.headers);
  if (!identifier) {
    return errorResponse("Unable to identify client for rate limiting.", 503);
  }

  const rateLimit = await checkSlidingWindowRateLimit({
    identifier,
    namespace: "ai-pyq-answer",
    limit: 30,
    windowSeconds: 10 * 60,
  });
  if (!rateLimit.available) {
    return errorResponse("AI rate limiting is temporarily unavailable.", 503);
  }
  if (!rateLimit.allowed) {
    return errorResponse(
      "Too many AI requests. Please try again later.",
      429,
      rateLimit.resetSeconds
    );
  }

  const cacheIdentity = generateCacheKey(question, subjectCode);
  if (!forceRefresh) {
    try {
      const cached = await getCachedAnswer(question, subjectCode);
      if (cached) {
        return NextResponse.json({
          success: true,
          answer: cached,
          cached: true,
        });
      }
    } catch (error) {
      console.error("AI answer cache lookup failed:", error);
      return errorResponse("AI caching is temporarily unavailable.", 503);
    }
  }

  const lockToken = await acquireGenerationLock("ai-pyq-answer", cacheIdentity);
  if (lockToken === null) {
    return errorResponse(
      "AI generation protection is temporarily unavailable.",
      503
    );
  }
  if (lockToken === false) {
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      try {
        const cached = await getCachedAnswer(question, subjectCode);
        if (cached) {
          return NextResponse.json({
            success: true,
            answer: cached,
            cached: true,
          });
        }
      } catch (error) {
        console.error("AI answer cache lookup failed while waiting:", error);
        return errorResponse("AI caching is temporarily unavailable.", 503);
      }
    }
    return errorResponse(
      "An identical answer is already being generated. Please retry shortly.",
      429,
      2
    );
  }

  try {
    const result = await generateAnswer({
      question,
      subjectCode,
      forceRefresh,
    });

    return NextResponse.json(
      {
        success: true,
        answer: result.answer,
        cached: result.cached,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI Answer Route Error:", error);
    return errorResponse("Failed to generate answer.", 500);
  } finally {
    await releaseGenerationLock("ai-pyq-answer", cacheIdentity, lockToken);
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
    },
    {
      status: 405,
    }
  );
}
