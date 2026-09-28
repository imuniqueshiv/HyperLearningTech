import { NextRequest, NextResponse } from "next/server";

import { readRawDocument } from "@/lib/content-pipeline/server";

import { cmsAuthErrorResponse, requireCmsAuth } from "@/lib/cms-auth";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

/**
 * Returns OCR summary stats for a job (not a full JSON dump for the UI).
 */
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
    const document = await readRawDocument(jobId);

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: "Raw document not found for this job.",
          code: "RAW_DOCUMENT_MISSING",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        summary: {
          jobId: document.metadata.jobId,
          engine: document.metadata.engine,
          extractedAt: document.metadata.extractedAt,
          durationMs: document.metadata.durationMs,
          pageCount: document.metadata.pageCount,
          imageCount: document.metadata.imageCount,
          tableCount: document.metadata.tableCount,
          textBlockCount: document.metadata.textBlockCount,
          pages: document.pages.map((page) => ({
            pageNumber: page.pageNumber,
            width: page.width,
            height: page.height,
            imagePath: page.imagePath,
            textPreview: page.text.slice(0, 240),
            textBlockCount: page.textBlocks.length,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CMS OCR Result Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load OCR results.",
        code: "OCR_RESULT_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
