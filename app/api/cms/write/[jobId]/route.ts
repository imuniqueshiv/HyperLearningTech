import { NextRequest, NextResponse } from "next/server";

import {
  readJobDiagramManifest,
  readWriteReport,
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
    const report = await readWriteReport(jobId);
    const manifest = await readJobDiagramManifest(jobId);

    if (!report && !manifest) {
      return NextResponse.json(
        {
          success: false,
          error: "Write report not found for this job.",
          code: "WRITE_REPORT_MISSING",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        report,
        manifest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CMS Write Report Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load write report.",
        code: "WRITE_REPORT_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
