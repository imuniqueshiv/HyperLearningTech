"use client";

import { BrainCircuit, ArrowRight } from "lucide-react";

export default function ChatMockup() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-background/90 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Topic */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
            <p className="text-sm font-semibold text-[#1D4ED8]">
              Current Topic
            </p>

            <h4 className="mt-2 text-lg font-bold text-foreground">
              Complexity Analysis
            </h4>
          </div>

          {/* User */}
          <div className="flex justify-end">
            <div className="max-w-xs rounded-2xl bg-[#1D4ED8] px-4 py-3 text-sm text-white shadow-md">
              Explain Big O notation with a real example.
            </div>
          </div>

          {/* AI */}
          <div className="flex justify-start">
            <div className="max-w-md rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-[#1D4ED8]">
                <BrainCircuit className="h-4 w-4" />
                <span className="text-sm font-semibold">AI Tutor</span>
              </div>

              <p className="text-sm leading-relaxed text-foreground/80">
                Big O notation describes how an algorithm&apos;s execution time
                grows as input size increases. For example, Linear Search has
                O(n) complexity because it may need to check every element in
                the list.
              </p>
            </div>
          </div>

          {/* User */}
          <div className="flex justify-end">
            <div className="max-w-xs rounded-2xl bg-[#1D4ED8] px-4 py-3 text-sm text-white shadow-md">
              How is it different from O(log n)?
            </div>
          </div>

          {/* AI */}
          <div className="flex justify-start">
            <div className="max-w-md rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-[#1D4ED8]">
                <BrainCircuit className="h-4 w-4" />
                <span className="text-sm font-semibold">AI Tutor</span>
              </div>

              <p className="text-sm leading-relaxed text-foreground/80">
                O(log n) grows much slower than O(n). Binary Search uses O(log
                n) because it repeatedly halves the search space, making it
                significantly faster for large datasets.
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Ask a follow-up question...
              </span>

              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Card */}
      <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-background p-4 shadow-xl lg:block">
        <p className="text-sm text-muted-foreground">Follow-up Questions</p>

        <p className="mt-1 text-2xl font-bold text-foreground">3 / 3</p>
      </div>
    </div>
  );
}
