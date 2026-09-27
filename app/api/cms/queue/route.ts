import { NextResponse } from "next/server";

import { listJobs } from "@/lib/content-pipeline/server";

export async function GET() {
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

export async function POST() {
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
