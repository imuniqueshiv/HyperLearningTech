import { NextRequest, NextResponse } from "next/server";

import { readValidationReport } from "@/lib/content-pipeline/server";

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
    const report = await readValidationReport(jobId);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation report not found for this job.",
          code: "VALIDATION_REPORT_MISSING",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        report,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CMS Validation Report Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load validation report.",
        code: "VALIDATION_REPORT_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
