import { NextResponse } from "next/server";

import { readSaveReport } from "@/lib/content-pipeline/server";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const report = await readSaveReport(jobId);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: "Save report not found for this job.",
          code: "SAVE_REPORT_MISSING",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, report }, { status: 200 });
  } catch (error) {
    console.error("CMS Save Report Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load save report.",
        code: "SAVE_REPORT_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
