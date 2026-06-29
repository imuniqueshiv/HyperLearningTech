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
      className="relative overflow-hidden scroll-mt-24 border-b border-border bg-gradient-to-b from-[#FCFCFE] via-[#F8FAFC] to-white dark:bg-none dark:bg-transparent"
    >
      {/* Background Layers */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Restored Wavy Bluish Effect (40% less contrast) */}
        <div className="absolute inset-0 opacity-60 dark:hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[1200px] -rotate-12 rounded-full bg-gradient-to-br from-blue-400/[0.12] via-indigo-300/[0.08] to-transparent blur-[80px]" />
          <div className="absolute top-[20%] right-[-10%] h-[700px] w-[1000px] rotate-12 rounded-full bg-gradient-to-bl from-cyan-300/[0.12] via-blue-300/[0.08] to-transparent blur-[80px]" />
          <div className="absolute bottom-[-10%] left-[15%] h-[600px] w-[900px] -rotate-6 rounded-full bg-gradient-to-tr from-indigo-300/[0.1] via-blue-200/[0.05] to-transparent blur-[80px]" />
        </div>

        {/* Existing subtle glows */}
        <div className="absolute left-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/[0.02] blur-[160px] dark:bg-blue-500/10" />
        <div className="absolute right-[-5%] top-[15%] h-[500px] w-[500px] rounded-full bg-purple-500/[0.02] blur-[160px] dark:bg-indigo-500/10" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8 lg:pb-32 lg:pt-20">
        <div className="grid items-center gap-16 lg:grid-cols-[1.3fr_0.7fr] lg:gap-8">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start font-sans -mt-6 lg:-mt-8"
          >
            {/* Eyebrow pill */}
            <motion.div variants={itemVariants}>
              <div className="mb-10 inline-flex items-center rounded-full border border-indigo-500/25 bg-[rgba(99,102,241,0.1)] py-[6px] pl-[8px] pr-[14px]">
                <div className="mr-2 h-2 w-2 rounded-full bg-[#6366f1] shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                <span className="text-[12px] font-[600] tracking-[0.04em] text-indigo-600 dark:text-[#818cf8]">
                  Smart learning for engineers
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-[54px] font-[800] leading-[1.1] tracking-[-0.03em] lg:text-[64px]"
            >
              <span className="text-slate-900 dark:text-[#f1f5f9]">Master</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent dark:from-[#6366f1] dark:to-[#6366f1] dark:text-[#6366f1] dark:bg-none">
                Engineering
                <span className="text-[#34d399] dark:text-[#34d399]">.</span>
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              variants={itemVariants}
              className="mt-4 text-[19px] font-[600] tracking-[-0.01em] text-slate-600 dark:text-[#e2e8f0]"
            >
              From confusion to confidence.
            </motion.p>

            {/* Body text */}
            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-[560px] text-[15px] leading-[1.8] text-slate-600 dark:text-[#94a3b8]"
            >
              Everything you need for smarter exam preparation—from{" "}
              <span className="font-[600] text-slate-900 dark:font-[500] dark:text-[#cbd5e1]">
                syllabus-mapped PYQs
              </span>{" "}
              and{" "}
              <span className="font-[600] text-slate-900 dark:font-[500] dark:text-[#cbd5e1]">
                AI-powered notes
              </span>{" "}
              to topic-wise explanations and instant AI guidance.
            </motion.p>

            {/* Feature pills row */}
            <motion.div
              variants={itemVariants}
              className="mt-12 flex flex-wrap gap-4"
            >
              <div className="group flex cursor-default items-center gap-2 rounded-[8px] border border-[#D8E2F0] bg-white/80 backdrop-blur-md px-[18px] py-[10px] text-[13px] font-[500] text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:bg-white hover:text-indigo-600 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-[#94a3b8] dark:shadow-none dark:hover:border-indigo-500/[0.35] dark:hover:bg-white/[0.04] dark:hover:text-[#c7d2fe]">
                <div className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[rgba(99,102,241,0.2)]">
                  <BrainCircuit className="h-3 w-3 text-indigo-600 dark:text-[#818cf8]" />
                </div>
                AI-powered notes
              </div>
              <div className="group flex cursor-default items-center gap-2 rounded-[8px] border border-[#D8E2F0] bg-white/80 backdrop-blur-md px-[18px] py-[10px] text-[13px] font-[500] text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:bg-white hover:text-indigo-600 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-[#94a3b8] dark:shadow-none dark:hover:border-indigo-500/[0.35] dark:hover:bg-white/[0.04] dark:hover:text-[#c7d2fe]">
                <div className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[rgba(52,211,153,0.15)]">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-[#34d399]" />
                </div>
                Syllabus mapped
              </div>
              <div className="group flex cursor-default items-center gap-2 rounded-[8px] border border-[#D8E2F0] bg-white/80 backdrop-blur-md px-[18px] py-[10px] text-[13px] font-[500] text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:bg-white hover:text-indigo-600 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-[#94a3b8] dark:shadow-none dark:hover:border-indigo-500/[0.35] dark:hover:bg-white/[0.04] dark:hover:text-[#c7d2fe]">
                <div className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[rgba(59,130,246,0.15)]">
                  <svg
                    className="h-3 w-3 text-blue-500 dark:text-[#60a5fa]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                Topic-wise PYQs
              </div>
              <div className="group flex cursor-default items-center gap-2 rounded-[8px] border border-[#D8E2F0] bg-white/80 backdrop-blur-md px-[18px] py-[10px] text-[13px] font-[500] text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:bg-white hover:text-indigo-600 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-[#94a3b8] dark:shadow-none dark:hover:border-indigo-500/[0.35] dark:hover:bg-white/[0.04] dark:hover:text-[#c7d2fe]">
                <div className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[rgba(99,102,241,0.2)]">
                  <BrainCircuit className="h-3 w-3 text-indigo-600 dark:text-[#818cf8]" />
                </div>
                Instant AI help
              </div>
            </motion.div>

            {/* CTA buttons row */}
            <motion.div
              variants={itemVariants}
              className="mt-8 mb-4 flex flex-row gap-[16px]"
            >
              <a
                href="#Universities"
                onClick={scrollToUniversities}
                className="group flex cursor-pointer items-center gap-2 rounded-[12px] bg-gradient-to-br from-[#4f46e5] to-[#6366f1] px-[32px] py-[18px] text-[16px] font-[600] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_30px_rgba(99,102,241,0.25)] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-[1px] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_20px_50px_rgba(99,102,241,0.3)] active:scale-[0.98]"
              >
                Start Learning
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-white/15">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </a>

              <Link
                href="/about"
                className="flex cursor-pointer items-center gap-2 rounded-[12px] border border-[#D8E2F0] bg-transparent px-[28px] py-[15px] text-[15px] font-[600] text-slate-600 transition-all duration-300 hover:border-[#C4D2E5] hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:text-slate-900 dark:border-white/10 dark:text-[#94a3b8] dark:hover:border-white/20 dark:hover:bg-transparent dark:hover:shadow-none dark:hover:text-[#e2e8f0]"
              >
                Explore platform ↗
              </Link>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="mt-2 h-[1px] w-full bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.03)_20%,rgba(0,0,0,0.03)_80%,transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06)_20%,rgba(255,255,255,0.06)_80%,transparent)]"
            />

            {/* Stats row */}
            <motion.div variants={itemVariants} className="mt-2 flex flex-row">
              <div className="pr-[32px]">
                <div className="text-[32px] font-[800] tracking-[-0.04em] text-gray-900 dark:text-[#f1f5f9]">
                  <Counter to={25} />
                  <span className="text-[#6366f1]">+</span>
                </div>
                <div className="mt-1 text-[10px] font-[600] uppercase tracking-[0.08em] text-slate-500 dark:text-[#475569]">
                  Years of PYQs
                </div>
              </div>
              <div className="border-l border-slate-200 px-[32px] dark:border-white/10">
                <div className="text-[32px] font-[800] tracking-[-0.04em] text-gray-900 dark:text-[#f1f5f9]">
                  <Counter to={100} />
                  <span className="text-[#6366f1]">%</span>
                </div>
                <div className="mt-1 text-[10px] font-[600] uppercase tracking-[0.08em] text-slate-500 dark:text-[#475569]">
                  Syllabus Mapped
                </div>
              </div>
              <div className="border-l border-slate-200 pl-[32px] dark:border-white/10">
                <div className="text-[32px] font-[800] tracking-[-0.04em] text-gray-900 dark:text-[#f1f5f9]">
                  <Counter to={24} />
                  <span className="text-[#6366f1]">/7</span>
                </div>
                <div className="mt-1 text-[10px] font-[600] uppercase tracking-[0.08em] text-slate-500 dark:text-[#475569]">
                  AI Assistant
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Mockup */}
          {/* Right Mockup */}
          {/* Right Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative mx-auto mt-16 flex w-full max-w-[500px] justify-center lg:mt-0 lg:max-w-none lg:justify-end"
          >
            {/* Glowing aura for Light Mode behind AI card */}
            <div className="absolute inset-0 -z-10 rounded-[24px] bg-indigo-500/20 blur-[60px] dark:bg-transparent" />
            <div className="relative w-full max-w-[440px] origin-top scale-[1.05] overflow-hidden rounded-[24px] border border-indigo-100 dark:border-white/[0.06] bg-gradient-to-br from-indigo-100 via-white/80 to-purple-100 dark:bg-none dark:bg-white/5 p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl font-sans lg:origin-left lg:scale-[1.08]">
              {/* Chat Header */}
              <div className="-mt-6 -mx-6 mb-5 flex items-center gap-3 border-b border-indigo-100 dark:border-white/[0.06] bg-[#F4F7FF] dark:bg-white/[0.02] px-6 pt-6 pb-4 backdrop-blur-md">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-r from-[#5964F4] to-[#7D52F5] shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                  <BrainCircuit
                    className="h-[18px] w-[18px] text-white"
                    strokeWidth={2.2}
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <h3 className="text-[14px] font-[600] leading-tight text-slate-800 dark:text-[#f0f0f5]">
                    Hyper AI
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_5px_rgba(52,211,153,0.6)]" />
                    <p className="text-[12px] font-medium leading-tight text-slate-500 dark:text-gray-400">
                      Online • Ready to Help
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-[20px_20px_6px_20px] bg-gradient-to-r from-[#5B6EFF] to-[#8B5CF6] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_3px_10px_rgba(91,110,255,0.3)]">
                    Explain Big O notation with an example.
                  </div>
                </div>

                {/* Hyper AI Message */}
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-indigo-500/10">
                      <BrainCircuit
                        className="h-3.5 w-3.5 text-[#818cf8]"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-[12px] font-[600] text-[#818cf8]">
                      Hyper AI
                    </span>
                  </div>

                  <div className="w-full rounded-[16px] border border-indigo-50 dark:border-white/5 bg-white/80 dark:bg-white/[0.09] px-5 py-4">
                    <div className="space-y-2">
                      <p className="text-[13px] leading-[1.7] text-slate-600 dark:text-[#c8ccd8]">
                        Big O notation represents the maximum growth rate of an
                        algorithm as input size increases.
                      </p>

                      <p className="text-[13px] leading-[1.7] text-slate-600 dark:text-[#c8ccd8]">
                        For example, Linear Search has{" "}
                        <span className="font-semibold text-[#60a5fa]">
                          O(n)
                        </span>{" "}
                        complexity because each element may need to be checked
                        once.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Related Questions */}
                <div className="flex flex-col overflow-hidden rounded-[16px] border border-indigo-50 dark:border-white/5 bg-white dark:bg-white/[0.05]">
                  <div className="flex items-center gap-2 px-5 pb-1.5 pt-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_4px_rgba(129,140,248,0.5)]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#818cf8]">
                      Related Previous Year Questions
                    </p>
                  </div>

                  <div className="flex flex-col divide-y divide-indigo-50 dark:divide-white/[0.02]">
                    <div className="group flex cursor-pointer items-center justify-between px-5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          className="h-4 w-4 text-[#34d399] drop-shadow-[0_0_3px_rgba(52,211,153,0.4)]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[13px] font-medium text-slate-600 dark:text-[#d1d5db]">
                          Dec 2025 — Q1(b)
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 dark:text-gray-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#818cf8]" />
                    </div>

                    <div className="group flex cursor-pointer items-center justify-between px-5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          className="h-4 w-4 text-[#34d399] drop-shadow-[0_0_3px_rgba(52,211,153,0.4)]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[13px] font-medium text-slate-600 dark:text-[#d1d5db]">
                          Jun 2025 — Q3(a)
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 dark:text-gray-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#818cf8]" />
                    </div>

                    <div className="group flex cursor-pointer items-center justify-between px-5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          className="h-4 w-4 text-[#34d399] drop-shadow-[0_0_3px_rgba(52,211,153,0.4)]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[13px] font-medium text-slate-600 dark:text-[#d1d5db]">
                          Dec 2024 — Q2
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 dark:text-gray-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#818cf8]" />
                    </div>
                  </div>
                </div>

                <div className="group mt-3 flex items-center justify-between rounded-[16px] border border-indigo-100 dark:border-transparent bg-white/90 dark:bg-white/[0.04] px-4 py-3.5 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-indigo-300/50 dark:hover:border-indigo-500/50 hover:shadow-[0_4px_20px_-10px_rgba(99,102,241,0.2)] dark:hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_0_15px_rgba(99,102,241,0.2)]">
                  <span className="text-[13px] font-medium text-slate-400 dark:text-[#6b7280]">
                    Ask Hyper AI anything...
                  </span>
                  <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_4px_12px_rgba(168,85,247,0.25)] transition-transform hover:scale-105">
                    <ArrowRight className="h-4 w-4 text-white" />
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
