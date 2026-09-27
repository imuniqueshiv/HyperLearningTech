"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { DiffViewer } from "@/components/admin/diff-viewer";
import { FilePreview } from "@/components/admin/file-preview";
import { ReviewSummary } from "@/components/admin/review-summary";
import { ReviewToolbar } from "@/components/admin/review-toolbar";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  GitReviewSnapshot,
  ImportJobRecord,
  ReviewApiResult,
  ReviewPackage,
  SaveApiResult,
  GitReviewApiResult,
} from "@/lib/content-pipeline";
import { PipelineStage } from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface ReviewCenterProps {
  jobs: ImportJobRecord[];
  onJobUpdated?: (job: ImportJobRecord) => void;
  onRefresh?: () => void;
}

type TabId =
  | "summary"
  | "diff"
  | "preview"
  | "validation"
  | "write"
  | "manifest"
  | "save"
  | "git";

export function ReviewCenter({
  jobs,
  onJobUpdated,
  onRefresh,
}: ReviewCenterProps) {
  const reviewableJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.stage === PipelineStage.WRITTEN ||
          job.stage === PipelineStage.REBUILT ||
          job.stage === PipelineStage.UNDER_REVIEW ||
          job.stage === PipelineStage.APPROVED ||
          job.stage === PipelineStage.LOCAL_SAVED ||
          job.stage === PipelineStage.DIAGRAMS_WRITTEN
      ),
    [jobs]
  );

  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [reviewPackage, setReviewPackage] = useState<ReviewPackage | null>(
    null
  );
  const [gitSnapshot, setGitSnapshot] = useState<GitReviewSnapshot | null>(
    null
  );
  const [note, setNote] = useState("");
  const [editPyqsText, setEditPyqsText] = useState("");
  const [editSyllabusText, setEditSyllabusText] = useState("");
  const [tab, setTab] = useState<TabId>("summary");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedJob =
    reviewableJobs.find((job) => job.id === selectedJobId) ?? null;

  const canStart = Boolean(
    selectedJob &&
    (selectedJob.stage === PipelineStage.WRITTEN ||
      selectedJob.stage === PipelineStage.REBUILT ||
      selectedJob.stage === PipelineStage.UNDER_REVIEW ||
      selectedJob.stage === PipelineStage.APPROVED)
  );
  const canDecide = Boolean(
    selectedJob &&
    (selectedJob.stage === PipelineStage.UNDER_REVIEW ||
      selectedJob.stage === PipelineStage.WRITTEN ||
      selectedJob.stage === PipelineStage.REBUILT)
  );
  const canSave = Boolean(
    selectedJob && selectedJob.stage === PipelineStage.APPROVED
  );

  async function loadPackage(jobId: string) {
    const response = await fetch(
      `${API_ENDPOINTS.CMS_REVIEW}/${encodeURIComponent(jobId)}`
    );
    const data = (await response.json()) as {
      success: boolean;
      package?: ReviewPackage;
      error?: string;
    };
    if (!response.ok || !data.success || !data.package) {
      throw new Error(data.error ?? "Failed to load review package.");
    }
    setReviewPackage(data.package);
    setEditPyqsText(
      data.package.pendingPyqs
        ? JSON.stringify(data.package.pendingPyqs, null, 2)
        : ""
    );
    setEditSyllabusText(
      data.package.pendingSyllabus
        ? JSON.stringify(data.package.pendingSyllabus, null, 2)
        : ""
    );
  }

  async function startReview() {
    if (!selectedJobId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.CMS_REVIEW, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedJobId, action: "start" }),
      });
      const data = (await response.json()) as ReviewApiResult;
      if (!response.ok || !data.success) {
        throw new Error(
          !data.success && data.error ? data.error : "Failed to open review."
        );
      }
      if (data.package) {
        setReviewPackage(data.package);
      } else {
        await loadPackage(selectedJobId);
      }
      onJobUpdated?.(data.job);
      onRefresh?.();
      setTab("diff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open review.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: "approve" | "reject" | "request_changes") {
    if (!selectedJobId) return;
    setBusy(true);
    setError(null);
    try {
      let editedPyqs: unknown = undefined;
      let editedSyllabus: unknown = undefined;

      if (editPyqsText.trim()) {
        editedPyqs = JSON.parse(editPyqsText) as unknown;
      }
      if (editSyllabusText.trim()) {
        editedSyllabus = JSON.parse(editSyllabusText) as unknown;
      }

      const response = await fetch(API_ENDPOINTS.CMS_REVIEW, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJobId,
          action: "decide",
          decision,
          note,
          editedPyqs,
          editedSyllabus,
        }),
      });
      const data = (await response.json()) as ReviewApiResult;
      if (!response.ok || !data.success) {
        throw new Error(
          !data.success && data.error ? data.error : "Decision failed."
        );
      }
      if (data.package) {
        setReviewPackage(data.package);
      } else {
        await loadPackage(selectedJobId);
      }
      onJobUpdated?.(data.job);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision failed.");
    } finally {
      setBusy(false);
    }
  }

  async function runLocalSave() {
    if (!selectedJobId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.CMS_SAVE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedJobId }),
      });
      const data = (await response.json()) as SaveApiResult;
      if (!response.ok || !data.success) {
        throw new Error(
          !data.success && data.error ? data.error : "Local save failed."
        );
      }
      onJobUpdated?.(data.job);
      onRefresh?.();
      await loadPackage(selectedJobId);
      setTab("save");
      await refreshGit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Local save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshGit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.CMS_GIT, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as GitReviewApiResult;
      if (!response.ok || !data.success) {
        throw new Error(
          !data.success && data.error ? data.error : "Git review failed."
        );
      }
      setGitSnapshot(data.snapshot);
      setTab("git");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Git review failed.");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "validation", label: "Validation" },
    { id: "preview", label: "JSON Preview" },
    { id: "diff", label: "Diff" },
    { id: "manifest", label: "Diagrams" },
    { id: "write", label: "Write Report" },
    { id: "save", label: "Save" },
    { id: "git", label: "Git" },
  ];

  return (
    <section
      id="review"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Review</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Summary, validation, preview, diff, diagrams — then Approve and
              Local Save.
            </p>
          </div>
          {busy && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-muted-foreground">
            Job
            <select
              className="ml-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground"
              value={selectedJobId}
              onChange={(event) => {
                setSelectedJobId(event.target.value);
                setReviewPackage(null);
              }}
            >
              <option value="">Select written job…</option>
              {reviewableJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.id} · {job.subjectCode ?? "—"} · {job.stage}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ReviewToolbar
          busy={busy}
          canStart={canStart}
          canDecide={canDecide}
          canSave={canSave}
          canRefreshGit
          onStart={() => {
            void startReview();
          }}
          onApprove={() => {
            void decide("approve");
          }}
          onReject={() => {
            void decide("reject");
          }}
          onRequestChanges={() => {
            void decide("request_changes");
          }}
          onLocalSave={() => {
            void runLocalSave();
          }}
          onRefreshGit={() => {
            void refreshGit();
          }}
        />

        <div>
          <label className="text-xs text-muted-foreground">Review note</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
            placeholder="Optional note for approve / reject / request changes"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                tab === item.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "summary" && <ReviewSummary reviewPackage={reviewPackage} />}

        {tab === "diff" && reviewPackage && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">pyqs.json diff</h3>
              <DiffViewer diff={reviewPackage.pyqsDiff} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">syllabus.json diff</h3>
              <DiffViewer diff={reviewPackage.syllabusDiff} />
            </div>
          </div>
        )}

        {tab === "preview" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <FilePreview
              title="pending-pyqs.json"
              value={reviewPackage?.pendingPyqs}
            />
            <FilePreview
              title="pending-syllabus.json"
              value={reviewPackage?.pendingSyllabus}
            />
            <FilePreview
              title="production-pyqs.json"
              value={reviewPackage?.productionPyqs}
            />
            <FilePreview
              title="production-syllabus.json"
              value={reviewPackage?.productionSyllabus}
            />
            <div className="lg:col-span-2">
              <h4 className="text-xs font-medium text-foreground">
                Optional JSON edit (applied on decision)
              </h4>
              <div className="mt-2 grid gap-3 lg:grid-cols-2">
                <textarea
                  value={editPyqsText}
                  onChange={(event) => setEditPyqsText(event.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-border bg-background p-3 font-mono text-[11px]"
                  placeholder="Edit pending pyqs JSON…"
                />
                <textarea
                  value={editSyllabusText}
                  onChange={(event) => setEditSyllabusText(event.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-border bg-background p-3 font-mono text-[11px]"
                  placeholder="Edit pending syllabus JSON…"
                />
              </div>
            </div>
          </div>
        )}

        {tab === "validation" && (
          <FilePreview
            title="validation-report.json"
            value={reviewPackage?.validationReport}
          />
        )}

        {tab === "write" && (
          <FilePreview
            title="write-report.json"
            value={reviewPackage?.writeReport}
          />
        )}

        {tab === "manifest" && (
          <FilePreview
            title="diagram-manifest.json"
            value={reviewPackage?.diagramManifest}
          />
        )}

        {tab === "save" && (
          <FilePreview
            title="save-report.json"
            value={reviewPackage?.saveReport}
          />
        )}

        {tab === "git" && (
          <div className="space-y-4">
            {!gitSnapshot ? (
              <p className="text-sm text-muted-foreground">
                Click Refresh Git Status after Local Save.
              </p>
            ) : (
              <>
                <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">Branch</dt>
                    <dd className="mt-0.5 font-mono text-xs">
                      {gitSnapshot.branch}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Modified</dt>
                    <dd className="mt-0.5">
                      {gitSnapshot.modifiedFiles.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Untracked</dt>
                    <dd className="mt-0.5">
                      {gitSnapshot.untrackedFiles.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Deleted</dt>
                    <dd className="mt-0.5">
                      {gitSnapshot.deletedFiles.length}
                    </dd>
                  </div>
                </dl>

                <div>
                  <h4 className="text-xs font-medium">Changed JSON</h4>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {gitSnapshot.changedJsonFiles.join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium">Changed diagrams</h4>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {gitSnapshot.changedDiagramFiles.join(", ") || "—"}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-medium">git status</h4>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-border bg-background p-3 text-[11px] text-muted-foreground">
                    {gitSnapshot.statusText || "(clean)"}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-medium">git diff</h4>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-background p-3 text-[11px] text-muted-foreground">
                    {gitSnapshot.diffText || "(no staged/unstaged diff)"}
                  </pre>
                </div>

                <div>
                  <h4 className="text-xs font-medium">
                    Next Steps (copy only)
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {gitSnapshot.nextCommands.map((command) => (
                      <li key={command}>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(command);
                          }}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left font-mono text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          {command}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    The CMS never runs git add / commit / push.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {!reviewPackage && tab !== "git" && (
          <p className="text-sm text-muted-foreground">
            {reviewableJobs.length === 0
              ? "No jobs ready for review. Upload content and click Run Pipeline."
              : "Select a job and click Review."}
          </p>
        )}

        {reviewPackage?.saveReport?.status === "SUCCESS" && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              ✔ Content saved locally.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Next steps (copy only — the CMS never runs git automatically):
            </p>
            <ul className="mt-3 space-y-2">
              {(
                gitSnapshot?.nextCommands ?? [
                  "git status",
                  "git diff",
                  "git add .",
                  'git commit -m "content: update approved CMS import"',
                  "git push",
                ]
              ).map((command) => (
                <li key={command}>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(command);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left font-mono text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {command}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
