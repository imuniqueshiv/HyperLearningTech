"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  ExamSession,
  ImportJobRecord,
  JobType,
  UploadApiResult,
} from "@/lib/content-pipeline";
import {
  ACCEPTED_UPLOAD_EXTENSIONS,
  formatFileSize,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface ContentUploadProps {
  onJobsCreated?: (jobs: ImportJobRecord[]) => void;
}

const ACCEPT = ACCEPTED_UPLOAD_EXTENSIONS.join(",");

const CONTENT_TYPES: { value: JobType; label: string }[] = [
  { value: "pyq", label: "PYQ" },
  { value: "syllabus", label: "Syllabus" },
  { value: "diagram", label: "Diagram" },
];

const EXAM_SESSIONS: ExamSession[] = ["June", "November", "December"];

function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

/**
 * Groups selected files into Import Sessions:
 * - each PDF → its own session
 * - consecutive images → one multi-page session
 */
function groupIntoSessions(files: File[]): File[][] {
  const sessions: File[][] = [];
  let imageBatch: File[] = [];

  for (const file of files) {
    if (isPdf(file)) {
      if (imageBatch.length > 0) {
        sessions.push(imageBatch);
        imageBatch = [];
      }
      sessions.push([file]);
    } else {
      imageBatch.push(file);
    }
  }

  if (imageBatch.length > 0) {
    sessions.push(imageBatch);
  }

  return sessions;
}

export function ContentUpload({ onJobsCreated }: ContentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [contentType, setContentType] = useState<JobType>("pyq");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [year, setYear] = useState("");
  const [examSession, setExamSession] = useState<ExamSession | "">("");
  const [uploadMode, setUploadMode] = useState<"normal_pdf" | "images">(
    "normal_pdf"
  );
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ImportJobRecord[]>([]);

  const sessions = useMemo(() => groupIntoSessions(files), [files]);
  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  );

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Array.from(event.target.files ?? []);
    event.target.value = "";
    setFiles(next);
    setError(null);
    setCreated([]);
  }

  async function handleUpload() {
    if (files.length === 0) {
      setError("Choose at least one file.");
      return;
    }

    setLoading(true);
    setError(null);
    const jobs: ImportJobRecord[] = [];
    const failures: string[] = [];

    try {
      for (const sessionFiles of sessions) {
        const formData = new FormData();
        for (const file of sessionFiles) {
          formData.append("files", file);
        }
        formData.append("type", contentType);
        formData.append("autoPipeline", "true");
        const sessionIsPdf = sessionFiles.every(isPdf);
        const mode = sessionIsPdf ? uploadMode : "images";
        formData.append("uploadMode", mode);
        formData.append("paperCount", "1");
        if (branch.trim()) formData.append("branch", branch.trim());
        if (semester.trim()) formData.append("semester", semester.trim());
        if (subjectCode.trim()) {
          formData.append("subjectCode", subjectCode.trim());
        }
        if (contentType === "pyq") {
          if (year.trim()) formData.append("year", year.trim());
          if (examSession) formData.append("examSession", examSession);
        }

        const response = await fetch(API_ENDPOINTS.CMS_UPLOAD, {
          method: "POST",
          body: formData,
        });
        const data = (await response.json()) as UploadApiResult & {
          pipelineStarted?: boolean;
        };

        if (!response.ok || !data.success) {
          const label =
            sessionFiles.length === 1
              ? sessionFiles[0].name
              : `${sessionFiles.length} images`;
          failures.push(
            `${label}: ${!data.success && data.error ? data.error : "Upload failed."}`
          );
          continue;
        }

        jobs.push(data.job);
      }

      setCreated(jobs);
      if (jobs.length > 0) {
        onJobsCreated?.(jobs);
        setFiles([]);
      }
      if (failures.length > 0) {
        setError(failures.join(" "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="uploads"
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">New Import</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One PDF (≤5 pages) or 1–5 page images become one Import Session for
          exactly one academic paper. Merged multi-paper PDFs are not supported
          — split them first. Processing stays in staging until review;
          production content is not auto-published.
        </p>
      </div>

      <fieldset className="mb-5">
        <legend className="text-xs font-medium text-muted-foreground">
          Upload Mode
        </legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {(
            [
              ["normal_pdf", "PDF (≤5 pages, 1 paper)"],
              ["images", "Images (1–5 pages, 1 paper)"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="inline-flex items-center gap-2 text-sm text-foreground"
            >
              <input
                type="radio"
                name="upload-mode"
                value={value}
                checked={uploadMode === value}
                onChange={() => setUploadMode(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-5">
        <legend className="text-xs font-medium text-muted-foreground">
          Content Type
        </legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {CONTENT_TYPES.map((option) => (
            <label
              key={option.value}
              className="inline-flex items-center gap-2 text-sm text-foreground"
            >
              <input
                type="radio"
                name="content-type"
                value={option.value}
                checked={contentType === option.value}
                onChange={() => setContentType(option.value)}
                className="accent-blue-600"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-medium text-muted-foreground">
          Branch
          <input
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
            placeholder="Auto (from document)"
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Semester
          <input
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
            placeholder="Auto (semester-4)"
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Subject Code
          <input
            value={subjectCode}
            onChange={(event) => setSubjectCode(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
            placeholder="Auto (AL-402)"
          />
        </label>
      </div>

      {contentType === "pyq" && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Year
            <input
              type="number"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
              placeholder="2025"
            />
          </label>
          <fieldset>
            <legend className="text-xs font-medium text-muted-foreground">
              Exam Session
            </legend>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="exam-session"
                  value=""
                  checked={examSession === ""}
                  onChange={() => setExamSession("")}
                  className="accent-blue-600"
                />
                Auto
              </label>
              {EXAM_SESSIONS.map((session) => (
                <label
                  key={session}
                  className="inline-flex items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name="exam-session"
                    value={session}
                    checked={examSession === session}
                    onChange={() => setExamSession(session)}
                    className="accent-blue-600"
                  />
                  {session}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={onFileChange}
        disabled={loading}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          Choose Files
        </button>
        <button
          type="button"
          disabled={loading || files.length === 0}
          onClick={() => void handleUpload()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting import…
            </>
          ) : (
            "Import"
          )}
        </button>
        <p className="text-xs text-muted-foreground">
          PDF, PNG, JPG, JPEG, WEBP, TIFF · images = pages of one paper
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">
            {sessions.length} Import Session
            {sessions.length === 1 ? "" : "s"} · {files.length} file
            {files.length === 1 ? "" : "s"} · {formatFileSize(totalSize)}
          </p>
          <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-xs text-muted-foreground">
            {sessions.map((session, index) => (
              <li key={`session-${index}`}>
                Session {index + 1}:{" "}
                {session.length === 1
                  ? session[0].name
                  : `${session.length} pages (${session.map((f) => f.name).join(", ")})`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {created.length > 0 && (
        <div
          className={cn(
            "mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm"
          )}
        >
          <p className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {created.length} import{created.length === 1 ? "" : "s"} started
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Processing runs in the background. Watch Running Imports below.
          </p>
        </div>
      )}
    </section>
  );
}
