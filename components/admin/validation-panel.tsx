"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";

import type { ValidationIssue } from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface ValidationPanelProps {
  issues: ValidationIssue[];
}

function severityIcon(severity: ValidationIssue["severity"]) {
  switch (severity) {
    case "error":
      return AlertCircle;
    case "warning":
      return AlertTriangle;
    default:
      return Info;
  }
}

function severityClass(severity: ValidationIssue["severity"]): string {
  switch (severity) {
    case "error":
      return "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20";
    case "warning":
      return "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    default:
      return "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20";
  }
}

export function ValidationPanel({ issues }: ValidationPanelProps) {
  return (
    <section
      id="validation"
      className="rounded-2xl border border-border bg-card"
    >
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Validation Errors
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Schema and content findings (mock data)
        </p>
      </header>

      {issues.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">
          No validation issues.
        </p>
      ) : (
        <ul className="space-y-3 p-5">
          {issues.map((issue) => {
            const Icon = severityIcon(issue.severity);

            return (
              <li
                key={issue.id}
                className={cn(
                  "flex gap-3 rounded-xl border p-3",
                  severityClass(issue.severity)
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{issue.message}</p>
                  <p className="mt-0.5 text-xs opacity-80">
                    {issue.code}
                    {issue.path ? ` · ${issue.path}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
