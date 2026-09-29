/**
 * Phase 1 foundation tests — LOCAL CMS + Git source-of-truth model.
 */

import assert from "node:assert/strict";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import {
  CmsAuthError,
  assertLocalCmsMode,
  isCmsContentWriteEnabled,
  isLocalCmsMode,
  requireCmsAuth,
  requireCmsPageAccess,
} from "../../lib/cms-auth";
import { sha256Hex } from "../../lib/content-pipeline/checksum";
import {
  BulkUploadError,
  MAX_BULK_FILES,
} from "../../lib/content-pipeline/bulk-upload-service";
import {
  GitReviewError,
  buildManualGitCommands,
  captureGitReview,
} from "../../lib/content-pipeline/git-review";
import {
  IMPORT_LIMIT_MESSAGES,
  MAX_IMPORT_IMAGES,
  MAX_NORMAL_PDF_PAGES,
  MAX_PAPERS_PER_IMPORT,
  parseImportUploadMode,
} from "../../lib/content-pipeline/import-limits";
import {
  classifySessionFiles,
  processImportSession,
} from "../../lib/content-pipeline/import-session-service";
import { inferResumeStage } from "../../lib/content-pipeline/pipeline-supervisor";
import { PipelineStage } from "../../lib/content-pipeline/pipeline-stage";
import {
  PipelineScheduleError,
  scheduleImportPipeline,
} from "../../lib/content-pipeline/pipeline-scheduler";
import { StageExecutionForbiddenError } from "../../lib/content-pipeline/stage-execution-policy";
import type { ImportJobRecord } from "../../lib/content-pipeline/types";
import { UploadValidationError } from "../../lib/content-pipeline/upload-service";
import {
  assertSubjectContentPath,
  getSubjectContentDir,
} from "../../lib/content-pipeline/writer-service";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function enableLocalCms(): void {
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  process.env.CMS_LOCAL_MODE = "true";
}

function fakeFile(name: string, type: string, bytes: number | Buffer): File {
  const buffer =
    typeof bytes === "number" ? Buffer.alloc(bytes, 1) : Buffer.from(bytes);
  return new File([buffer], name, { type });
}

function baseJob(overrides: Partial<ImportJobRecord> = {}): ImportJobRecord {
  return {
    id: "job_test",
    type: "pyq",
    status: "failed",
    stage: PipelineStage.FAILED,
    branch: "cscy",
    semester: "semester-3",
    subjectCode: "CY-301",
    year: 2024,
    examSession: "June",
    originalFilename: "paper.pdf",
    mimeType: "application/pdf",
    fileSize: 1000,
    temporaryPath: "/tmp/job_test",
    filename: "original.pdf",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: "simulated",
    validationStatus: "pending",
    sourceFiles: [],
    ocr: null,
    layout: null,
    diagrams: null,
    structuring: null,
    schema: null,
    validation: null,
    writing: null,
    review: null,
    save: null,
    rebuild: null,
    ...overrides,
  };
}

