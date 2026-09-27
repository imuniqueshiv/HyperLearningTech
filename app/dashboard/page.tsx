"use client";

import { useState } from "react";
import Link from "next/link";
import { Library, BookOpen, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { DashboardAuthOverlay } from "@/components/dashboard/auth-overlay";

export default function DashboardPage() {
  // TODO: Replace with real auth state (e.g. from your auth provider)
  const isLoggedIn = false;
  const [isPreviewing, setIsPreviewing] = useState(false);

  return (
    <div className="relative min-h-[90vh] w-full bg-background dark:bg-transparent pt-16 pb-12 animate-in fade-in duration-700 z-0">
      {/* Background Layers */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Premium Light Mode Background - Soft & Clean */}
        <div className="absolute inset-0 dark:hidden bg-[#FAFAFA] -z-10" />
        <div className="absolute inset-0 dark:hidden pointer-events-none -z-10">
          <div className="absolute -top-[10%] -left-[5%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-blue-400/15 via-indigo-500/10 to-transparent blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] h-[700px] w-[700px] rounded-full bg-gradient-to-bl from-cyan-400/15 via-blue-500/10 to-transparent blur-[120px]" />
        </div>
      </div>

      {/* Auth Overlay — shown when user is NOT logged in and NOT previewing */}
      <AnimatePresence>
        {!isLoggedIn && !isPreviewing && (
          <DashboardAuthOverlay onPreview={() => setIsPreviewing(true)} />
        )}
      </AnimatePresence>

      {/* Exit Preview Button */}
      <AnimatePresence>
        {isPreviewing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => setIsPreviewing(false)}
              className="group flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
              Exit Preview
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Section Divider for visual separation from Universities */}
      <div className="absolute inset-x-0 top-0 z-50 h-px w-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          {/* 1. Premium Welcome Banner (Full Width) */}
          <div className="relative w-full overflow-hidden rounded-[24px] border border-slate-200/60 bg-white/80 dark:border-blue-400/15 dark:bg-slate-900/60 dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] group transition-all duration-300 dark:hover:border-blue-400/30">
            {/* Ambient Background Glow (Dark Mode only) */}
            <div className="hidden dark:block absolute inset-0 -z-10 opacity-[0.12] transition-opacity duration-500 group-hover:opacity-[0.24]">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-cyan-500/24 blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center gap-5">
              {isPreviewing ? (
                <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:shadow-[0_0_15px_rgba(245,158,11,0.1)] backdrop-blur-md">
                  Preview Mode
                </div>
              ) : (
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-4 py-1 text-xs font-semibold text-blue-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:shadow-[0_0_15px_rgba(6,182,212,0.1)] backdrop-blur-md">
                  Student Dashboard
                </div>
              )}

              <div className="flex flex-col items-center gap-2.5">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                  {isPreviewing ? (
                    <>
                      Exploring the Dashboard{" "}
                      <motion.span
                        className="inline-block ml-1 origin-center"
                        animate={{
                          x: [0, -4, -4, 4, 4, 0, 0, 0],
                          scaleY: [1, 1, 1, 1, 1, 1, 0.1, 1],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          times: [0, 0.1, 0.3, 0.4, 0.6, 0.8, 0.85, 0.9],
                          ease: "easeInOut",
                        }}
                      >
                        👀
                      </motion.span>
                    </>
                  ) : (
                    <>
                      Welcome Back, ABHAY{" "}
                      <span className="inline-block animate-wave">👋</span>
                    </>
                  )}
                </h1>
                <p className="max-w-2xl text-[14.5px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium mt-1">
                  {isPreviewing
                    ? "This is a preview of the personalized experience. Sign in to track your actual progress, generate notes, and practice with past year questions."
                    : "Pick up where you left off. Access your personalized syllabus, study your AI-generated notes, and practice with past year questions."}
                </p>
              </div>

              {/* Decorative Activity Pulse (Hidden on mobile) */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-end gap-1.5 opacity-60 transition-opacity hover:opacity-100">
                <svg
                  width="100"
                  height="24"
                  viewBox="0 0 120 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-cyan-500/50"
                >
                  {/* Faint Background Track */}
                  <path
                    d="M0 15H30L35 10L42 22L50 5L58 28L65 15H120"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-20"
                  />
                  {/* Live Pulse (subtle) */}
                  <path
                    d="M0 15H30L35 10L42 22L50 5L58 28L65 15H120"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pulse-line opacity-80"
                  />
                </svg>
                <div className="flex items-center gap-1.5 mr-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500/80"></span>
                  </span>
                  <span className="text-[9px] font-semibold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">
                    {isPreviewing ? "Demo Environment" : "Workspace Active"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* 2. Continue Learning Section (Left side) */}
            <div className="col-span-1 lg:col-span-7 flex flex-col gap-5">
              <div className="flex items-center justify-between px-1 shrink-0">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Start your journey
                </h2>
                {!isPreviewing && (
                  <Link
                    href="/rgpv"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    View all history &rarr;
                  </Link>
                )}
              </div>
              <div className="flex flex-col gap-5 flex-1">
                <RecentActivityCard
                  title="Mathematics-III (BT-401)"
                  subtitle="RGPV • CSE • Semester 4"
                  href="/rgpv/cse/semester-4/bt-401"
                  timeAgo="2 hours ago"
                  progressText="Unit 2: Laplace Transform"
                  progressValue={75}
                  theme="cyan"
                  type="book"
                  isPreviewing={isPreviewing}
                />
                <RecentActivityCard
                  title="Analysis Design of Algorithm (CS-402)"
                  subtitle="RGPV • CSE • Semester 4"
                  href="/rgpv/cse/semester-4/cs-402"
                  timeAgo="Yesterday"
                  progressText="Viewing June-2024 PYQ"
                  progressValue={40}
                  theme="orange"
                  type="file"
                  isPreviewing={isPreviewing}
                />
              </div>
            </div>

            {/* 3. Quick Actions (Right side grid) */}
            <div className="col-span-1 lg:col-span-5 flex flex-col gap-5">
              <div className="flex items-center justify-between px-1 shrink-0">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Quick Actions
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 flex-1">
                <QuickActionCard
                  title="Smart Notes"
                  description="View generated notes."
                  href="/rgpv"
                  icon={Library}
                  colorVariant="blue"
                  isPreviewing={isPreviewing}
                />
                <QuickActionCard
                  title="Syllabus"
                  description="View breakdowns."
                  href="/rgpv"
                  icon={BookOpen}
                  colorVariant="indigo"
                  isPreviewing={isPreviewing}
                />
                <QuickActionCard
                  title="PYQs"
                  description="Practice questions."
                  href="/rgpv"
                  icon={FileText}
                  colorVariant="emerald"
                  isPreviewing={isPreviewing}
                />
                <QuickActionCard
                  title="AI Tutor"
                  description="Get instant help."
                  href="/rgpv"
                  icon={Sparkles}
                  colorVariant="purple"
                  isPreviewing={isPreviewing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
