import fs from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { CMS_JOB_DIAGRAMS_DIR } from "@/lib/content-pipeline";
import {
  getJobDirectory,
  readJobMetadata,
  readPipelineState,
} from "@/lib/content-pipeline/server";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

/**
 * Returns diagram extraction summary for a job.
 * Pass ?path=diagrams/... to stream a WEBP preview from the job workspace.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const metadata = await readJobMetadata(jobId);

    if (!metadata) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found.",
          code: "JOB_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const assetPath = request.nextUrl.searchParams.get("path");

    if (assetPath) {
      return serveDiagramAsset(jobId, assetPath);
    }

    const pipeline = await readPipelineState(jobId);
    const summary = pipeline?.diagrams ?? null;

    if (!summary) {
      return NextResponse.json(
        {
          success: false,
          error: "Diagram summary not found for this job.",
          code: "DIAGRAMS_MISSING",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        summary: {
          ...summary,
          diagrams: summary.diagrams.map((diagram) => ({
            ...diagram,
            previewUrl: `/api/cms/diagrams/${encodeURIComponent(jobId)}?path=${encodeURIComponent(diagram.path)}`,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CMS Diagrams Result Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load diagram results.",
        code: "DIAGRAMS_RESULT_FAILED",
      },
      { status: 500 }
    );
  }
}

async function serveDiagramAsset(jobId: string, relativePath: string) {
  const normalized = relativePath.replace(/\\/g, "/");

  if (
    normalized.includes("..") ||
    !normalized.startsWith(`${CMS_JOB_DIAGRAMS_DIR}/`) ||
    !normalized.toLowerCase().endsWith(".webp")
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid diagram path.",
        code: "INVALID_DIAGRAM_PATH",
      },
      { status: 400 }
    );
  }

  const absolutePath = path.join(getJobDirectory(jobId), normalized);

  try {
    const buffer = await fs.readFile(absolutePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Diagram file not found.",
        code: "DIAGRAM_FILE_MISSING",
      },
      { status: 404 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
