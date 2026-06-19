"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#F7F9FC]">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute right-0 top-20 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid items-center gap-20 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <Sparkles className="h-4 w-4" />
              Trusted Learning Companion for Engineering Students
            </div>

            {/* Heading */}
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
              Learn Better.
              <br />
              <span className="text-[#1D4ED8]">
                Study Smarter.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-8 max-w-2xl text-lg leading-9 text-slate-600">
              Access syllabus-mapped previous year questions, AI-powered notes,
              topic-wise explanations, and instant learning support designed to
              help you prepare efficiently and perform confidently in your
              university examinations.
            </p>

            {/* Buttons */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/subjects"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-[#1E40AF]"
              >
                Start Learning
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition-all duration-300 hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
              >
                Explore Platform
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid max-w-xl grid-cols-3 gap-8 border-t border-slate-200 pt-8">
              <div>
                <p className="text-3xl font-bold text-[#1D4ED8]">2022-25</p>
                <p className="mt-2 text-sm text-slate-500">
                  PYQ Coverage
                </p>
              </div>

              <div>
                <p className="text-3xl font-bold text-[#1D4ED8]">100%</p>
                <p className="mt-2 text-sm text-slate-500">
                  Syllabus Mapped
                </p>
              </div>

              <div>
                <p className="text-3xl font-bold text-[#1D4ED8]">AI</p>
                <p className="mt-2 text-sm text-slate-500">
                  Instant Answers
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              {/* Syllabus Topic */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2 text-[#1D4ED8]">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-semibold">
                    Unit 1 • Complexity Analysis
                  </span>
                </div>

                <p className="text-sm leading-7 text-slate-600">
                  Understand algorithm efficiency through Big O, Omega and Theta
                  notation with simplified explanations and exam-focused notes.
                </p>
              </div>

              {/* Question */}
              <div className="mt-5 flex justify-end">
                <div className="rounded-2xl bg-[#1D4ED8] px-4 py-3 text-sm text-white">
                  Explain Big O notation with an example.
                </div>
              </div>

              {/* Answer */}
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2 text-[#1D4ED8]">
                  <BrainCircuit className="h-4 w-4" />
                  <span className="font-semibold">
                    AI Learning Assistant
                  </span>
                </div>

                <p className="text-sm leading-7 text-slate-700">
                  Big O notation represents the maximum growth rate of an
                  algorithm as input size increases. For example, Linear Search
                  has O(n) complexity because each element may need to be
                  checked once.
                </p>
              </div>

              {/* Related Questions */}
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8]">
                  Related Previous Year Questions
                </p>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>✓ Dec 2025 — Q1(b)</p>
                  <p>✓ Jun 2025 — Q3(a)</p>
                  <p>✓ Dec 2024 — Q2</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}