import { NextRequest, NextResponse } from "next/server";

import {
  ReviewProcessingError,
  getReviewPackage,
} from "@/lib/content-pipeline/server";

import { cmsAuthErrorResponse, requireCmsAuth } from "@/lib/cms-auth";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireCmsAuth(request, "REVIEWER");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  try {
    const { jobId } = await context.params;
    const reviewPackage = await getReviewPackage(jobId);

    return NextResponse.json(
      {
        success: true,
        package: reviewPackage,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ReviewProcessingError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.code === "JOB_NOT_FOUND" ? 404 : 400 }
      );
    }

    console.error("CMS Review Package Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load review package.",
        code: "REVIEW_PACKAGE_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
