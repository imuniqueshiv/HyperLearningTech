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
      className="relative overflow-hidden border-b border-border bg-background py-16 md:py-20 lg:py-24"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
          }}
          className="mx-auto mb-10 md:mb-12 lg:mb-16 max-w-3xl text-center"
        >
          <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 md:px-4 md:py-2 md:text-sm">
            Engineering Branches
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Choose Your
            <span className="block bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
              Branch
            </span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Browse branch-specific syllabus, previous year questions, Hyper AI
            learning resources, and academic content organized semester by
            semester.
          </p>
        </motion.div>

        {/* Branch Grid - Smaller Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {sortedBranches.map((branch, index) => {
            const config = branchConfig[branch.id] || branchConfig.cse;
            const Icon = config.icon;

            const CardContent = (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.06,
                }}
                className="group relative h-full overflow-hidden rounded-xl border border-border bg-card/50 p-4 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Glow */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
                </div>

                {/* Header */}
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1D4ED8]/10 sm:h-10 sm:w-10">
                    <Icon className="h-4 w-4 text-[#1D4ED8] sm:h-5 sm:w-5" />
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${
                      branch.status === "Available"
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {branch.status === "Available" ? "Live" : "Soon"}
                  </span>
                </div>

                {/* Content */}
                <div className="relative z-10 mt-3">
                  <h3 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                    {branch.id.toUpperCase()}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 sm:text-sm">
                    {branch.name}
                  </p>

                  <div className="mt-3 inline-flex rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
                    {config.subjects}
                  </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 mt-4 flex items-center justify-between">
                  {branch.status === "Available" ? (
                    <>
                      <span className="text-xs font-semibold text-[#1D4ED8] sm:text-sm">
                        Explore
                      </span>

                      <ArrowRight className="h-3.5 w-3.5 text-[#1D4ED8] transition-transform duration-300 group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
                    </>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                      Planned
                    </span>
                  )}
                </div>
              </motion.div>
            );

            if (branch.status === "Available") {
              return (
                <Link
                  key={branch.id}
                  href={`/rgpv/${branch.slug}`}
                  className="block"
                >
                  {CardContent}
                </Link>
              );
            }

            return <div key={branch.id}>{CardContent}</div>;
          })}
        </div>

        {/* Bottom Notice */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
          }}
          className="mt-10 rounded-2xl border border-border bg-card/40 p-6 text-center backdrop-blur-xl md:mt-12 lg:mt-16 md:p-8"
        >
          <h3 className="text-lg font-bold text-foreground md:text-2xl">
            Expanding Across Engineering Disciplines
          </h3>

          <p className="mx-auto mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Hyper Learning is being structured to support every major RGPV
            engineering branch through syllabus-driven learning, AI-generated
            academic resources, and previous year question analysis.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
