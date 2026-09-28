import { NextRequest, NextResponse } from "next/server";

import { readAcademicDocument } from "@/lib/content-pipeline/server";

import {
  cmsAuthErrorResponse,
  requireCmsAuth,
} from "@/lib/cms-auth";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

/**
 * Returns academic document summary stats for a job.
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
    const document = await readAcademicDocument(jobId);

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: "Academic document not found for this job.",
          code: "ACADEMIC_DOCUMENT_MISSING",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        summary: {
          jobId: document.metadata.jobId,
          model: document.metadata.model,
          structuredAt: document.metadata.structuredAt,
          subjectCode: document.metadata.subjectCode,
          subjectName: document.metadata.subjectName,
          exam: document.exam,
          questionCount: document.questions.length,
          subQuestionCount: document.questions.reduce(
            (sum, question) => sum + question.subQuestions.length,
            0
          ),
          unitCount: document.units.length,
          topicCount: document.topics.length,
          diagramCount: document.diagrams.length,
          usage: document.usage,
          questions: document.questions.map((question) => ({
            id: question.id,
            questionNumber: question.questionNumber,
            subQuestionCount: question.subQuestions.length,
          })),
          units: document.units.map((unit) => ({
            id: unit.id,
            number: unit.number,
            title: unit.title,
          })),
          diagrams: document.diagrams.map((diagram) => ({
            id: diagram.id,
            sourcePath: diagram.sourcePath,
            title: diagram.title,
            relatedQuestionId: diagram.relatedQuestionId,
            relatedSubQuestionId: diagram.relatedSubQuestionId,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CMS Structuring Result Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load academic document.",
        code: "STRUCTURING_RESULT_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
