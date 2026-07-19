"use client";

import { useEffect, useRef } from "react";
import { motion, Variants, animate, useInView } from "framer-motion";
import { BrainCircuit, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { landingStats } from "@/lib/data/landing";

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
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (inView && ref.current) {
      animate(from, to, {
        duration: 2,
        ease: [0.22, 1, 0.36, 1],
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

export default function Stats() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25, scale: 0.9, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  // Convert string to number for animation. We handle "500+", "200+", "24/7", "100%"
  const getNumberInfo = (title: string) => {
    if (title.includes("+")) {
      return { num: parseInt(title), suffix: "+" };
    }
    if (title.includes("%")) {
      return { num: parseInt(title), suffix: "%" };
    }
    if (title === "24/7") {
      return { num: 24, suffix: "/7" };
    }
    return { num: parseInt(title) || 0, suffix: "" };
  };

  return (
    <section className="relative flex min-h-[calc(100vh-72px)] flex-col items-center justify-center overflow-hidden border-b border-slate-100 bg-white py-8 lg:py-10 dark:border-border dark:bg-background">
      {/* Premium High-Contrast Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Light Mode Blobs - Premium prominent pastel mesh */}
        <div className="absolute -left-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-cyan-400/15 via-blue-500/10 to-transparent blur-[120px] dark:hidden pointer-events-none" />
        <div className="absolute -right-[10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-fuchsia-400/15 via-purple-500/10 to-transparent blur-[120px] dark:hidden pointer-events-none" />

        {/* Dark Mode Blobs */}
        <div className="hidden dark:block absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="hidden dark:block absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-col items-center text-center font-sans"
        >
          {/* Eyebrow Pill */}
          <motion.div variants={itemVariants}>
            <div className="mb-4 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 py-[4px] pl-[10px] pr-[12px] shadow-sm dark:bg-[rgba(99,102,241,0.05)] dark:border-indigo-400/20 dark:backdrop-blur-md">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-[11px] font-[700] tracking-[0.05em] uppercase text-indigo-700 dark:text-indigo-300">
                Platform Statistics
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h2
            variants={itemVariants}
            className="text-[32px] md:text-[40px] lg:text-[48px] font-[900] leading-[1.05] tracking-[-0.03em] text-slate-900 dark:text-white max-w-3xl drop-shadow-sm dark:drop-shadow-none"
          >
            Everything You Need
            <br />
            <span className="text-blue-600 dark:bg-gradient-to-r dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
              To Learn With Clarity
            </span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-[560px] text-[14px] md:text-[15px] leading-[1.6] font-[500] text-slate-600 dark:text-slate-300"
          >
            Hyper Learning brings together previous year questions, AI-powered
            explanations, syllabus mapping, and smart revision tools.
          </motion.p>

          {/* Enhanced Stats Cards */}
          <motion.div
            variants={itemVariants}
            className="mt-8 lg:mt-10 grid w-full gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4"
          >
            {landingStats.map((stat, i) => {
              const Icon = stat.icon;
              const { num, suffix } = getNumberInfo(stat.title);

              const solidColors = [
                "bg-[#3B82F6] shadow-blue-500/20", // Solid Blue
                "bg-[#EC4899] shadow-pink-500/20", // Solid Pink
                "bg-[#06B6D4] shadow-cyan-500/20", // Solid Cyan
                "bg-[#8B5CF6] shadow-purple-500/20", // Solid Purple
              ];

              return (
                <div
                  key={stat.title}
                  className="group relative overflow-hidden rounded-[16px] sm:rounded-[20px] border border-transparent bg-white p-4 sm:p-5 md:p-6 text-left shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.02] hover:-translate-y-1 hover:border-indigo-400/50 hover:bg-white hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.25)] dark:border-white/[0.08] dark:bg-[#0f172a]/60 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] dark:hover:border-indigo-500/[0.2] dark:hover:bg-[#1e293b]/80 flex flex-col justify-between"
                >
                  <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div
                      className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${solidColors[i % 4].split(" ")[0]} opacity-5 dark:opacity-20 blur-2xl`}
                    />
                  </div>

                  <div
                    className={`mb-3 sm:mb-4 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-[10px] sm:rounded-[12px] text-white shadow-sm ${solidColors[i % 4]} dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:border dark:border-white/10`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-500 group-hover:scale-110" />
                  </div>

                  <div>
                    <h3 className="text-[24px] sm:text-[28px] md:text-[36px] font-[900] tracking-[-0.04em] text-slate-900 dark:text-white leading-none">
                      <Counter to={num} suffix={suffix} />
                    </h3>
                    <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-[13px] font-[600] tracking-tight text-slate-500 dark:text-slate-400 leading-tight">
                      {stat.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Bottom Premium Feature Strip */}
          <motion.div
            variants={itemVariants}
            className="relative mt-5 sm:mt-6 lg:mt-8 w-full overflow-hidden rounded-[16px] sm:rounded-[20px] border border-transparent bg-white p-4 sm:p-5 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.01] hover:border-indigo-400/30 hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.2)] dark:border-white/[0.08] dark:bg-[#0f172a]/60 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] dark:hover:border-indigo-500/[0.2] dark:hover:bg-[#1e293b]/80"
          >
            {/* Subtle glow inside the strip */}
            <div className="absolute left-1/2 top-0 -z-10 h-full w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-500/[0.02] to-transparent dark:via-indigo-500/[0.03]" />

            <div className="flex flex-col md:grid md:grid-cols-3 gap-5 md:gap-0 md:divide-x md:divide-slate-100 md:dark:divide-white/[0.08]">
              <div className="flex flex-row md:flex-col items-start md:items-start text-left md:pr-8 gap-3.5 md:gap-0">
                <div className="shrink-0 md:mb-3 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[10px] bg-[#6366F1] text-white shadow-sm shadow-indigo-500/20 transition-transform duration-500 hover:scale-105 hover:rotate-3 dark:bg-indigo-500/20 dark:border dark:border-indigo-400/30 dark:text-indigo-300 dark:shadow-none">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14px] sm:text-[16px] font-[800] text-slate-900 dark:text-white leading-tight">
                    AI Tutor
                  </h4>
                  <p className="mt-0.5 md:mt-1.5 text-[12px] sm:text-[13px] leading-[1.5] sm:leading-[1.6] font-[500] text-slate-600 dark:text-slate-400">
                    Interactive learning with topic-based explanations,
                    follow-up questions, and concept clarification.
                  </p>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-start md:items-start text-left md:px-8 gap-3.5 md:gap-0">
                <div className="shrink-0 md:mb-3 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[10px] bg-[#3B82F6] text-white shadow-sm shadow-blue-500/20 transition-transform duration-500 hover:scale-105 hover:rotate-3 dark:bg-blue-500/20 dark:border dark:border-blue-400/30 dark:text-blue-300 dark:shadow-none">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14px] sm:text-[16px] font-[800] text-slate-900 dark:text-white leading-tight">
                    Mapped PYQs
                  </h4>
                  <p className="mt-0.5 md:mt-1.5 text-[12px] sm:text-[13px] leading-[1.5] sm:leading-[1.6] font-[500] text-slate-600 dark:text-slate-400">
                    Previous year questions connected directly with syllabus
                    topics, saving your valuable time.
                  </p>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-start md:items-start text-left md:pl-8 gap-3.5 md:gap-0">
                <div className="shrink-0 md:mb-3 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[10px] bg-[#10B981] text-white shadow-sm shadow-emerald-500/20 transition-transform duration-500 hover:scale-105 hover:rotate-3 dark:bg-emerald-500/20 dark:border dark:border-emerald-400/30 dark:text-emerald-300 dark:shadow-none">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14px] sm:text-[16px] font-[800] text-slate-900 dark:text-white leading-tight">
                    Smart Revision
                  </h4>
                  <p className="mt-0.5 md:mt-1.5 text-[12px] sm:text-[13px] leading-[1.5] sm:leading-[1.6] font-[500] text-slate-600 dark:text-slate-400">
                    Learn faster through structured notes, concise summaries,
                    and targeted exam-focused content.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
