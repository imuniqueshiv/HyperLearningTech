"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  BookOpen,
  FileText,
  Search,
  Bookmark,
  GraduationCap,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Mapped Previous Year Questions",
    description:
      "Access unit-wise and topic-wise previous year questions mapped directly to the syllabus for smarter exam preparation.",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Learning Assistant",
    description:
      "Get instant explanations, summaries, and follow-up answers through an AI tutor designed for engineering students.",
  },
  {
    icon: BookOpen,
    title: "Topic-Wise Notes",
    description:
      "Generate structured notes for every syllabus topic with examples, key concepts, revision points, and important takeaways.",
  },
  {
    icon: Search,
    title: "Smart Search",
    description:
      "Quickly search subjects, units, topics, questions, and AI-generated notes from a unified search experience.",
  },
  {
    icon: Bookmark,
    title: "Bookmarks & Revision",
    description:
      "Save important questions, notes, and topics to build your personalized revision list before examinations.",
  },
  {
    icon: GraduationCap,
    title: "Exam-Oriented Learning",
    description:
      "Designed specifically for RGPV students with syllabus coverage, PYQ analysis, and exam-focused preparation.",
  },
];

export default function Features() {
  return (
    <section className="relative overflow-hidden border-b border-border py-24">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-20 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute right-0 bottom-20 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            Core Features
          </span>

          <h2 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Everything You Need To
            <span className="block bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Excel In Engineering
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-400">
            Hyper Learning combines syllabus mapping, previous year questions,
            AI-powered learning, and revision tools into one seamless platform.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 p-8 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:bg-slate-950"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
                </div>

                {/* Icon */}
                <div className="relative z-10 mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <Icon className="h-7 w-7" />
                </div>

                {/* Title */}
                <h3 className="relative z-10 text-xl font-semibold text-white">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="relative z-10 mt-4 leading-7 text-slate-400">
                  {feature.description}
                </p>

                {/* Bottom Accent */}
                <div className="relative z-10 mt-8 h-1 w-16 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-20 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-10"
        >
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-3xl font-bold text-white">
                More Than Just Previous Year Questions
              </h3>

              <p className="mt-5 text-lg leading-8 text-slate-400">
                Hyper Learning transforms traditional exam preparation into an
                intelligent learning experience by connecting syllabus topics,
                AI-generated notes, previous year questions, and interactive
                doubt solving into a single platform.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-3xl font-bold text-white">AI</p>
                <p className="mt-2 text-sm text-slate-400">
                  Interactive Learning
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-3xl font-bold text-white">PYQ</p>
                <p className="mt-2 text-sm text-slate-400">
                  Mapped Questions
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-3xl font-bold text-white">Notes</p>
                <p className="mt-2 text-sm text-slate-400">
                  Topic-Based Content
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="mt-2 text-sm text-slate-400">Always Available</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}