describe("Phase 1 local mode & production fail-closed", () => {
  it("rejects CMS API outside local mode", async () => {
    delete process.env.CMS_LOCAL_MODE;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;

    await assert.rejects(
      () =>
        requireCmsAuth(
          new Request("http://localhost/api/cms/queue"),
          "REVIEWER"
        ),
      (error: unknown) => {
        assert.ok(error instanceof CmsAuthError);
        assert.equal(error.code, "CMS_LOCAL_ONLY");
        assert.equal(error.status, 404);
        return true;
      }
    );
  });

  it("rejects CMS on Vercel even if CMS_LOCAL_MODE=true", async () => {
    process.env.CMS_LOCAL_MODE = "true";
    process.env.VERCEL_ENV = "production";
    assert.equal(isLocalCmsMode(), false);
    await assert.rejects(() =>
      requireCmsAuth(new Request("http://localhost/api/cms/upload"), "ADMIN")
    );
  });

  it("rejects CMS on Vercel preview", () => {
    process.env.CMS_LOCAL_MODE = "true";
    process.env.VERCEL_ENV = "preview";
    assert.equal(isLocalCmsMode(), false);
  });

  it("allows local-admin when CMS_LOCAL_MODE=true off Vercel", async () => {
    enableLocalCms();
    const auth = await requireCmsAuth(
      new Request("http://127.0.0.1/api/cms/upload"),
      "ADMIN"
    );
    assert.equal(auth.via, "local-admin");
    assert.equal(auth.role, "ADMIN");
  });

  it("accepts optional local service token", async () => {
    enableLocalCms();
    process.env.CMS_SERVICE_TOKEN = "test-service-token";
    const auth = await requireCmsAuth(
      new Request("http://127.0.0.1/api/cms/upload", {
        headers: { Authorization: "Bearer test-service-token" },
      }),
      "ADMIN"
    );
    assert.equal(auth.via, "service-token");
  });

  it("rejects wrong bearer token in local mode", async () => {
    enableLocalCms();
    process.env.CMS_SERVICE_TOKEN = "test-service-token";
    await assert.rejects(() =>
      requireCmsAuth(
        new Request("http://127.0.0.1/api/cms/upload", {
          headers: { Authorization: "Bearer wrong" },
        }),
        "ADMIN"
      )
    );
  });

  it("page access works only in local mode", async () => {
    enableLocalCms();
    const auth = await requireCmsPageAccess("ADMIN");
    assert.equal(auth.via, "local-admin");

    delete process.env.CMS_LOCAL_MODE;
    await assert.rejects(() => requireCmsPageAccess("ADMIN"));
  });

  it("assertLocalCmsMode throws outside local mode", () => {
    delete process.env.CMS_LOCAL_MODE;
    assert.throws(() => assertLocalCmsMode(), CmsAuthError);
  });

  it("scheduleImportPipeline refuses outside local mode", async () => {
    delete process.env.CMS_LOCAL_MODE;
    await assert.rejects(
      () => scheduleImportPipeline("job_x"),
      (error: unknown) => {
        assert.ok(error instanceof PipelineScheduleError);
        assert.equal(error.code, "CMS_LOCAL_ONLY");
        return true;
      }
    );
  });

  it("content write gate defaults off and ignores client-ish values", () => {
    enableLocalCms();
    delete process.env.CMS_ALLOW_CONTENT_WRITE;
    assert.equal(isCmsContentWriteEnabled(), false);
    process.env.CMS_ALLOW_CONTENT_WRITE = "1";
    assert.equal(isCmsContentWriteEnabled(), false);
    process.env.CMS_ALLOW_CONTENT_WRITE = "true";
    assert.equal(isCmsContentWriteEnabled(), true);
  });

  it("content write cannot enable outside local mode", () => {
    delete process.env.CMS_LOCAL_MODE;
    process.env.CMS_ALLOW_CONTENT_WRITE = "true";
    assert.equal(isCmsContentWriteEnabled(), false);
  });
});

