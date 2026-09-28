import { NextRequest, NextResponse } from "next/server";

import { listJobs } from "@/lib/content-pipeline/server";

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
