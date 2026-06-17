"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute right-0 top-40 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col justify-center px-6 py-24 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              <Sparkles className="h-4 w-4" />
              AI-Powered Learning Platform for RGPV Students
            </div>

            {/* Heading */}
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
              Learn Smarter.
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 bg-clip-text text-transparent">
                Not Harder.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400">
              Hyper Learning helps RGPV students master their syllabus through
              AI-powered notes, mapped previous year questions, instant
              solutions, and interactive topic-wise learning experiences.
            </p>

            {/* Buttons */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/subjects"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-500"
              >
                Start Learning
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition-all duration-300 hover:border-slate-500 hover:bg-slate-900"
              >
                Explore Platform
              </Link>
            </div>

            {/* Mini Stats */}
            <div className="mt-12 flex flex-wrap gap-8">
              <div>
                <p className="text-3xl font-bold text-white">5000+</p>
                <p className="text-sm text-slate-500">Questions</p>
              </div>

              <div>
                <p className="text-3xl font-bold text-white">200+</p>
                <p className="text-sm text-slate-500">Topics</p>
              </div>

              <div>
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-sm text-slate-500">AI Assistance</p>
              </div>
            </div>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl">
              {/* Window Header */}
              <div className="mb-6 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>

              {/* AI Tutor */}
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="mb-2 flex items-center gap-2 text-blue-400">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Data Structure → Complexity Analysis
                    </span>
                  </div>

                  <p className="text-sm text-slate-400">
                    Time complexity measures how execution time grows with input
                    size. Common notations include Big O, Omega, and Theta.
                  </p>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white">
                    Explain Big O notation with an example.
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <div className="mb-2 flex items-center gap-2 text-cyan-400">
                      <BrainCircuit className="h-4 w-4" />
                      <span className="text-sm font-semibold">AI Tutor</span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-300">
                      Big O describes the worst-case growth rate of an
                      algorithm. For example, linear search checks elements one
                      by one and has O(n) complexity because execution time
                      grows proportionally with input size.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
                    Related PYQs
                  </p>

                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <p>✓ Dec 2025 — Q1(b)</p>
                    <p>✓ June 2025 — Q3(a)</p>
                    <p>✓ Dec 2024 — Q2</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
