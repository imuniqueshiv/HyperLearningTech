import { NextRequest, NextResponse } from "next/server";

import type { HistoryListFilters } from "@/lib/content-pipeline";
import {
  HistoryProcessingError,
  listImportHistory,
} from "@/lib/content-pipeline/server";
import type { ImportStatus, JobType } from "@/lib/content-pipeline";

export async function GET(request: NextRequest) {
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

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
