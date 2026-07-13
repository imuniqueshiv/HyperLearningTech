"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight, GraduationCap, Sparkles, Check } from "lucide-react";
import UniversityFlowBanner from "./university-flow-banner";

export default function UniversityHero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const features = [
    "Semester-wise Subjects",
    "Unit-wise Breakdowns",
    "Curated PYQ Archives",
    "Instant AI Assistance",
  ];

  const handleScrollToBranches = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const section = document.getElementById("branches");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative pt-10 pb-16">
      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div variants={itemVariants}>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur-sm transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20">
              <GraduationCap className="h-3.5 w-3.5" />
              Rajiv Gandhi Proudyogiki Vishwavidyalaya
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-[48px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[64px] lg:text-[80px] leading-[1.05]"
          >
            RGPV
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-blue-400 dark:to-cyan-400">
              Engineering Hub
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl text-[16px] leading-relaxed text-slate-600 sm:text-[18px] font-medium dark:text-slate-300"
          >
            A premium academic environment designed for absolute clarity. Access
            meticulously organized syllabus topics, curated previous year
            questions, and AI-driven insights to master your engineering
            journey.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col items-center gap-8"
          >
            <a
              href="#branches"
              onClick={handleScrollToBranches}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-700 px-9 py-4 text-[15px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(6,182,212,0.2),inset_0_1.5px_1.5px_rgba(255,255,255,0.2),inset_0_-4px_8px_rgba(30,58,138,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_6px_16px_-4px_rgba(6,182,212,0.25),inset_0_1.5px_1.5px_rgba(255,255,255,0.2),inset_0_-4px_8px_rgba(30,58,138,0.4)]"
            >
              {/* Extra glossy top highlight for 3D tactile shade */}
              <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/15 to-transparent"></div>

              <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                Explore Branches
                <ArrowRight className="h-4.5 w-4.5 text-cyan-100 transition-transform group-hover:translate-x-1" />
              </span>
            </a>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-x-3 sm:gap-x-8 gap-y-3 w-full max-w-sm sm:max-w-none mx-auto">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-[12px] sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 text-left">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Authentic, ultra-minimal stats section */}
          <motion.div
            variants={itemVariants}
            className="mt-12 w-full max-w-4xl mx-auto"
          >
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  13+
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Branches
                </span>
              </div>

              <div className="hidden h-10 w-px bg-slate-200 dark:bg-white/10 md:block" />

              <div className="flex flex-col items-center justify-center gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  8
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Semesters
                </span>
              </div>

              <div className="hidden h-10 w-px bg-slate-200 dark:bg-white/10 md:block" />

              <div className="flex flex-col items-center justify-center gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  100+
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Subjects
                </span>
              </div>

              <div className="hidden h-10 w-px bg-slate-200 dark:bg-white/10 md:block" />

              <div className="flex flex-col items-center justify-center gap-1.5">
                <span className="flex items-center gap-1.5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-indigo-400" />
                  AI
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Powered
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Submerged Flow Banner with Corrected Hierarchy */}
      <div className="relative z-10 mt-4 pb-4">
        <UniversityFlowBanner />
      </div>
    </section>
  );
}
