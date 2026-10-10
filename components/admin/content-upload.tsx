"use client";

import {
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  ExamSession,
  ImportJobRecord,
  JobType,
  UploadApiResult,
} from "@/lib/content-pipeline";
import {
  ACCEPTED_UPLOAD_EXTENSIONS,
  IMPORT_LIMIT_MESSAGES,
  MAX_IMPORT_IMAGES,
  formatFileSize,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface ContentUploadProps {
  onJobsCreated?: (jobs: ImportJobRecord[]) => void;
}

const ACCEPT = ACCEPTED_UPLOAD_EXTENSIONS.join(",");
const EXAM_SESSIONS: ExamSession[] = ["June", "November", "December"];

const ACCEPTED_EXT = new Set(
  ACCEPTED_UPLOAD_EXTENSIONS.map((ext) => ext.toLowerCase())
);

function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function isImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".tif") ||
    lower.endsWith(".tiff")
  );
}

function extensionOf(file: File): string {
  const name = file.name.toLowerCase();
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx) : "";
}

function isAcceptedFile(file: File): boolean {
  if (isPdf(file) || isImage(file)) return true;
  return ACCEPTED_EXT.has(extensionOf(file));
}

/**
 * Client-side selection validation (limits match server import-limits).
 * Returns an error message or null when valid.
 */
export function validateSelectedFiles(files: File[]): string | null {
  if (files.length === 0) {
    return "Choose at least one file.";
  }

  for (const file of files) {
    if (!isAcceptedFile(file)) {
      return "Unsupported file type. Use PDF, PNG, JPG, JPEG, WEBP, or TIFF.";
    }
  }

  const pdfs = files.filter(isPdf);
  const images = files.filter((f) => !isPdf(f));

  if (pdfs.length > 0 && images.length > 0) {
    return "Please upload exactly one academic paper (one PDF, or 1–5 images — not both).";
  }

  if (pdfs.length > 1) {
    return "Please upload exactly one academic paper. Select a single PDF.";
  }

  if (images.length > MAX_IMPORT_IMAGES) {
    return IMPORT_LIMIT_MESSAGES.images;
  }

  return null;
}

/**
 * Normalize picker/drop selection into the files that should be kept.
 * PDF mode: keep a single PDF (last selected PDF wins when replacing).
 * Image mode: keep up to MAX_IMPORT_IMAGES images.
 */
export function normalizeSelectedFiles(incoming: File[]): {
  files: File[];
  error: string | null;
} {
  if (incoming.length === 0) {
    return { files: [], error: null };
  }

  const unsupported = incoming.find((f) => !isAcceptedFile(f));
  if (unsupported) {
    return {
      files: [],
      error: "Unsupported file type. Use PDF, PNG, JPG, JPEG, WEBP, or TIFF.",
    };
  }

  const pdfs = incoming.filter(isPdf);
  const images = incoming.filter((f) => !isPdf(f));

  if (pdfs.length > 0 && images.length > 0) {
    return {
      files: [],
      error:
        "Please upload exactly one academic paper (one PDF, or 1–5 images — not both).",
    };
  }

  if (pdfs.length > 0) {
    // One PDF only — intentional replace keeps the last PDF in the list.
    return { files: [pdfs[pdfs.length - 1]], error: null };
  }

  if (images.length > MAX_IMPORT_IMAGES) {
    return {
      files: [],
      error: IMPORT_LIMIT_MESSAGES.images,
    };
  }

  return { files: images, error: null };
}

