"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 90%", "start 10%"],
  });

  // Snappy, premium spring (PhonePe style)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 30,
    restDelta: 0.001,
  });

  // Drop down from slightly above, scale up, and fold in 3D
  const scale = useTransform(smoothProgress, [0, 1], [0.6, 1]);
  const y = useTransform(smoothProgress, [0, 1], [-60, 0]);
  const rotateX = useTransform(smoothProgress, [0, 1], [15, 0]);
  const opacity = useTransform(smoothProgress, [0, 1], [0, 1]);

  return (
    <motion.div ref={containerRef} className="absolute inset-0 z-50">
      {/* Frosted Backdrop — opacity linked to scroll */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 bg-white/50 backdrop-blur-[6px] dark:bg-[#0a0a12]/55 dark:backdrop-blur-[8px]"
      />

      {/* Wrapper: Sticky scrolling on Mobile, Static absolute centering on Desktop */}
      <div className="absolute inset-x-0 top-16 bottom-16 sm:inset-0 pointer-events-none">
        <div
          style={{ perspective: "1000px" }}
          className="sticky top-[15vh] translate-y-0 sm:absolute sm:top-1/2 sm:-translate-y-1/2 flex w-full justify-center px-4 pointer-events-auto"
        >
          {/* Floating Card - Scale, Opacity, Y, and 3D Rotate linked to smooth scroll */}
          <motion.div
            style={{ scale, opacity, y, rotateX }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111119]/95 dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)]"
          >
            {/* Top Gradient Accent Line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent dark:via-cyan-400" />

            {/* Subtle ambient glow (dark mode) */}
            <div className="pointer-events-none absolute inset-0 hidden dark:block">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[300px] rounded-full bg-cyan-500/10 blur-[80px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center px-5 py-6 sm:px-8 sm:py-8 text-center">
              {/* Dynamic Lock Icon with floating + pulse */}
              <motion.div
                className="relative mb-3 sm:mb-5"
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
                  animate={{
                    opacity: [0.4, 0.8, 0.4],
                    scale: [0.95, 1.05, 0.95],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white shadow-sm dark:border-cyan-500/20 dark:from-cyan-500/10 dark:to-transparent">
                  <Lock
                    className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-cyan-400"
                    strokeWidth={1.8}
                  />
                </div>
              </motion.div>

              {/* Premium Badge */}
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50/80 px-3 py-1 text-[10px] font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                <Sparkles className="h-2.5 w-2.5" />
                Personalized Dashboard
              </div>

              {/* Heading */}
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl px-2">
                Unlock Your Personalized Dashboard
              </h2>

              {/* Description — explains WHY login is needed */}
              <p className="mx-auto mt-2 max-w-[340px] text-[12px] sm:text-[13px] leading-snug text-slate-500 dark:text-slate-400 px-2">
                Create an account and complete your profile to unlock a
                dashboard tailored to your{" "}
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
                . Access your syllabus, previous year questions, AI tutor,
                notes, and learning progress — all in one place.
              </p>

              {/* Onboarding Steps */}
              <div className="mt-4 sm:mt-5 flex w-full max-w-[280px] sm:max-w-[300px] flex-col items-start gap-0 mx-auto">
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
                        <div className="h-2 sm:h-3 w-px bg-slate-200 dark:bg-white/10" />
                      )}
                    </div>
                    {/* Step label */}
                    <span
                      className={`pt-[1.5px] text-[11.5px] sm:text-[12px] font-medium ${
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
              <div className="mt-5 sm:mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:gap-3">
                <Link
                  href="/sign-up"
                  className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 px-4 py-2.5 text-[13px] sm:text-[14px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_20px_-4px_rgba(37,99,235,0.5)] active:scale-[0.98] dark:from-cyan-400 dark:via-blue-500 dark:to-blue-700 dark:shadow-[0_4px_16px_-4px_rgba(6,182,212,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)]"
                >
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </Link>
                <Link
                  href="/sign-in"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] sm:text-[14px] font-bold text-slate-700 shadow-sm transition-all hover:scale-[1.02] hover:bg-slate-50 hover:shadow-md active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.07]"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </div>

              {/* Preview Button */}
              {onPreview && (
                <button
                  onClick={onPreview}
                  className="mt-4 sm:mt-5 text-[11px] sm:text-[12px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Just browsing? Preview dashboard
                </button>
              )}

              {/* Personalization-focused bottom text */}
              <div className="mt-4 sm:mt-5 flex items-center justify-center gap-1.5 text-[9.5px] sm:text-[11px] text-slate-400 dark:text-slate-500">
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
        </div>
      </div>
    </motion.div>
  );
}
