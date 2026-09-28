import { NextRequest, NextResponse } from "next/server";

import {
  readProductionPyqs,
  readProductionSyllabus,
} from "@/lib/content-pipeline/server";

import {
  cmsAuthErrorResponse,
  requireCmsAuth,
} from "@/lib/cms-auth";

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
    const pyqs = await readProductionPyqs(jobId);
    const syllabus = await readProductionSyllabus(jobId);

    if (!pyqs && !syllabus) {
      return NextResponse.json(
        {
          success: false,
          error: "Production preview JSON not found for this job.",
          code: "PRODUCTION_JSON_MISSING",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        preview: {
          pyqs,
          syllabus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CMS Schema Preview Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load production preview JSON.",
        code: "SCHEMA_PREVIEW_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
