"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  BookOpen,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function AIDemo() {
  return (
    <section className="relative overflow-hidden border-b border-border py-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-20 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
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
            AI Learning Assistant
          </span>

          <h2 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Learn Like You're Talking To A
            <span className="block bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Personal Tutor
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-400">
            Ask questions, understand difficult concepts, explore topic-wise
            notes, and prepare for exams with AI-powered guidance.
          </p>
        </motion.div>

        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-400">
                    <BookOpen className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Topic-Based Learning
                    </h3>

                    <p className="mt-2 text-slate-400">
                      Open any syllabus topic and instantly generate detailed
                      explanations, examples, revision notes, and key concepts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-violet-400">
                    <BrainCircuit className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Interactive AI Tutor
                    </h3>

                    <p className="mt-2 text-slate-400">
                      Ask follow-up questions and receive personalized answers
                      based on the topic you're studying.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-400">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Exam Focused Answers
                    </h3>

                    <p className="mt-2 text-slate-400">
                      AI-generated responses are optimized for engineering exam
                      preparation and structured learning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side Chat Demo */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="border-b border-slate-800 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
              </div>

              <div className="space-y-6 p-6">
                {/* Topic */}
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-sm font-medium text-blue-400">
                    Current Topic
                  </p>

                  <h4 className="mt-2 text-lg font-semibold text-white">
                    Complexity Analysis
                  </h4>
                </div>

                {/* User */}
                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white">
                    Explain Big O notation with a real example.
                  </div>
                </div>

                {/* AI */}
                <div className="flex justify-start">
                  <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <div className="mb-2 flex items-center gap-2 text-cyan-400">
                      <BrainCircuit className="h-4 w-4" />
                      <span className="text-sm font-semibold">AI Tutor</span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-300">
                      Big O notation describes how an algorithm's execution time
                      grows as input size increases. For example, Linear Search
                      has O(n) complexity because it may need to check every
                      element in the list.
                    </p>
                  </div>
                </div>

                {/* User */}
                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white">
                    How is it different from O(log n)?
                  </div>
                </div>

                {/* AI */}
                <div className="flex justify-start">
                  <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <div className="mb-2 flex items-center gap-2 text-cyan-400">
                      <BrainCircuit className="h-4 w-4" />
                      <span className="text-sm font-semibold">AI Tutor</span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-300">
                      O(log n) grows much slower than O(n). Binary Search uses
                      O(log n) because it repeatedly halves the search space,
                      making it significantly faster for large datasets.
                    </p>
                  </div>
                </div>

                {/* Input */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Ask a follow-up question...
                    </span>

                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl lg:block">
              <p className="text-sm text-slate-400">
                Follow-up Questions
              </p>

              <p className="mt-1 text-2xl font-bold text-white">3 / 3</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}