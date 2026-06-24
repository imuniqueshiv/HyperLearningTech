"use client";

import { useState } from "react";
import AnswerViewer from "@/components/ai/answer-viewer";

interface GenerateAnswerButtonProps {
  question: string;
  subjectCode: string;
  label?: string;
}

interface AIResponse {
  success: boolean;
  answer?: string;
  cached?: boolean;
  error?: string;
}

export default function GenerateAnswerButton({
  question,
  subjectCode,
  label,
}: GenerateAnswerButtonProps) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateAnswer(forceRefresh = false) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/ai/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          subjectCode,
          forceRefresh,
        }),
      });

      const data: AIResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate answer");
      }

      setAnswer(data.answer || "");
      setCached(Boolean(data.cached));
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the answer."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {!answer && (
        <button
          onClick={() => generateAnswer()}
          disabled={loading}
          className="inline-flex items-center rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-500/20 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {loading
            ? "Generating Answer..."
            : `Check Answer ${label ?? ""} with AI`}
        </button>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {answer && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                Hyper AI Answer
              </span>

              {cached && (
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                  Cached
                </span>
              )}
            </div>

            <button
              onClick={() => generateAnswer(true)}
              disabled={loading}
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Regenerate
            </button>
          </div>

          <AnswerViewer answer={answer} />
        </div>
      )}
    </div>
  );
}
