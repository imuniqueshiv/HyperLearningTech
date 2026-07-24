"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Cpu,
  Database,
  Shield,
  Code2,
  Network,
  Wrench,
  HardHat,
  Radio,
  Zap,
  Lightbulb,
  Atom,
} from "lucide-react";
import { branches } from "@/lib/data/branches";
import type { LucideIcon } from "lucide-react";

// Map status to icon and other properties
const branchConfig: Record<string, { icon: LucideIcon; subjects: string }> = {
  common: { icon: BrainCircuit, subjects: "12 Subjects" },
  aiml: { icon: BrainCircuit, subjects: "40+ Subjects" },
  aids: { icon: Database, subjects: "40+ Subjects" },
  cse: { icon: Code2, subjects: "40+ Subjects" },
  csit: { icon: Database, subjects: "40+ Subjects" },
  csbs: { icon: Network, subjects: "40+ Subjects" },
  cscy: { icon: Shield, subjects: "40+ Subjects" },
  civil: { icon: HardHat, subjects: "40+ Subjects" },
  me: { icon: Wrench, subjects: "Coming Soon" },
  ec: { icon: Radio, subjects: "Coming Soon" },
  ee: { icon: Zap, subjects: "Coming Soon" },
  eee: { icon: Lightbulb, subjects: "Coming Soon" },
  ei: { icon: Cpu, subjects: "Coming Soon" },
  ex: { icon: Atom, subjects: "Coming Soon" },
};

export default function BranchGrid() {
  // Sort branches: Available first, then Coming Soon
  const sortedBranches = [...branches].sort((a, b) => {
    if (a.status === "Available" && b.status === "Coming Soon") return -1;
    if (a.status === "Coming Soon" && b.status === "Available") return 1;
    return 0;
  });

  return (
    <section
      id="branches"
      className="relative overflow-hidden border-y border-slate-200 bg-slate-50/30 py-16 transition-colors duration-500 md:py-20 lg:py-24 dark:border-white/10 dark:bg-background"
    >
      {/* Premium Glowing Top Separator */}
      <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-blue-600/50 to-transparent dark:via-blue-400/30" />
      <div className="absolute inset-x-0 top-0 h-24 w-full bg-gradient-to-b from-blue-500/5 to-transparent dark:from-blue-400/5" />

      {/* Premium Wavy Aurora Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Sweeping Wavy Gradient Blobs */}
        <div className="absolute -left-[20%] top-[-10%] h-[70%] w-[60%] -rotate-12 rounded-[100%] bg-gradient-to-br from-blue-400/20 to-blue-100/5 blur-[120px] dark:from-blue-900/20 dark:to-transparent" />
        <div className="absolute -right-[10%] top-[10%] h-[80%] w-[50%] rotate-12 rounded-[100%] bg-gradient-to-bl from-indigo-400/20 to-purple-200/5 blur-[120px] dark:from-indigo-900/20 dark:to-transparent" />
        <div className="absolute -bottom-[20%] left-[10%] h-[60%] w-[80%] -rotate-6 rounded-[100%] bg-gradient-to-tr from-purple-400/20 to-blue-200/5 blur-[120px] dark:from-purple-900/20 dark:to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className="mx-auto mb-10 md:mb-12 lg:mb-16 max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 md:px-4 md:py-1.5 md:text-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
            Engineering Branches
          </div>

          <h2 className="mt-5 text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Choose Your
            <span className="mt-2 block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text pb-1 text-transparent drop-shadow-sm dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 sm:mt-3">
              Branch
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground/90 dark:text-muted-foreground/80 md:text-lg">
            Access high-quality academic content, analyze previous year
            questions, and accelerate your learning with Hyper AI—intelligently
            organized by semester.
          </p>
        </motion.div>

        {/* Branch Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sortedBranches.map((branch, index) => {
            const config = branchConfig[branch.id] || branchConfig.cse;
            const Icon = config.icon;
            const isAvailable = branch.status === "Available";

            const CardContent = (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.04,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className={`group relative h-full overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
                  isAvailable
                    ? "border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.04)] hover:border-blue-200 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12),0_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-1 dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] dark:hover:border-blue-500/25 dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(59,130,246,0.1)]"
                    : "border-slate-200/50 bg-slate-50/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-white/[0.04] dark:bg-white/[0.01]"
                }`}
              >
                {/* Ambient inner glow overlay */}
                {isAvailable && (
                  <>
                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-100/60 blur-2xl transition-all duration-500 group-hover:bg-blue-200/70 dark:bg-blue-400/[0.06] dark:group-hover:bg-blue-400/[0.10]" />
                    <div className="pointer-events-none absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-indigo-100/40 blur-2xl transition-all duration-500 group-hover:bg-indigo-200/50 dark:bg-indigo-400/[0.04] dark:group-hover:bg-indigo-400/[0.07]" />
                  </>
                )}

                {/* Top edge highlight */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/40 to-transparent dark:via-white/[0.06]" />

                <div className="relative z-10 flex h-full flex-col">
                  {/* Icon */}
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 ${
                      isAvailable
                        ? "border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-[0_1px_4px_rgba(59,130,246,0.1)] group-hover:border-blue-200 group-hover:shadow-[0_4px_12px_rgba(59,130,246,0.15)] dark:border-blue-500/20 dark:from-blue-500/10 dark:to-blue-600/5 dark:text-blue-400 dark:shadow-none dark:group-hover:border-blue-400/30"
                        : "border-slate-200/60 bg-slate-100 text-slate-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-600"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  {/* Branch Name & Description */}
                  <div className="mt-4 flex-1">
                    <h3
                      className={`text-lg font-extrabold tracking-tight sm:text-xl ${
                        isAvailable
                          ? "text-slate-900 dark:text-foreground"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {branch.id.toUpperCase()}
                    </h3>
                    <p
                      className={`mt-0.5 text-[12px] leading-snug line-clamp-1 sm:text-[13px] ${
                        isAvailable
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {branch.name}
                    </p>
                  </div>

                  {/* Bottom CTA */}
                  <div className="mt-5 flex items-center justify-between">
                    {isAvailable ? (
                      <>
                        <span className="text-[12px] font-semibold text-slate-500 transition-colors group-hover:text-blue-600 dark:text-muted-foreground/60 dark:group-hover:text-blue-400 sm:text-[13px]">
                          Explore
                        </span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition-all duration-300 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:translate-x-0.5 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-slate-500 dark:group-hover:border-blue-500/20 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-400">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground/40">
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );

            if (isAvailable) {
              return (
                <Link
                  key={branch.id}
                  href={`/rgpv/${branch.slug}`}
                  className="block focus:outline-none"
                >
                  {CardContent}
                </Link>
              );
            }

            return <div key={branch.id}>{CardContent}</div>;
          })}
        </div>

        {/* Bottom Section - Premium Floating Text */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="relative mx-auto mt-32 max-w-3xl text-center"
        >
          {/* Ethereal background glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 mx-auto h-full w-full max-w-lg bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent blur-3xl dark:from-blue-600/15" />

          <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl lg:text-5xl">
            Built for Every{" "}
            <span className="bg-gradient-to-b from-slate-900 to-slate-500 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
              Engineering Discipline
            </span>
          </h3>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
            Hyper Learning is expanding to support all major RGPV branches. We
            combine structured academic curriculums with AI-powered resources to
            deliver a seamless, high-quality learning experience.
          </p>

          {/* Elegant fading divider */}
          <div className="mx-auto mt-12 h-px w-3/4 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />
        </motion.div>
      </div>
    </section>
  );
}
