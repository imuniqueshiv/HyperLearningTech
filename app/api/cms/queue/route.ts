import { NextRequest, NextResponse } from "next/server";

// Import the queue module directly — `@/lib/content-pipeline/server` is a fat
// barrel that pulls OCR/CMS writers into NFT tracing and triggers Turbopack
// "unexpected file in NFT list" warnings during `next build`.
import { listJobs } from "@/lib/content-pipeline/import-queue";

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
    const jobs = await listJobs();

    // Newest uploads first for the admin dashboard.
    const ordered = [...jobs].reverse();

    return NextResponse.json(
      {
        success: true,
        jobs: ordered,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CMS Queue List Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load import queue.",
        code: "QUEUE_LIST_FAILED",
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
    {
      success: false,
      error: "Method not allowed",
    },
    { status: 405 }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
