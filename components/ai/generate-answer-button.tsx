"use client";

import { useState, useRef } from "react";
import { Copy, Download, Eye, EyeOff, RefreshCw, FileDown } from "lucide-react";
import dynamic from "next/dynamic";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { downloadMarkdown, downloadPDF } from "@/lib/export-utils";
import type { AIResponse } from "@/types/ai";

const AnswerViewer = dynamic(() => import("@/components/ai/answer-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-32 items-center justify-center rounded-2xl border border-border bg-card">
      <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
    </div>
  ),
});

interface GenerateAnswerButtonProps {
  question: string;
  subjectCode: string;
  label?: string;
}

export default function GenerateAnswerButton({
  question,
  subjectCode,
  label,
}: GenerateAnswerButtonProps) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  async function generateAnswer(isRetry = false) {
    try {
      if (loading && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setLoading(true);
      setError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch(API_ENDPOINTS.AI_ANSWER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          subjectCode,
          forceRefresh: isRetry,
        }),
        signal: abortController.signal,
      });

      const data = (await response.json()) as AIResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate answer");
      }

      setAnswer(data.answer || "");
      setHidden(false);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Fetch aborted");
        return;
      }
      console.error(err);

      // Demo fallback for missing environment variables
      const isDemoMode =
        !process.env.NEXT_PUBLIC_API_URL ||
        err.message.includes("Failed to fetch") ||
        err.message.includes("generate answer");

      if (isDemoMode) {
        setAnswer(
          `**Demo Mode Fallback Answer:**\n\nThis is a simulated AI response because the backend API is currently unavailable.\n\n### Understanding the Concept\n\nThe topic you inquired about is a fundamental part of the **${subjectCode.toUpperCase()}** curriculum. In a production environment, Hyper AI provides a detailed, context-aware explanation mapped directly to your university syllabus.\n\n* **Key Concept 1:** Highly relevant to your semester studies.\n* **Key Concept 2:** Exam-focused insight and step-by-step breakdown.\n* **Application:** Practical examples to help you understand better.\n\n> Note: This is a demo response. Please configure the required environment variables to activate the full AI capabilities.`
        );
        setHidden(false);
        setError(null);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while generating the answer."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyAnswer() {
    if (!answer) return;

    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function handleDownloadMarkdown() {
    if (!answer) return;
    downloadMarkdown(answer);
  }

  function handleDownloadPDF() {
    if (!answer) return;
    downloadPDF(answer);
  }

  return (
    <div className="mt-4 w-full">
      {!answer && (
        <button
          onClick={() => generateAnswer()}
          disabled={loading}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-500/20 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              Generating Answer...
              <span className="sr-only" role="status" aria-live="polite">
                Generating answer, please wait...
              </span>
            </>
          ) : (
            `Check Answer ${label ?? ""} with AI`
          )}
        </button>
      )}

      {error && (
        <div
          className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {answer && !hidden && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <AnswerViewer answer={answer} />
        </div>
      )}

      {answer && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 border-t border-border pt-3">
          {/* Hide/Show Button */}
          <button
            onClick={() => setHidden(!hidden)}
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-foreground"
            aria-label={hidden ? "Show answer" : "Hide answer"}
          >
            {hidden ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span className="sm:inline">Show</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span className="sm:inline">Hide</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={copyAnswer}
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-foreground"
            aria-label="Copy answer"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="sm:inline">{copied ? "Copied!" : "Copy"}</span>
          </button>

          {/* Download Markdown Button */}
          <button
            onClick={handleDownloadMarkdown}
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-foreground"
            aria-label="Download as Markdown"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="sm:inline">MD</span>
          </button>

          {/* Download PDF Button */}
          <button
            disabled={true}
            onClick={handleDownloadPDF}
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-foreground"
            aria-label="Download as PDF"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="sm:inline">PDF</span>
          </button>

          {/* Regenerate Button */}
          <button
            onClick={() => generateAnswer(true)}
            disabled={loading}
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Regenerate answer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span className="sm:inline">
              {loading ? "Generating..." : "Regenerate"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
