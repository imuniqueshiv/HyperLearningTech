import { NextRequest, NextResponse } from "next/server";

import {
  GitReviewError,
  captureGitReview,
} from "@/lib/content-pipeline/server";

import { cmsAuthErrorResponse, requireCmsAuth } from "@/lib/cms-auth";

export async function GET(request: NextRequest) {
  try {
    await requireCmsAuth(request, "REVIEWER");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  try {
    const snapshot = await captureGitReview(process.cwd());
    return NextResponse.json({ success: true, snapshot }, { status: 200 });
  } catch (error) {
    if (error instanceof GitReviewError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: 400 }
      );
    }

    console.error("CMS Git Review Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to capture git review.",
        code: "GIT_REVIEW_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireCmsAuth(request, "REVIEWER");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  return NextResponse.json(
    {
      success: false,
      error: "Git mutations are not allowed. Use copyable commands only.",
      code: "GIT_MUTATION_BLOCKED",
    },
    { status: 405 }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
