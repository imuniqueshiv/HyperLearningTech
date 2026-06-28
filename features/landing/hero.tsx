"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2 } from "lucide-react";
import { motion, Variants, animate, useInView } from "framer-motion";

function Counter({
  from = 0,
  to,
  suffix = "",
  prefix = "",
}: {
  from?: number;
  to: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView && ref.current) {
      animate(from, to, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate: (value) => {
          if (ref.current) {
            ref.current.textContent = `${prefix}${Math.round(value)}${suffix}`;
          }
        },
      });
    }
  }, [inView, from, to, prefix, suffix]);

  return (
    <span ref={ref}>
      {prefix}
      {from}
      {suffix}
    </span>
  );
}

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
  const scrollToUniversities = () => {
    const section = document.getElementById("Universities");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      id="Home"
      className="relative overflow-hidden border-b border-border bg-background"
    >
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
              <div className="badge-shimmer mb-8 inline-flex items-center gap-2.5 rounded-full border border-blue-200/40 bg-blue-50/80 px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-500/15 dark:bg-blue-500/10 dark:text-blue-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Smart Learning for Engineers
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={itemVariants}
              className="max-w-4xl text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl leading-[1.05]"
            >
              <span className="bg-gradient-to-b from-[hsl(var(--foreground))] to-[hsl(var(--muted-foreground))] bg-clip-text text-transparent">
                Learn Better.
              </span>
              <br />
              <span className="relative">
                <span className="relative bg-gradient-to-r from-[#1D4ED8] to-indigo-500 bg-clip-text text-transparent">
                  Study Smarter.
                </span>
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 mb-1 text-base font-normal text-muted-foreground/90 md:text-lg lg:text-xl tracking-wide"
            >
              &quot;Minimizing Distractions, Maximizing Clarity.&quot;
            </motion.p>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-2xl text-lg leading-7 text-muted-foreground"
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
              <a
                href="#Universities"
                onClick={scrollToUniversities}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1D4ED8] px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:bg-[#1E40AF] hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Start Learning
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>

              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background/50 px-8 py-3.5 font-semibold text-foreground backdrop-blur-sm transition-all duration-300 hover:border-[#1D4ED8]/50 hover:bg-background hover:text-[#1D4ED8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Explore Platform
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="mt-14 grid max-w-xl grid-cols-3 divide-x divide-border/50 border-t border-border/60 pt-8"
            >
              <div className="pr-6">
                <p className="text-3xl font-extrabold tracking-tight text-foreground">
                  <Counter to={25} suffix="+" />
                </p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Years of PYQs
                </p>
              </div>
              <div className="px-6">
                <p className="text-3xl font-extrabold tracking-tight text-foreground">
                  <Counter to={100} suffix="%" />
                </p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Syllabus Mapped
                </p>
              </div>
              <div className="pl-6">
                <p className="text-3xl font-extrabold tracking-tight text-foreground">
                  <Counter to={24} suffix="/7" />
                </p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
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
            <div className="relative rounded-[2rem] border border-border/20 dark:border-white/[0.08] bg-transparent p-[5px] shadow-[0_0_20px_rgba(29,78,216,0.02)] dark:shadow-[0_0_30px_rgba(29,78,216,0.04)] backdrop-blur-xl">
              <div className="relative h-full w-full rounded-[calc(2rem-5px)] border border-border/35 dark:border-white/[0.05] bg-background/80 p-6 shadow-inner">
                {/* Chat Header */}
                <div className="mb-6 flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D4ED8]/10">
                      <BrainCircuit className="h-5 w-5 text-[#1D4ED8]" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground">
                        Hyper AI
                      </h3>

                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        Online • Ready to Help
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm bg-[#1D4ED8] px-5 py-3 text-sm font-medium text-white shadow-sm">
                      Explain Big O notation with an example.
                    </div>
                  </div>

                  {/* Hyper AI Message */}
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm border border-border/50 dark:border-white/[0.05] bg-card px-5 py-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1D4ED8]/10">
                          <BrainCircuit className="h-4 w-4 text-[#1D4ED8]" />
                        </div>

                        <span className="text-sm font-semibold text-[#1D4ED8]">
                          Hyper AI
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-foreground/80">
                        Big O notation represents the maximum growth rate of an
                        algorithm as input size increases.
                      </p>

                      <p className="mt-2.5 text-sm leading-6 text-foreground/80">
                        For example, Linear Search has{" "}
                        <span className="font-semibold text-[#1D4ED8]">
                          O(n)
                        </span>{" "}
                        complexity because each element may need to be checked
                        once.
                      </p>
                    </div>
                  </div>

                  {/* Related Questions */}
                  <div className="rounded-2xl border border-border/50 bg-muted/30 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8]">
                      Related Previous Year Questions
                    </p>

                    <div className="mt-2 space-y-1 text-sm font-medium text-foreground/80">
                      <div className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-foreground/5 -mx-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 transition-transform group-hover:scale-110" />
                        Dec 2025 — Q1(b)
                      </div>

                      <div className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-foreground/5 -mx-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 transition-transform group-hover:scale-110" />
                        Jun 2025 — Q3(a)
                      </div>

                      <div className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-foreground/5 -mx-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 transition-transform group-hover:scale-110" />
                        Dec 2024 — Q2
                      </div>
                    </div>
                  </div>

                  {/* Input Box */}
                  <div className="rounded-2xl border border-border/50 bg-muted/30 px-5 py-3.5 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 hover:border-border cursor-text">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Ask Hyper AI anything...
                      </span>

                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
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
