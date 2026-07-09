"use client";

import { motion, Variants } from "framer-motion";
import { Sparkles } from "lucide-react";
import { landingFeatures } from "@/lib/data/landing";

export default function Features() {
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

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden border-b border-slate-100 bg-[#FAFAFA] py-8 lg:py-10 dark:border-border dark:bg-background">
      {/* Premium High-Contrast Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Light Mode Blobs - Premium prominent pastel mesh */}
        <div className="absolute -left-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-cyan-400/15 via-blue-500/10 to-transparent blur-[120px] dark:hidden pointer-events-none" />
        <div className="absolute -right-[10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-fuchsia-400/15 via-purple-500/10 to-transparent blur-[120px] dark:hidden pointer-events-none" />
        
        {/* Dark Mode Blobs */}
        <div className="hidden dark:block absolute left-[-10%] top-[10%] h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="hidden dark:block absolute bottom-[10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
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
                Platform Features
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h2
            variants={itemVariants}
            className="text-[32px] md:text-[40px] lg:text-[48px] font-[900] leading-[1.05] tracking-[-0.03em] text-slate-900 dark:text-white max-w-3xl drop-shadow-sm dark:drop-shadow-none"
          >
            Designed For Focused
            <br />
            <span className="text-blue-600 dark:bg-gradient-to-r dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
              Academic Learning
            </span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-[560px] text-[14px] md:text-[15px] leading-[1.6] font-[500] text-slate-600 dark:text-slate-300"
          >
            A modern educational platform built around organization,
            accessibility, and a distraction-free learning experience.
          </motion.p>

          {/* Feature Cards Grid */}
          <motion.div variants={itemVariants} className="mt-8 lg:mt-10 flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-5 divide-y sm:divide-y-0 divide-slate-100 sm:divide-transparent bg-white sm:bg-transparent rounded-[24px] sm:rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:shadow-none border border-slate-100 sm:border-transparent overflow-hidden sm:overflow-visible dark:border-white/[0.08] dark:divide-white/[0.08] dark:bg-[#0f172a]/40 sm:dark:bg-transparent">
            {landingFeatures.map((feature, i) => {
              const Icon = feature.icon;
              
              const theme = [
                { id: "purple", bg: "bg-purple-100 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", text: "text-purple-600 dark:text-purple-400", glow: "bg-purple-500/20" },
                { id: "pink", bg: "bg-pink-100 dark:bg-pink-500/10", border: "border-pink-200 dark:border-pink-500/20", text: "text-pink-600 dark:text-pink-400", glow: "bg-pink-500/20" },
                { id: "cyan", bg: "bg-cyan-100 dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-500/20", text: "text-cyan-600 dark:text-cyan-400", glow: "bg-cyan-500/20" },
                { id: "emerald", bg: "bg-emerald-100 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", glow: "bg-emerald-500/20" },
                { id: "orange", bg: "bg-orange-100 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20", text: "text-orange-600 dark:text-orange-400", glow: "bg-orange-500/20" },
                { id: "blue", bg: "bg-blue-100 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", text: "text-blue-600 dark:text-blue-400", glow: "bg-blue-500/20" }
              ];
              const t = theme[i % 6];

              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden sm:rounded-[20px] sm:border border-transparent sm:bg-white p-4 sm:p-6 lg:p-7 text-left sm:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-slate-50 sm:hover:bg-white sm:hover:scale-[1.01] sm:hover:-translate-y-1 sm:hover:border-indigo-400/30 sm:hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.15)] sm:dark:border-white/[0.06] sm:dark:bg-[#0A0F1C]/60 sm:dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] dark:hover:bg-white/[0.02] sm:dark:hover:border-indigo-500/[0.15] sm:dark:hover:bg-[#0f172a]/80 sm:dark:backdrop-blur-xl flex flex-row sm:flex-col items-start gap-4 sm:gap-0 h-full"
                >
                  {/* Subtle hover glow behind icon (hidden on mobile to keep list clean) */}
                  <div className="hidden sm:block absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none">
                    <div className={`absolute -left-8 -top-8 h-32 w-32 rounded-full ${t.glow} blur-3xl`} />
                  </div>

                  <div className={`relative shrink-0 sm:mb-6 inline-flex h-[42px] w-[42px] sm:h-14 sm:w-14 items-center justify-center rounded-[12px] sm:rounded-[16px] border ${t.bg} ${t.border} transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                    <div className={`absolute inset-0 rounded-[12px] sm:rounded-[16px] ${t.glow} blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <Icon className={`relative z-10 h-5 w-5 sm:h-6 sm:w-6 ${t.text}`} strokeWidth={2.2} />
                  </div>

                  <div className="flex flex-col flex-grow pt-1 sm:pt-0">
                    <h3 className="text-[15px] sm:text-[17px] font-[800] tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="mt-1 sm:mt-2 text-[13px] sm:text-[14px] leading-[1.6] sm:leading-[1.65] font-[500] text-slate-500 dark:text-[#94a3b8]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