export function ContentUpload({ onJobsCreated }: ContentUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [contentType, setContentType] = useState<JobType>("pyq");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [year, setYear] = useState("");
  const [examSession, setExamSession] = useState<ExamSession | "">("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ImportJobRecord[]>([]);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  );
  const modeIsPdf = files.length > 0 && files.every(isPdf);
  const canProcess = files.length > 0 && !error && !loading;

  /** Shared path for file picker + drag/drop. */
  function handleFiles(list: FileList | File[]) {
    // Snapshot immediately — FileList is live and cleared if the input value is reset.
    const incoming = Array.from(list);
    const { files: next, error: validationError } =
      normalizeSelectedFiles(incoming);

    if (validationError) {
      setFiles([]);
      setError(validationError);
      setCreated([]);
      return;
    }

    setFiles(next);
    setError(null);
    setCreated([]);
  }

  function clearSelection() {
    setFiles([]);
    setError(null);
    setCreated([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removeFileAt(index: number) {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    setError(null);
    setCreated([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    // Copy FileList to a stable array BEFORE resetting the input.
    // Resetting value clears the live FileList in Chromium/WebKit.
    const snapshot = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (snapshot.length === 0) return;
    handleFiles(snapshot);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (event.dataTransfer.files?.length) {
      handleFiles(event.dataTransfer.files);
    }
  }

  async function handleUpload() {
    const validationError = validateSelectedFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    const jobs: ImportJobRecord[] = [];

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      formData.append("type", contentType);
      formData.append("autoPipeline", "true");
      const sessionIsPdf = files.every(isPdf);
      formData.append("uploadMode", sessionIsPdf ? "normal_pdf" : "images");
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
      const data = (await response.json()) as UploadApiResult;

      if (!response.ok || !data.success) {
        const message =
          !data.success && data.error ? data.error : "Upload failed.";
        // Surface server PDF page-limit / one-paper errors clearly.
        setError(message);
        return;
      }

      jobs.push(data.job);
      setCreated(jobs);
      onJobsCreated?.(jobs);
      setFiles([]);
      if (inputRef.current) {
        inputRef.current.value = "";
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
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Import RGPV Question Paper
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One academic paper per import · PDF ≤5 pages · Images ≤5 pages
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition",
          dragOver
            ? "border-blue-500 bg-blue-500/5"
            : "border-border bg-muted/20"
        )}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">
          Drag & drop PDF or images here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, PNG, JPG, JPEG, WEBP, TIFF
        </p>
        <label
          htmlFor={inputId}
          className={cn(
            "mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted",
            loading && "pointer-events-none opacity-60"
          )}
        >
          Choose Files
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={onFileChange}
          disabled={loading}
          aria-label="Choose PDF or image files for import"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {modeIsPdf ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Selected Paper
                  </p>
                  <div className="mt-2 flex items-start gap-2">
                    <FileText
                      className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {files[0].name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatFileSize(files[0].size)} · PDF
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Selected Pages ({files.length})
                  </p>
                  <ul className="mt-2 space-y-2">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <ImageIcon
                            className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                            aria-hidden
                          />
                          <span className="truncate font-medium text-foreground">
                            {index + 1}. {file.name}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => removeFileAt(index)}
                          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-500/10 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatFileSize(totalSize)} total · Images
                  </p>
                </>
              )}
            </div>
            {modeIsPdf && (
              <button
                type="button"
                disabled={loading}
                onClick={clearSelection}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60"
              >
                <X className="h-3 w-3" aria-hidden />
                Remove
              </button>
            )}
          </div>
          {!modeIsPdf && files.length > 0 && (
            <button
              type="button"
              disabled={loading}
              onClick={clearSelection}
              className="mt-3 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
            >
              Remove all
            </button>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field
          label="Branch"
          value={branch}
          onChange={setBranch}
          placeholder="Auto"
        />
        <Field
          label="Semester"
          value={semester}
          onChange={setSemester}
          placeholder="Auto"
        />
        <Field
          label="Subject"
          value={subjectCode}
          onChange={setSubjectCode}
          placeholder="Auto"
        />
        <Field
          label="Year"
          value={year}
          onChange={setYear}
          placeholder="Auto"
        />
        <label className="block text-xs font-medium text-muted-foreground">
          Exam Session
          <select
            value={examSession}
            onChange={(e) =>
              setExamSession((e.target.value || "") as ExamSession | "")
            }
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Auto</option>
            {EXAM_SESSIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canProcess}
          onClick={() => void handleUpload()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Processing…
            </>
          ) : (
            "Process Paper"
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {showAdvanced ? "Hide advanced" : "Advanced / other content"}
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-4 rounded-xl border border-border px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Content type
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            {(
              [
                ["pyq", "PYQ Paper"],
                ["syllabus", "Syllabus"],
                ["diagram", "Diagram"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="inline-flex items-center gap-2 text-sm text-foreground"
              >
                <input
                  type="radio"
                  name="content-type"
                  checked={contentType === value}
                  onChange={() => setContentType(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {created.length > 0 && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Import started — watch Processing below
          </p>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
        placeholder={placeholder}
      />
    </label>
  );
}
