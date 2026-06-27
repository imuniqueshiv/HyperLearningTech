// components/syllabus/module-card.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

interface MappedQuestion {
  id: string;
  text: string;
  exam: string;
  unit: string;
}

interface ModuleCardProps {
  module: {
    id: string;
    number: number;
    title: string;
    hours: number;
    topics?: string[];
    questionIds?: string[];
    predictedQuestionIds?: string[];
  };
  questions: MappedQuestion[];
  branch: string;
  semester: string;
  subject: string;
}

export default function ModuleCard({
  module,
  questions,
  branch,
  semester,
  subject,
}: ModuleCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-border bg-card">
      {/* CLICKABLE HEADER */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`module-content-${module.id}`}
        id={`module-button-${module.id}`}
        className="w-full p-6 md:p-8 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 md:h-12 md:w-12 md:rounded-2xl">
                <BookOpen className="h-5 w-5 text-blue-600 md:h-6 md:w-6" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground md:text-2xl">
                  Module {module.number}
                </h3>

                <p className="text-base text-blue-600 md:text-lg">
                  {module.title}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full border border-border px-3 py-1 text-sm">
                {module.hours} Hours
              </span>

              <span className="rounded-full border border-border px-3 py-1 text-sm">
                {module.questionIds?.length || 0} PYQs
              </span>

              <span className="rounded-full border border-border px-3 py-1 text-sm">
                {module.predictedQuestionIds?.length || 0} Predicted
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Question Mapping Available
            </div>
          </div>

          {open ? (
            <ChevronUp className="h-6 w-6 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* TOPICS - ALWAYS VISIBLE */}
      <div className="px-6 pb-6 md:px-8">
        <div className="flex flex-wrap gap-3">
          {(module.topics || []).map((topic) => (
            <Link
              key={topic}
              href={`/rgpv/${branch}/${semester}/${subject}/ai?module=${encodeURIComponent(
                module.title
              )}&topic=${encodeURIComponent(topic)}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-blue-500/40 hover:text-blue-500"
            >
              {topic}
            </Link>
          ))}
        </div>
      </div>

      {/* COLLAPSED PYQs */}
      {open && questions.length > 0 && (
        <div
          id={`module-content-${module.id}`}
          role="region"
          aria-labelledby={`module-button-${module.id}`}
          className="border-t border-border px-6 py-6 md:px-8"
        >
          <h4 className="text-xl font-semibold text-foreground">
            Linked Previous Year Questions
          </h4>

          <p className="mt-2 text-base text-muted-foreground">
            Questions automatically mapped from all available examination
            papers.
          </p>

          <div className="mt-6 space-y-5">
            {questions.map((question) => (
              <div
                key={`${question.id}-${question.exam}`}
                className="border-l-2 border-blue-500/30 pl-4"
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-600">
                    {question.exam}
                  </span>

                  <span className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
                    {question.unit}
                  </span>
                </div>

                <p className="text-base leading-7 text-foreground">
                  {question.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href={`/rgpv/${branch}/${semester}/${subject}/ai?module=${encodeURIComponent(
                module.title
              )}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"
            >
              Learn This Module
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
