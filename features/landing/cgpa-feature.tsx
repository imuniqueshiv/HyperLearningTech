"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calculator,
  Target,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  LineChart,
  Sparkles,
} from "lucide-react";

export default function CgpaFeature() {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-white to-slate-50 dark:bg-none py-12 lg:py-20 dark:border-white/5 dark:bg-[#020617] min-h-[80vh] lg:min-h-0">
      {/* Ultra-Premium Ambient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-600/20 dark:via-purple-900/10 blur-[120px]" />
        <div className="absolute bottom-[0%] right-[5%] h-[700px] w-[700px] rounded-full bg-gradient-to-bl from-blue-500/10 via-cyan-500/5 to-transparent dark:from-blue-600/20 dark:via-cyan-900/10 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start text-left"
          >
            {/* Glowing Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
              <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
                Academic Blueprint
              </span>
            </div>

            <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-5xl dark:text-white">
              Precision <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                goal tracking.
              </span>
            </h2>

            <p className="mb-6 text-base font-medium leading-relaxed text-slate-600 md:text-lg dark:text-slate-400 max-w-xl">
              Stop guessing your grades. Use our intelligent Target CGPA
              Calculator to mathematically map out your remaining semesters and
              guarantee your dream placements.
            </p>

            {/* Premium Feature List */}
            <div className="mb-8 space-y-4 w-full">
              {[
                {
                  icon: Target,
                  title: "Smart Recovery Planning",
                  desc: "Instantly calculate the exact SGPA needed to reach your target CGPA.",
                  color: "bg-blue-500 text-blue-500",
                },
                {
                  icon: Briefcase,
                  title: "Live Placement Radar",
                  desc: "Instantly know if you qualify for Tier-1, Core, or Consulting companies.",
                  color: "bg-indigo-500 text-indigo-500",
                },
              ].map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                  key={idx}
                  className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-slate-200/60 dark:hover:border-white/10"
                >
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-opacity-10 ${item.color} bg-current dark:bg-opacity-20`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-0.5 text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href="/cgpa-calculator">
              <button className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-slate-900 px-8 py-3.5 font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] dark:bg-white dark:text-slate-900 dark:hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                <span className="relative z-10 flex items-center gap-2 text-base">
                  Launch Calculator
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-indigo-400 dark:to-purple-400 dark:group-hover:opacity-20" />
              </button>
            </Link>
          </motion.div>

          {/* Visual Side (Ultra-Premium App Mockup) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative perspective-[2000px]"
          >
            {/* The Main "App Window" */}
            <div className="relative w-full rounded-3xl border border-white/40 bg-white/40 p-2 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40 dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] transform-gpu hover:rotate-0 transition-transform duration-700">
              {/* macOS Style Header */}
              <div className="flex h-10 w-full items-center gap-2 rounded-t-[1.25rem] bg-white/60 px-4 dark:bg-black/40">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/80 shadow-inner" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80 shadow-inner" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-inner" />
                <div className="mx-auto flex items-center gap-2 rounded-md bg-black/5 px-3 py-1 dark:bg-white/10">
                  <Calculator className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                    hyper-learning.tech/cgpa
                  </span>
                </div>
              </div>

              {/* App Body */}
              <div className="flex flex-col gap-5 rounded-b-[1.25rem] bg-slate-50/80 p-6 dark:bg-[#0A0F24]/80">
                {/* Result Block */}
                <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/60 dark:bg-white/5 dark:border-white/10">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full blur-2xl" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Required SGPA
                    </span>
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                      <Target className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                      8.75
                    </div>
                    <div className="mb-1 text-xs font-bold text-emerald-500">
                      +1.25 jump
                    </div>
                  </div>

                  {/* Fake Progress Bar */}
                  <div className="mt-5 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "87.5%" }}
                      transition={{
                        duration: 1.5,
                        delay: 0.5,
                        ease: "easeOut",
                      }}
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Radar Mockup */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 border border-emerald-200/50 dark:from-emerald-950/30 dark:to-teal-900/10 dark:border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-100 rounded-xl dark:bg-emerald-500/20 shadow-inner">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-emerald-900 dark:text-emerald-300 mb-0.5">
                        Tier-1 Safe Zone
                      </h4>
                      <p className="text-[13px] font-medium text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                        Your current trajectory easily clears the 8.0 cutoff for
                        Google, Microsoft, and Amazon.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements / Micro-interactions */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 top-16 p-4 rounded-2xl bg-white border border-slate-100 shadow-2xl dark:bg-slate-800 dark:border-white/10 hidden xl:block backdrop-blur-xl scale-90 origin-top-right"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10">
                  <LineChart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="absolute right-0 top-0 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Prediction
                  </div>
                  <div className="font-black text-slate-900 dark:text-white">
                    Trend UP
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
