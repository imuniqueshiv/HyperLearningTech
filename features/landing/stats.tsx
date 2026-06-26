"use client";

import { motion, Variants } from "framer-motion";

import { BrainCircuit, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { landingStats } from "@/lib/data/landing";

export default function Stats() {
  const containerVariants = {
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
    <section className="relative overflow-hidden border-b border-border bg-background py-24">
      {/* Background Glows - No grid pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <div className="mx-auto mb-20 max-w-3xl text-center">
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Platform Statistics
              </span>
            </motion.div>

            <motion.h2
              variants={itemVariants}
              className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl"
            >
              Everything You Need
              <br />
              <span className="bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
                To Learn With Clarity
              </span>
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
            >
              Hyper Learning brings together previous year questions, AI-powered
              explanations, syllabus mapping, and smart revision tools in one
              focused learning platform.
            </motion.p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {landingStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <motion.div
                  key={stat.title}
                  variants={itemVariants}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-background/80 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:hover:border-blue-500/30"
                >
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-100 blur-3xl dark:bg-blue-500/20" />
                  </div>

                  <div className="relative z-10 mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-[#1D4ED8] dark:border-blue-500/20 dark:from-blue-500/10 dark:to-indigo-500/10 dark:text-blue-400">
                    <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  <h3 className="relative z-10 text-4xl font-black tracking-tight text-foreground md:text-5xl">
                    {stat.title}
                  </h3>

                  <p className="relative z-10 mt-3 font-medium text-muted-foreground">
                    {stat.subtitle}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Feature Strip */}
          <motion.div
            variants={itemVariants}
            className="relative mt-16 overflow-hidden rounded-[2rem] border border-border bg-background/80 p-8 shadow-xl backdrop-blur-sm md:p-12"
          >
            <div className="grid gap-10 md:grid-cols-3 md:divide-x md:divide-border md:gap-0">
              <div className="text-center md:pr-10 md:text-left">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8] dark:bg-blue-500/10 dark:text-blue-400">
                  <BrainCircuit className="h-5 w-5" />
                </div>

                <h4 className="text-xl font-bold text-foreground">AI Tutor</h4>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Interactive learning with topic-based explanations, follow-up
                  questions, and instant concept clarification.
                </p>
              </div>

              <div className="text-center md:px-10 md:text-left">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8] dark:bg-blue-500/10 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>

                <h4 className="text-xl font-bold text-foreground">
                  Mapped PYQs
                </h4>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Previous year questions connected directly with syllabus
                  topics, reducing unnecessary searching and saving time.
                </p>
              </div>

              <div className="text-center md:pl-10 md:text-left">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8] dark:bg-blue-500/10 dark:text-blue-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <h4 className="text-xl font-bold text-foreground">
                  Smart Revision
                </h4>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Learn faster through structured notes, concise summaries, and
                  highly targeted exam-focused content.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
