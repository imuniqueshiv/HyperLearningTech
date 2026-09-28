import { NextRequest, NextResponse } from "next/server";

import { readStructuredDocument } from "@/lib/content-pipeline/server";

import { cmsAuthErrorResponse, requireCmsAuth } from "@/lib/cms-auth";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

/**
 * Returns layout summary stats for a job (not a full JSON dump for the UI).
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
    const document = await readStructuredDocument(jobId);

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: "Structured document not found for this job.",
          code: "STRUCTURED_DOCUMENT_MISSING",
        },
        { status: 404 }
      );
    }

    const nodes = Object.values(document.nodes);

    return NextResponse.json(
      {
        success: true,
        summary: {
          jobId: document.metadata.jobId,
          detector: document.metadata.detector,
          structuredAt: document.metadata.structuredAt,
          durationMs: document.metadata.durationMs,
          pageCount: document.metadata.pageCount,
          sectionCount: document.metadata.sectionCount,
          questionCount: document.metadata.questionCount,
          subQuestionCount: document.metadata.subQuestionCount,
          figureCount: document.metadata.figureCount,
          tableCount: document.metadata.tableCount,
          captionCount: document.metadata.captionCount,
          pages: document.pageIds.map((pageId) => {
            const page = document.nodes[pageId];
            const childKinds = (page?.childIds ?? [])
              .map((id) => document.nodes[id]?.kind)
              .filter(Boolean);

            return {
              pageNumber: page?.pageNumber ?? 0,
              blockCount: page?.childIds.length ?? 0,
              headings: childKinds.filter((kind) => kind === "heading").length,
              questions: childKinds.filter((kind) => kind === "question")
                .length,
              figures: childKinds.filter((kind) => kind === "figure").length,
              tables: childKinds.filter((kind) => kind === "table").length,
            };
          }),
          nodeCounts: {
            total: nodes.length,
            headings: nodes.filter((node) => node.kind === "heading").length,
            paragraphs: nodes.filter((node) => node.kind === "paragraph")
              .length,
            questions: nodes.filter((node) => node.kind === "question").length,
            subQuestions: nodes.filter((node) => node.kind === "sub_question")
              .length,
            figures: nodes.filter((node) => node.kind === "figure").length,
            tables: nodes.filter((node) => node.kind === "table").length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CMS Layout Result Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load layout results.",
        code: "LAYOUT_RESULT_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
