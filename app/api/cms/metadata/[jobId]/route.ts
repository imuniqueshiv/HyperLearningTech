import { NextRequest, NextResponse } from "next/server";

import {
  getJob,
  readJobMetadata,
  updateJobMetadata,
} from "@/lib/content-pipeline/server";
import {
  normalizeBranch,
  normalizeSemester,
  normalizeSubjectCode,
  isExamSession,
  isValidExamYear,
} from "@/lib/content-pipeline/metadata-extractor";
import type { ExamSession } from "@/lib/content-pipeline";

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
 * Administrator override for extracted Import Session metadata.
 * Always wins over auto-extraction.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireCmsAuth(request, "ADMIN");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  try {
    const { jobId } = await context.params;
    const metadata = await readJobMetadata(jobId);
    if (!metadata) {
      return NextResponse.json(
        { success: false, error: "Job not found.", code: "JOB_NOT_FOUND" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      branch?: string | null;
      semester?: string | null;
      subjectCode?: string | null;
      year?: number | null;
      examSession?: ExamSession | null;
    };

    const manualOverrides = { ...metadata.manualOverrides };
    const next = { ...metadata };

    if ("branch" in body) {
      next.branch = body.branch
        ? (normalizeBranch(body.branch) ?? body.branch)
        : null;
      manualOverrides.branch = true;
    }
    if ("semester" in body) {
      next.semester = body.semester
        ? (normalizeSemester(body.semester) ?? body.semester)
        : null;
      manualOverrides.semester = true;
    }
    if ("subjectCode" in body) {
      next.subjectCode = body.subjectCode
        ? (normalizeSubjectCode(body.subjectCode) ?? body.subjectCode)
        : null;
      manualOverrides.subjectCode = true;
    }
    if ("year" in body) {
      if (body.year != null && !isValidExamYear(body.year)) {
        return NextResponse.json(
          {
            success: false,
            error: "Year must be between 2000 and 2099.",
            code: "INVALID_YEAR",
          },
          { status: 400 }
        );
      }
      next.year = isValidExamYear(body.year) ? body.year : null;
      manualOverrides.year = true;
    }
    if ("examSession" in body) {
      next.examSession = isExamSession(body.examSession)
        ? body.examSession
        : null;
      manualOverrides.examSession = true;
    }

    next.manualOverrides = manualOverrides;
    next.updatedAt = new Date().toISOString();
    await updateJobMetadata(next);

    const job = await getJob(jobId);
    return NextResponse.json({ success: true, job }, { status: 200 });
  } catch (error) {
    console.error("CMS metadata override error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update metadata.",
        code: "METADATA_UPDATE_FAILED",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
