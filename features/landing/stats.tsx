"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  BrainCircuit,
  FileText,
  GraduationCap,
} from "lucide-react";

const stats = [
  {
    title: "5000+",
    subtitle: "Previous Year Questions",
    icon: FileText,
  },
  {
    title: "200+",
    subtitle: "Topic-Wise AI Notes",
    icon: BookOpen,
  },
  {
    title: "24/7",
    subtitle: "AI Learning Assistant",
    icon: BrainCircuit,
  },
  {
    title: "100%",
    subtitle: "Syllabus Coverage",
    icon: GraduationCap,
  },
];

export default function Stats() {
  return (
    <section className="relative border-b border-border py-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-10 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-10 h-64 w-64 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            Platform Statistics
          </span>

          <h2 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Built For Modern Engineering Students
          </h2>

          <p className="mt-5 text-lg text-slate-400">
            Everything students need to learn, revise, practice, and prepare
            efficiently for RGPV examinations.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 p-8 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:bg-slate-950"
              >
                {/* Glow */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
                </div>

                {/* Icon */}
                <div className="relative z-10 mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <Icon className="h-7 w-7" />
                </div>

                {/* Number */}
                <h3 className="relative z-10 text-5xl font-extrabold tracking-tight text-white">
                  {stat.title}
                </h3>

                {/* Label */}
                <p className="relative z-10 mt-3 text-base text-slate-400">
                  {stat.subtitle}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Strip */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8"
        >
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <h4 className="text-2xl font-bold text-white">AI Tutor</h4>
              <p className="mt-2 text-slate-400">
                Interactive learning with topic-based AI explanations and
                follow-up questions.
              </p>
            </div>

            <div>
              <h4 className="text-2xl font-bold text-white">Mapped PYQs</h4>
              <p className="mt-2 text-slate-400">
                Previous year questions connected directly with syllabus topics.
              </p>
            </div>

            <div>
              <h4 className="text-2xl font-bold text-white">Smart Revision</h4>
              <p className="mt-2 text-slate-400">
                Learn faster through structured notes, summaries, and exam
                focused content.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}