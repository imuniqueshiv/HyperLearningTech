"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  ImportJobRecord,
  JobType,
  UploadApiResult,
} from "@/lib/content-pipeline";
import {
  ACCEPTED_UPLOAD_EXTENSIONS,
  JOB_TYPE_LABELS,
  formatFileSize,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

type UploadAccent = "blue" | "indigo" | "emerald" | "amber";

export interface UploadTargetFields {
  branch: string;
  semester: string;
  subjectCode: string;
}

interface UploadCardProps {
  type: JobType;
  description: string;
  icon: LucideIcon;
  accent?: UploadAccent;
  target?: UploadTargetFields;
  onUploadSuccess?: (job: ImportJobRecord) => void;
}

const ACCENT_STYLES: Record<
  UploadAccent,
  { icon: string; button: string; border: string }
> = {
  blue: {
    icon: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    button:
      "border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
    border: "hover:border-blue-500/30",
  },
  indigo: {
    icon: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    button:
      "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400",
    border: "hover:border-indigo-500/30",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    button:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400",
    border: "hover:border-emerald-500/30",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    button:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400",
    border: "hover:border-amber-500/30",
  },
};

const ACCEPT_ATTRIBUTE = ACCEPTED_UPLOAD_EXTENSIONS.join(",");

export function UploadCard({
  type,
  description,
  icon: Icon,
  accent = "blue",
  target,
  onUploadSuccess,
}: UploadCardProps) {
  const styles = ACCENT_STYLES[accent];
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastJob, setLastJob] = useState<ImportJobRecord | null>(null);

  function openFilePicker() {
    setError(null);
    inputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setLoading(true);
    setError(null);
    setLastJob(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      if (target?.branch.trim()) {
        formData.append("branch", target.branch.trim());
      }
      if (target?.semester.trim()) {
        formData.append("semester", target.semester.trim());
      }
      if (target?.subjectCode.trim()) {
        formData.append("subjectCode", target.subjectCode.trim());
      }

      const response = await fetch(API_ENDPOINTS.CMS_UPLOAD, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as UploadApiResult;

      if (!response.ok || !data.success) {
        const message =
          !data.success && data.error
            ? data.error
            : "Upload failed. Please try again.";
        throw new Error(message);
      }

      setLastJob(data.job);
      onUploadSuccess?.(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-colors",
        styles.border
      )}
    >
      <div>
        <div
          className={cn(
            "mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border",
            styles.icon
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Upload {JOB_TYPE_LABELS[type]}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ACCEPT_ATTRIBUTE}
        onChange={handleFileChange}
        disabled={loading}
        aria-label={`Upload ${JOB_TYPE_LABELS[type]} file`}
      />

      <button
        type="button"
        onClick={openFilePicker}
        disabled={loading}
        className={cn(
          "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          styles.button
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Choose file
          </>
        )}
      </button>

      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {lastJob && (
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <p className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Upload successful · queued
          </p>
          <dl className="mt-2 space-y-1 text-emerald-900/80 dark:text-emerald-200/80">
            <div className="flex justify-between gap-2">
              <dt>Job ID</dt>
              <dd className="truncate font-mono">{lastJob.id}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>File</dt>
              <dd className="truncate">{lastJob.originalFilename}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Type</dt>
              <dd>{lastJob.mimeType}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Size</dt>
              <dd>{formatFileSize(lastJob.fileSize)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Status</dt>
              <dd>{lastJob.status}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