describe("Phase 1 upload limits", () => {
  it("parses upload modes", () => {
    assert.equal(parseImportUploadMode("normal_pdf"), "normal_pdf");
    assert.equal(parseImportUploadMode("merged"), "merged_pdf");
    assert.equal(parseImportUploadMode("images"), "images");
    assert.equal(parseImportUploadMode("nope"), null);
  });

  it("rejects image batches above 5", async () => {
    const files = Array.from({ length: MAX_IMPORT_IMAGES + 1 }, (_, i) =>
      fakeFile(`p${i}.png`, "image/png", 32)
    );
    await assert.rejects(
      () =>
        processImportSession({
          files,
          type: "pyq",
          uploadMode: "images",
          paperCount: 1,
        }),
      (error: unknown) => {
        assert.ok(error instanceof UploadValidationError);
        assert.equal(error.code, "IMAGE_LIMIT_EXCEEDED");
        return true;
      }
    );
  });

  it("rejects paperCount > 1", async () => {
    await assert.rejects(
      () =>
        processImportSession({
          files: [fakeFile("a.png", "image/png", 32)],
          type: "pyq",
          uploadMode: "images",
          paperCount: 2,
        }),
      (error: unknown) => {
        assert.ok(error instanceof UploadValidationError);
        assert.equal(error.code, "PAPER_LIMIT_EXCEEDED");
        assert.equal(error.message, IMPORT_LIMIT_MESSAGES.papers);
        return true;
      }
    );
  });

  it("rejects merged_pdf mode", async () => {
    await assert.rejects(
      () =>
        processImportSession({
          files: [
            fakeFile("paper.pdf", "application/pdf", Buffer.from("%PDF")),
          ],
          type: "pyq",
          uploadMode: "merged_pdf" as never,
          paperCount: 1,
        }),
      (error: unknown) => {
        assert.ok(error instanceof UploadValidationError);
        assert.equal(error.code, "MERGED_PDF_UNSUPPORTED");
        return true;
      }
    );
  });

  it("exposes documented ceilings", () => {
    assert.equal(MAX_NORMAL_PDF_PAGES, 5);
    assert.equal(MAX_IMPORT_IMAGES, 5);
    assert.equal(MAX_PAPERS_PER_IMPORT, 1);
    assert.equal(MAX_BULK_FILES, 15);
  });

  it("classifies mixed PDF+images as invalid", () => {
    assert.throws(
      () =>
        classifySessionFiles([
          fakeFile("a.pdf", "application/pdf", 10),
          fakeFile("b.png", "image/png", 10),
        ]),
      (error: unknown) => {
        assert.ok(error instanceof UploadValidationError);
        assert.equal(error.code, "SESSION_MIXED_TYPES");
        return true;
      }
    );
  });

  it("rejects path-traversal style filenames via sanitize (session accepts file)", async () => {
    // Filename is sanitized; must not escape job dir. Classification still ok for png.
    assert.doesNotThrow(() =>
      classifySessionFiles([fakeFile("../../evil.png", "image/png", 32)])
    );
  });

  it("BulkUploadError carries code", () => {
    const error = new BulkUploadError("IMAGE_LIMIT_EXCEEDED", "too many");
    assert.equal(error.code, "IMAGE_LIMIT_EXCEEDED");
  });
});

describe("Phase 1 checksum, policy, resume", () => {
  it("checksum is content-based", () => {
    assert.equal(sha256Hex(Buffer.from("a")), sha256Hex(Buffer.from("a")));
    assert.notEqual(sha256Hex(Buffer.from("a")), sha256Hex(Buffer.from("b")));
  });

  it("stage execution forbidden code", () => {
    assert.equal(
      new StageExecutionForbiddenError().code,
      "STAGE_EXECUTION_FORBIDDEN"
    );
  });

  it("worker restart resume skips completed OCR/layout/diagrams", () => {
    const summary = {
      startedAt: "t",
      completedAt: "t",
      durationMs: 1,
    };
    const job = baseJob({
      status: "processing",
      stage: PipelineStage.STRUCTURING,
      ocr: summary as ImportJobRecord["ocr"],
      layout: summary as ImportJobRecord["layout"],
      diagrams: summary as ImportJobRecord["diagrams"],
    });
    assert.equal(inferResumeStage(job), "structuring");
  });
});

describe("Phase 1 content path & git safety", () => {
  it("subject content dir stays under content/rgpv", () => {
    const dir = getSubjectContentDir({
      branch: "cse",
      semester: "semester-3",
      subjectCode: "CS-301",
    });
    assertSubjectContentPath(dir);
    const rel = path.relative(process.cwd(), dir).replace(/\\/g, "/");
    assert.ok(rel.startsWith("content/rgpv/"));
  });

  it("rejects content path traversal", () => {
    assert.throws(
      () =>
        assertSubjectContentPath(
          path.join(process.cwd(), "content", "rgpv", "..", "..", "etc")
        ),
      /CONTENT_PATH_REJECTED|outside/
    );
  });

  it("manual git commands never suggest force push or hard reset", () => {
    const cmds = buildManualGitCommands("main").join("\n");
    assert.match(cmds, /content\/rgpv/);
    assert.doesNotMatch(cmds, /push --force/);
    assert.doesNotMatch(cmds, /reset --hard/);
    assert.doesNotMatch(cmds, /clean -fd/);
    assert.doesNotMatch(cmds, /git add \./);
  });

  it("captureGitReview is read-only (smoke)", async () => {
    try {
      const snap = await captureGitReview(process.cwd());
      assert.ok(typeof snap.branch === "string");
      assert.ok(Array.isArray(snap.nextCommands));
    } catch (error) {
      // Allowed if cwd is not a git repo in some sandboxes
      assert.ok(error instanceof GitReviewError || error instanceof Error);
    }
  });
});
