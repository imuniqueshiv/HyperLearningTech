"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  Building2,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react";

export default function UniversityHero() {
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

  const flowSteps = [
    { icon: GraduationCap, label: "RGPV" },
    { icon: Building2, label: "All Branches" },
    { icon: BookOpen, label: "Subjects & Syllabus" },
    { icon: BrainCircuit, label: "Hyper AI Learning" },
  ];

  const resources = [
    "Semester-wise Subjects",
    "Unit-wise Syllabus",
    "Previous Year Questions",
    "Hyper AI Assistance",
  ];
  const handleScrollToBranches = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const section = document.getElementById("branches");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      {/* Background */}{" "}
      <div className="absolute inset-0 -z-10">
        {" "}
        <div className="absolute left-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[100px]" />{" "}
        <div className="absolute right-[-5%] top-[15%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />{" "}
      </div>
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-28 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
          {/* Left Side */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                <GraduationCap className="h-4 w-4" />
                Rajiv Gandhi Proudyogiki Vishwavidyalaya
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="max-w-5xl text-5xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl leading-[1.05]"
            >
              RGPV
              <br />
              <span className="bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
                Engineering Hub
              </span>
              <br />
              <span className="text-base font-medium italic text-muted-foreground md:text-xl lg:text-2xl">
                Explore Branches, Subjects, Syllabus & Previous Year Questions
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
            >
              Access organized engineering resources across all branches and
              semesters. Navigate subjects, syllabus topics, previous year
              papers, AI-generated notes, and Hyper AI learning support from a
              single academic platform.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <a
                href="#branches"
                onClick={handleScrollToBranches}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-8 py-4 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:bg-[#1E40AF]"
              >
                Explore Branches
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>

              <Link
                href="/subjects"
                className="inline-flex items-center justify-center rounded-xl border-2 border-border bg-background/50 px-8 py-4 font-semibold text-foreground backdrop-blur-sm transition-all duration-300 hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
              >
                Browse Subjects
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-16 grid max-w-2xl grid-cols-2 gap-8 border-t border-border/60 pt-10 md:grid-cols-4"
            >
              <div>
                <p className="text-3xl font-black text-foreground">13+</p>
                <p className="mt-1 text-sm text-muted-foreground">Branches</p>
              </div>

              <div>
                <p className="text-3xl font-black text-foreground">8</p>
                <p className="mt-1 text-sm text-muted-foreground">Semesters</p>
              </div>

              <div>
                <p className="text-3xl font-black text-foreground">100+</p>
                <p className="mt-1 text-sm text-muted-foreground">Subjects</p>
              </div>

              <div>
                <p className="text-3xl font-black text-foreground">AI</p>
                <p className="mt-1 text-sm text-muted-foreground">Learning</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: 0.2,
            }}
          >
            <div className="rounded-[1.75rem] border border-border/60 bg-background/80 p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D4ED8]/10">
                  <Building2 className="h-4.5 w-4.5 text-[#1D4ED8]" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Academic Navigation
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    Structured Learning Path
                  </p>
                </div>
              </div>

              {/* Compact step flow */}
              <div className="grid grid-cols-2 gap-3">
                {flowSteps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.label}
                      className="relative rounded-xl border border-border bg-card p-3.5"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 flex-shrink-0 text-[#1D4ED8]" />
                        <span className="text-sm font-semibold leading-snug text-foreground">
                          {step.label}
                        </span>
                      </div>

                      <span className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#1D4ED8] text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                  Available Resources
                </p>

                <div className="mt-3 grid grid-cols-2 gap-y-2.5 gap-x-3 text-sm font-medium text-foreground/80">
                  {resources.map((resource) => (
                    <div key={resource} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                      <span className="leading-tight">{resource}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
