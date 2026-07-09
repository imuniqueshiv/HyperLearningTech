import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { resolveAttachmentFilesystemPath } from "@/lib/content/attachment-path";

const MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

interface RouteContext {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
    path: string[];
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const {
    branch,
    semester,
    subject,
    path: pathSegments,
  } = await context.params;
  const attachmentPath = pathSegments.map(decodeURIComponent).join("/");

  const filePath = resolveAttachmentFilesystemPath({
    branch,
    semester,
    subject,
    attachmentPath,
  });

  if (!filePath) {
    console.warn(
      `[attachments] Invalid attachment path requested: ${branch}/${semester}/${subject}/${attachmentPath}`
    );
    return NextResponse.json(
      { error: "Invalid attachment path" },
      { status: 400 }
    );
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] ?? "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.warn(
      `[attachments] File not found: ${branch}/${semester}/${subject}/${attachmentPath}`,
      error
    );
    return NextResponse.json(
      { error: "Attachment not found" },
      { status: 404 }
    );
  }
}
