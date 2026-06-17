"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Sparkles,
} from "lucide-react";

export default function CTA() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10 md:p-16"
        >
          {/* Decorative Glow */}
          <div className="absolute inset-0">
            <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            {/* Badge */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
                <Sparkles className="h-4 w-4" />
                AI-Powered Learning Platform
              </div>
            </div>

            {/* Heading */}
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                Ready To Transform
                <span className="block bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 bg-clip-text text-transparent">
                  The Way You Learn?
                </span>
              </h2>

              <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-400">
                Access syllabus-mapped learning, AI-powered explanations,
                previous year questions, and exam-focused resources — all in one
                platform.
              </p>
            </div>

            {/* Features */}
            <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-xl">
                <BrainCircuit className="mb-3 h-6 w-6 text-blue-400" />

                <h3 className="font-semibold text-white">AI Tutor</h3>

                <p className="mt-2 text-sm text-slate-400">
                  Learn concepts through interactive AI conversations.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-xl">
                <BookOpen className="mb-3 h-6 w-6 text-violet-400" />

                <h3 className="font-semibold text-white">Smart Notes</h3>

                <p className="mt-2 text-sm text-slate-400">
                  AI-generated topic notes with revision-focused content.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 backdrop-blur-xl">
                <Sparkles className="mb-3 h-6 w-6 text-cyan-400" />

                <h3 className="font-semibold text-white">Mapped PYQs</h3>

                <p className="mt-2 text-sm text-slate-400">
                  Connect syllabus topics directly with previous year questions.
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/subjects"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-4 font-semibold text-white transition-all duration-300 hover:bg-blue-500"
              >
                Start Learning
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-7 py-4 font-semibold text-slate-300 transition-all duration-300 hover:border-slate-500 hover:bg-slate-900"
              >
                Explore Platform
              </Link>
            </div>

            {/* Bottom Stats */}
            <div className="mt-14 border-t border-slate-800 pt-10">
              <div className="grid gap-8 text-center md:grid-cols-4">
                <div>
                  <h4 className="text-3xl font-bold text-white">5000+</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Previous Year Questions
                  </p>
                </div>

                <div>
                  <h4 className="text-3xl font-bold text-white">200+</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Learning Topics
                  </p>
                </div>

                <div>
                  <h4 className="text-3xl font-bold text-white">24/7</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    AI Assistance
                  </p>
                </div>

                <div>
                  <h4 className="text-3xl font-bold text-white">Free</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Core Learning Access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}