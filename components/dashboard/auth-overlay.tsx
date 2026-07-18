"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Lock,
  UserPlus,
  LogIn,
  Sparkles,
  GraduationCap,
  GitBranch,
  CalendarDays,
} from "lucide-react";

const onboardingSteps = [
  { label: "Create Account", done: false },
  { label: "Verify Email", done: false },
  { label: "Select University", done: false },
  { label: "Select Branch & Semester", done: false },
  { label: "Dashboard Ready", done: false, isLast: true },
];

export function DashboardAuthOverlay({
  onPreview,
}: {
  onPreview?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      className="absolute inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Frosted Backdrop — lighter blur so dashboard content is recognizable */}
      <div className="absolute inset-0 bg-white/50 backdrop-blur-[6px] dark:bg-[#0a0a12]/55 dark:backdrop-blur-[8px]" />

      {/* Floating Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111119]/95 dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)]"
      >
        {/* Top Gradient Accent Line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent dark:via-cyan-400" />

        {/* Subtle ambient glow (dark mode) */}
        <div className="pointer-events-none absolute inset-0 hidden dark:block">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[300px] rounded-full bg-cyan-500/10 blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-8 py-10 text-center sm:px-10 sm:py-12">
          {/* Dynamic Lock Icon with floating + pulse */}
          <motion.div
            className="relative mb-5"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Outer pulsing glow ring */}
            <motion.div
              className="absolute -inset-3 rounded-3xl bg-blue-500/15 blur-xl dark:bg-cyan-500/15"
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white shadow-sm dark:border-cyan-500/20 dark:from-cyan-500/10 dark:to-transparent">
              <Lock
                className="h-7 w-7 text-blue-600 dark:text-cyan-400"
                strokeWidth={1.8}
              />
            </div>
          </motion.div>

          {/* Premium Badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
            <Sparkles className="h-3 w-3" />
            Personalized Dashboard
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[26px]">
            Unlock Your Personalized Dashboard
          </h2>

          {/* Description — explains WHY login is needed */}
          <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
            Create an account and complete your profile to unlock a dashboard
            tailored to your{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              University
            </span>
            ,{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Branch
            </span>
            , and{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Semester
            </span>
            . Access your syllabus, previous year questions, AI tutor, notes,
            and learning progress — all in one place.
          </p>

          {/* Onboarding Steps */}
          <div className="mt-6 flex w-full max-w-xs flex-col items-start gap-0 mx-auto">
            {onboardingSteps.map((step, i) => (
              <div key={step.label} className="flex items-start gap-3">
                {/* Step indicator dot + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                      step.isLast
                        ? "border-blue-400 bg-blue-500/10 text-blue-600 dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-400"
                        : "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500"
                    }`}
                  >
                    {step.isLast ? (
                      <Lock className="h-2.5 w-2.5" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  {i < onboardingSteps.length - 1 && (
                    <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                  )}
                </div>
                {/* Step label */}
                <span
                  className={`pt-[1px] text-[12.5px] font-medium ${
                    step.isLast
                      ? "text-blue-600 dark:text-cyan-400 font-semibold"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:gap-3">
            <Link
              href="/sign-up"
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 px-5 py-3 text-[14px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_20px_-4px_rgba(37,99,235,0.5)] active:scale-[0.98] dark:from-cyan-400 dark:via-blue-500 dark:to-blue-700 dark:shadow-[0_4px_16px_-4px_rgba(6,182,212,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)]"
            >
              <UserPlus className="h-4 w-4" />
              Create Account
            </Link>
            <Link
              href="/sign-in"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-bold text-slate-700 shadow-sm transition-all hover:scale-[1.02] hover:bg-slate-50 hover:shadow-md active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.07]"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </div>

          {/* Preview Button */}
          {onPreview && (
            <button
              onClick={onPreview}
              className="mt-6 text-[13px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Just browsing? Preview dashboard
            </button>
          )}

          {/* Personalization-focused bottom text */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              Your University
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              Your Branch
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Your Semester
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
