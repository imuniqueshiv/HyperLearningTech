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
    offset: ["start 45%", "start 10%"],
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
      {/* Frosted Backdrop — covers dashboard section */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[12px] dark:bg-[#0a0a12]/65 dark:backdrop-blur-[12px]"
      />

      {/* Fixed Card Container — viewport-pinned so it never scrolls away */}
      <motion.div
        style={{ opacity }}
        className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
      >
        <div
          style={{ perspective: "1000px" }}
          className="w-full flex justify-center px-4 pointer-events-auto"
        >
          {/* Floating Card - Scale, Opacity, Y, and 3D Rotate linked to smooth scroll */}
          <motion.div
            style={{ scale, opacity, y, rotateX }}
            className="relative w-full max-w-[440px] overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-[0_25px_70px_-15px_rgba(30,58,138,0.18),0_10px_30px_-10px_rgba(0,0,0,0.04)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#111119] dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)]"
          >
            {/* Light Mode Ambient Background Mesh */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden dark:hidden">
              <div className="absolute left-1/2 -top-24 h-56 w-72 -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-400/20 via-indigo-300/10 to-transparent blur-3xl" />
              <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-indigo-400/15 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-blue-400/15 blur-3xl" />
            </div>

            {/* Dark Mode Ambient Background Glow */}
            <div className="pointer-events-none absolute inset-0 -z-10 hidden dark:block">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[220px] w-[320px] rounded-full bg-cyan-500/15 blur-[80px]" />
            </div>

            {/* Top Gradient Accent Rim */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500/20 via-blue-600 to-indigo-600/20 dark:from-cyan-500/30 dark:via-cyan-400 dark:to-blue-500/30" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Floating Glowing Lock Header */}
              <motion.div
                className="relative mb-4 sm:mb-5"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Pulsing Backlight */}
                <motion.div
                  className="absolute -inset-3 rounded-full bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-cyan-500/20 blur-xl dark:from-cyan-500/30 dark:via-blue-500/20 dark:to-cyan-400/20"
                  animate={{
                    opacity: [0.5, 0.9, 0.5],
                    scale: [0.95, 1.08, 0.95],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-indigo-50/80 shadow-[0_8px_20px_-4px_rgba(59,130,246,0.25),inset_0_1px_1px_rgba(255,255,255,1)] dark:border-cyan-500/30 dark:bg-gradient-to-br dark:from-cyan-500/15 dark:via-cyan-950/20 dark:to-blue-900/20 dark:shadow-none">
                  <Lock
                    className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-cyan-400"
                    strokeWidth={2}
                  />
                </div>
              </motion.div>

              {/* Unified Glowing Badge */}
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 px-3.5 py-1 text-[11px] font-semibold text-blue-700 shadow-sm dark:border-cyan-500/30 dark:bg-gradient-to-r dark:from-cyan-500/15 dark:to-blue-500/15 dark:text-cyan-300">
                <Sparkles className="h-3 w-3 text-blue-500 dark:text-cyan-400" />
                Personalized Dashboard
              </div>

              {/* Title */}
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Unlock Your Personalized Dashboard
              </h2>

              {/* Subtitle / Description */}
              <p className="mt-2.5 max-w-[350px] text-[12px] sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                Create an account and complete your profile to unlock a
                dashboard tailored to your{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  University
                </span>
                ,{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  Branch
                </span>
                , and{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  Semester
                </span>
                . Access your syllabus, previous year questions, AI tutor, and
                learning progress.
              </p>

              {/* Onboarding Timeline */}
              <div className="my-5 flex w-full max-w-[310px] flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                {onboardingSteps.map((step, i) => (
                  <div
                    key={step.label}
                    className="flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                          step.isLast
                            ? "border border-blue-500/40 bg-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950"
                            : "border border-slate-200 bg-white text-slate-500 shadow-2xs dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400"
                        }`}
                      >
                        {step.isLast ? (
                          <Lock className="h-2.5 w-2.5" />
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-[12px] font-medium ${
                          step.isLast
                            ? "font-semibold text-blue-600 dark:text-cyan-400"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>

                    {step.isLast && (
                      <span className="rounded-full bg-blue-100/80 px-2 py-0.5 text-[9.5px] font-bold text-blue-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                        Final Step
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:gap-3">
                <Link
                  href="/sign-up"
                  className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-4 py-3 text-[13.5px] font-bold text-white shadow-[0_6px_20px_-4px_rgba(37,99,235,0.45)] transition-all duration-300 hover:shadow-[0_10px_28px_-4px_rgba(37,99,235,0.55)] hover:-translate-y-0.5 active:translate-y-0 dark:from-cyan-500 dark:via-cyan-500 dark:to-blue-600 dark:text-slate-950 dark:shadow-[0_6px_20px_-4px_rgba(6,182,212,0.4)]"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </Link>
                <Link
                  href="/sign-in"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-bold text-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 hover:shadow-[0_4px_12px_rgba(59,130,246,0.1)] hover:-translate-y-0.5 active:translate-y-0 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[0.1]"
                >
                  <LogIn className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span>Sign In</span>
                </Link>
              </div>

              {/* Preview CTA Option */}
              {onPreview && (
                <button
                  onClick={onPreview}
                  className="mt-3.5 text-[12px] font-semibold text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-400"
                >
                  Just browsing? Preview dashboard
                </button>
              )}

              {/* Feature Pills Footer */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-0.5 text-[10.5px] font-medium text-slate-600 dark:bg-white/[0.04] dark:text-slate-400">
                  <GraduationCap className="h-3 w-3 text-blue-500 dark:text-cyan-400" />
                  Your University
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-0.5 text-[10.5px] font-medium text-slate-600 dark:bg-white/[0.04] dark:text-slate-400">
                  <GitBranch className="h-3 w-3 text-blue-500 dark:text-cyan-400" />
                  Your Branch
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-0.5 text-[10.5px] font-medium text-slate-600 dark:bg-white/[0.04] dark:text-slate-400">
                  <CalendarDays className="h-3 w-3 text-blue-500 dark:text-cyan-400" />
                  Your Semester
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
