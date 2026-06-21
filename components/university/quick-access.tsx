"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  FileText,
  BrainCircuit,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const pathways = [
  {
    title: "Semester Navigation",
    description:
      "Navigate semester-wise academic content organized exactly according to the university curriculum.",
    icon: GraduationCap,
    href: "/rgpv/aiml",
    color: "from-blue-500/10 to-blue-600/5",
  },
  {
    title: "Subject Library",
    description:
      "Access all subjects available for your branch with syllabus, PYQs, and AI learning resources.",
    icon: BookOpen,
    href: "/subjects",
    color: "from-indigo-500/10 to-indigo-600/5",
  },
  {
    title: "Previous Year Questions",
    description:
      "Explore year-wise papers with AI-generated answers and exam-focused preparation resources.",
    icon: FileText,
    href: "/pyqs",
    color: "from-emerald-500/10 to-emerald-600/5",
  },
  {
    title: "Hyper AI",
    description:
      "Ask questions, generate notes, simplify concepts, and learn with AI-powered academic assistance.",
    icon: BrainCircuit,
    href: "/hyper-ai",
    color: "from-violet-500/10 to-violet-600/5",
  },
];

export default function QuickAccess() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-24">
      {/* Background */}
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
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="h-4 w-4" />
            Academic Navigation
          </div>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Everything Organized
            <span className="block bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
              For Faster Learning
            </span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Follow a structured academic path from branch selection to syllabus,
            previous year questions, and AI-assisted learning.
          </p>
        </motion.div>

        {/* Academic Flow */}
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
            duration: 0.6,
          }}
          className="mb-16 rounded-[2rem] border border-border bg-card/40 p-8 backdrop-blur-xl"
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center lg:flex-row">
            <div className="rounded-xl bg-blue-500/10 px-5 py-3 font-semibold text-[#1D4ED8]">
              Branch
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            <div className="rounded-xl bg-blue-500/10 px-5 py-3 font-semibold text-[#1D4ED8]">
              Semester
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            <div className="rounded-xl bg-blue-500/10 px-5 py-3 font-semibold text-[#1D4ED8]">
              Subject
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            <div className="rounded-xl bg-blue-500/10 px-5 py-3 font-semibold text-[#1D4ED8]">
              Syllabus
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            <div className="rounded-xl bg-blue-500/10 px-5 py-3 font-semibold text-[#1D4ED8]">
              PYQs
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            <div className="rounded-xl bg-blue-500/10 px-5 py-3 font-semibold text-[#1D4ED8]">
              Hyper AI
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {pathways.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
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
              >
                <Link href={item.href}>
                  <div className="group h-full rounded-3xl border border-border bg-card/50 p-7 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl">
                    <div
                      className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color}`}
                    >
                      <Icon className="h-7 w-7 text-[#1D4ED8]" />
                    </div>

                    <h3 className="text-xl font-bold text-foreground">
                      {item.title}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>

                    <div className="mt-8 flex items-center gap-2 font-semibold text-[#1D4ED8]">
                      Open
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Note */}
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
            One Platform. Complete Academic Workflow.
          </h3>

          <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">
            Hyper Learning connects syllabus, previous year questions,
            AI-generated explanations, and academic resources into a single
            learning experience designed specifically for engineering students.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
