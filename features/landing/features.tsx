"use client";

import { motion } from "framer-motion";
import {
  Search,
  Bookmark,
  GraduationCap,
  Layers3,
  Workflow,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Layers3,
    title: "Multi-University Support",
    description:
      "Access curriculum structures, subjects, resources, and academic content across multiple universities from a single platform.",
  },
  {
    icon: Search,
    title: "Unified Smart Search",
    description:
      "Instantly search universities, subjects, units, topics, papers, notes, and learning resources through one powerful search experience.",
  },
  {
    icon: Workflow,
    title: "Connected Learning Journey",
    description:
      "Navigate seamlessly from syllabus topics to notes, related questions, explanations, and revision resources without losing context.",
  },
  {
    icon: Bookmark,
    title: "Personal Study Space",
    description:
      "Save important topics, resources, and study materials to create your own personalized learning dashboard.",
  },
  {
    icon: GraduationCap,
    title: "Structured Academic Experience",
    description:
      "Designed specifically for higher education workflows with organized content, semester structures, and subject-level navigation.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable Learning Resources",
    description:
      "Content is curated and organized to provide a distraction-free environment focused entirely on learning and preparation.",
  },
];

export default function Features() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-24">
      {/* Background Glows - No grid pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-20 h-[450px] w-[450px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-10 h-[450px] w-[450px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Platform Features
          </span>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Designed For Focused
            <br />
            <span className="bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
              Academic Learning
            </span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            A modern educational platform built around organization,
            accessibility, and a distraction-free learning experience.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-background/80 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:hover:border-blue-500/30"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100 blur-3xl dark:bg-blue-500/20" />
                </div>

                <div className="relative z-10 mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-[#1D4ED8] dark:border-blue-500/20 dark:from-blue-500/10 dark:to-indigo-500/10 dark:text-blue-400">
                  <Icon className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
                </div>

                <h3 className="relative z-10 text-xl font-bold text-foreground">
                  {feature.title}
                </h3>

                <p className="relative z-10 mt-4 leading-7 text-muted-foreground">
                  {feature.description}
                </p>

                <div className="relative z-10 mt-8 h-1 w-16 rounded-full bg-gradient-to-r from-[#1D4ED8] to-indigo-500" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
