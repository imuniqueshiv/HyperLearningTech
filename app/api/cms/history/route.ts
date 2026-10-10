import { NextRequest, NextResponse } from "next/server";

import type { HistoryListFilters } from "@/lib/content-pipeline";
import {
  HistoryProcessingError,
  listImportHistory,
} from "@/lib/content-pipeline/server";
import {
  deleteImportHistory,
  deleteImportHistoryBulk,
  HistoryDeleteError,
} from "@/lib/content-pipeline/history-delete-service";
import type { ImportStatus, JobType } from "@/lib/content-pipeline";

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
    const params = request.nextUrl.searchParams;
    const filters: HistoryListFilters = {
      search: params.get("search") ?? undefined,
      status: (params.get("status") as ImportStatus | "all" | null) ?? "all",
      jobType: (params.get("jobType") as JobType | "all" | null) ?? "all",
      branch: params.get("branch"),
      semester: params.get("semester"),
      subject: params.get("subject"),
      sort:
        (params.get("sort") as HistoryListFilters["sort"] | null) ?? "newest",
    };

    const result = await listImportHistory(filters);

    return NextResponse.json(
      {
        success: true,
        records: result.records,
        total: result.total,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof HistoryProcessingError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: 400 }
      );
    }

    console.error("CMS History List Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load import history.",
        code: "HISTORY_LIST_FAILED",
      },
      { status: 500 }
    );
  }
}

/**
 * Delete one or many import history sessions by jobId.
 * Body: { jobId } or { jobIds: string[] }
 * Never accepts filesystem paths — server resolves artifacts from jobId.
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireCmsAuth(request, "ADMIN");
  } catch (error) {
    const authResponse = cmsAuthErrorResponse(error);
    if (authResponse) return authResponse;
    throw error;
  }

  try {
    const body = (await request.json()) as {
      jobId?: string;
      jobIds?: string[];
      path?: string;
    };

    // Reject any client-supplied filesystem path.
    if (body.path != null) {
      return NextResponse.json(
        {
          success: false,
          error: "Arbitrary path deletion is not allowed. Send jobId only.",
          code: "PATH_NOT_ALLOWED",
        },
        { status: 400 }
      );
    }

    if (Array.isArray(body.jobIds) && body.jobIds.length > 0) {
      const bulk = await deleteImportHistoryBulk(body.jobIds);
      return NextResponse.json(
        {
          success: bulk.errors.length === 0,
          deleted: bulk.results,
          errors: bulk.errors,
          contentPreserved: true,
        },
        { status: bulk.errors.length === 0 ? 200 : 207 }
      );
    }

    const jobId = body.jobId?.trim();
    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: "jobId is required.",
          code: "JOB_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    const result = await deleteImportHistory(jobId);
    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof HistoryDeleteError) {
      const status =
        error.code === "JOB_NOT_FOUND"
          ? 404
          : error.code === "DELETE_BLOCKED_RUNNING"
            ? 409
            : 400;
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status }
      );
    }

    console.error("CMS History Delete Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete import history.",
        code: "HISTORY_DELETE_FAILED",
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
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
