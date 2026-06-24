import { NextRequest, NextResponse } from "next/server";

import { generateAnswer } from "@/lib/ai/answer-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const question = body?.question?.trim();
    const subjectCode = body?.subjectCode?.trim();
    const forceRefresh = Boolean(body?.forceRefresh);

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: "Question is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!subjectCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Subject code is required",
        },
        {
          status: 400,
        }
      );
    }

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
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("AI Answer Route Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate answer",
      },
      {
        status: 500,
      }
    );
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
