"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      {/* Background Glows - Removed grid pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute right-[-5%] top-[15%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Trusted Learning Companion for Engineering Students
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={itemVariants}
              className="max-w-4xl text-5xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl leading-[1.1]"
            >
              Learn Better.
              <br />
              <span className="bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
                Study Smarter.
              </span>
              <br />
              <span className="text-base font-medium italic text-muted-foreground md:text-xl lg:text-2xl">
                &quot;Minimizing Distractions, Maximizing Clarity.&quot;
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
            >
              Access syllabus-mapped previous year questions, AI-powered notes,
              topic-wise explanations, and instant learning support designed to
              help you prepare efficiently and perform confidently in your
              university examinations.
            </motion.p>

            {/* Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/subjects"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1D4ED8] px-8 py-4 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:bg-[#1E40AF] hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                Start Learning
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-xl border-2 border-border bg-background/50 px-8 py-4 font-semibold text-foreground backdrop-blur-sm transition-all duration-300 hover:border-[#1D4ED8] hover:bg-background hover:text-[#1D4ED8]"
              >
                Explore Platform
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="mt-16 grid max-w-xl grid-cols-3 gap-6 border-t border-border/60 pt-10"
            >
              <div>
                <p className="text-3xl font-black text-foreground">22-25</p>
                <p className="mt-1.5 font-medium text-sm text-muted-foreground">
                  PYQ Coverage
                </p>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground">100%</p>
                <p className="mt-1.5 font-medium text-sm text-muted-foreground">
                  Syllabus Mapped
                </p>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground">24/7</p>
                <p className="mt-1.5 font-medium text-sm text-muted-foreground">
                  AI Assistant
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-[2rem] border border-border/60 bg-background/80 p-6 shadow-2xl backdrop-blur-xl">
              {/* Chat Header */}
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D4ED8]/10">
                    <BrainCircuit className="h-5 w-5 text-[#1D4ED8]" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">Hyper AI</h3>

                    <p className="text-xs text-muted-foreground">
                      Online • Ready to Help
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#1D4ED8] px-5 py-3 text-sm font-medium text-white">
                    Explain Big O notation with an example.
                  </div>
                </div>

                {/* Hyper AI Message */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-card px-5 py-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1D4ED8]/10">
                        <BrainCircuit className="h-4 w-4 text-[#1D4ED8]" />
                      </div>

                      <span className="text-sm font-semibold text-[#1D4ED8]">
                        Hyper AI
                      </span>
                    </div>

                    <p className="text-sm leading-7 text-foreground/80">
                      Big O notation represents the maximum growth rate of an
                      algorithm as input size increases.
                    </p>

                    <p className="mt-3 text-sm leading-7 text-foreground/80">
                      For example, Linear Search has{" "}
                      <span className="font-semibold text-[#1D4ED8]">O(n)</span>{" "}
                      complexity because each element may need to be checked
                      once.
                    </p>
                  </div>
                </div>

                {/* Related Questions */}
                <div className="rounded-2xl border border-border bg-muted/30 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                    Related Previous Year Questions
                  </p>

                  <div className="mt-4 space-y-3 text-sm font-medium text-foreground/80">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Dec 2025 — Q1(b)
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Jun 2025 — Q3(a)
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Dec 2024 — Q2
                    </div>
                  </div>
                </div>

                {/* Input Box */}
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Ask Hyper AI anything...
                    </span>

                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
