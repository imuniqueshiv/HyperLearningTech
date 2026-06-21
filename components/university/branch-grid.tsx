// components/university/branch-grid.tsx

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
} from "lucide-react";
import { branches } from "@/lib/data/branches";

// Map status to icon and other properties
const branchConfig: Record<string, { icon: any; subjects: string }> = {
  aiml: { icon: BrainCircuit, subjects: "40+ Subjects" },
  cse: { icon: Code2, subjects: "40+ Subjects" },
  csit: { icon: Database, subjects: "40+ Subjects" },
  it: { icon: Network, subjects: "40+ Subjects" },
  cy: { icon: Shield, subjects: "40+ Subjects" },
  ec: { icon: Cpu, subjects: "Coming Soon" },
  me: { icon: Wrench, subjects: "Coming Soon" },
  common: { icon: BrainCircuit, subjects: "12 Subjects" },
};

export default function BranchGrid() {
  // Sort branches: Available first, then Coming Soon
  const sortedBranches = [...branches].sort((a, b) => {
    if (a.status === "Available" && b.status === "Coming Soon") return -1;
    if (a.status === "Coming Soon" && b.status === "Available") return 1;
    return 0;
  });

  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-24">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            Engineering Branches
          </div>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Choose Your
            <span className="block bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
              Branch
            </span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Browse branch-specific syllabus, previous year questions, Hyper AI
            learning resources, and academic content organized semester by
            semester.
          </p>
        </motion.div>

        {/* Branch Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedBranches.map((branch, index) => {
            const config = branchConfig[branch.id] || branchConfig.cse;
            const Icon = config.icon;

            const CardContent = (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 25,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
                className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card/50 p-8 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl"
              >
                {/* Glow */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
                </div>

                {/* Header */}
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D4ED8]/10">
                    <Icon className="h-7 w-7 text-[#1D4ED8]" />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      branch.status === "Available"
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {branch.status}
                  </span>
                </div>

                {/* Content */}
                <div className="relative z-10 mt-8">
                  <h3 className="text-4xl font-black tracking-tight text-foreground">
                    {branch.id.toUpperCase()}
                  </h3>

                  <p className="mt-3 min-h-[56px] text-muted-foreground">
                    {branch.name}
                  </p>

                  <div className="mt-6 inline-flex rounded-full border border-border px-3 py-1 text-sm font-medium text-muted-foreground">
                    {config.subjects}
                  </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 mt-10 flex items-center justify-between">
                  {branch.status === "Available" ? (
                    <>
                      <span className="font-semibold text-[#1D4ED8]">
                        Explore Branch
                      </span>

                      <ArrowRight className="h-5 w-5 text-[#1D4ED8] transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      Planned Expansion
                    </span>
                  )}
                </div>
              </motion.div>
            );

            if (branch.status === "Available") {
              return (
                <Link key={branch.id} href={`/rgpv/${branch.slug}`} className="block">
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
          className="mt-16 rounded-3xl border border-border bg-card/40 p-8 text-center backdrop-blur-xl"
        >
          <h3 className="text-2xl font-bold text-foreground">
            Expanding Across Engineering Disciplines
          </h3>

          <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">
            Hyper Learning is being structured to support every major RGPV
            engineering branch through syllabus-driven learning, AI-generated
            academic resources, and previous year question analysis.
          </p>
        </motion.div>
      </div>
    </section>
  );
}