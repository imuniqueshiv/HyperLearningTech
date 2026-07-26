"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Layers } from "lucide-react";
import { branches } from "@/lib/data/branches";

export default function SemesterOverview({ branch }: { branch: string }) {
  const branchInfo = branches.find((b) => b.id === branch);
  const branchDisplayName = branchInfo?.name || branch.toUpperCase();
  const isCommon = branch === "common";

  const yearsData = isCommon
    ? [
        {
          year: "1st Year",
          badge: "Foundation Year",
          description:
            "Universal engineering curriculum common across all RGPV branches.",
          semesters: [
            {
              num: "01",
              name: "Semester 1",
              desc: "Physics Cycle • Foundational Engineering",
              href: "/rgpv/common/semester-1",
            },
            {
              num: "02",
              name: "Semester 2",
              desc: "Chemistry Cycle • Basic Applied Sciences",
              href: "/rgpv/common/semester-2",
            },
          ],
        },
      ]
    : [
        {
          year: "2nd Year",
          badge: "Year II",
          description: "Core engineering fundamentals & data structures.",
          semesters: [
            {
              num: "03",
              name: "Semester 3",
              desc: "Core Subjects & Foundational Concepts",
              href: `/rgpv/${branch}/semester-3`,
            },
            {
              num: "04",
              name: "Semester 4",
              desc: "Systems, DBMS & Algorithm Design",
              href: `/rgpv/${branch}/semester-4`,
            },
          ],
        },
        {
          year: "3rd Year",
          badge: "Year III",
          description: "Advanced domain subjects, electives & practicals.",
          semesters: [
            {
              num: "05",
              name: "Semester 5",
              desc: "Advanced Technical Subjects & Electives",
              href: `/rgpv/${branch}/semester-5`,
            },
            {
              num: "06",
              name: "Semester 6",
              desc: "Specialized Subjects & Minor Project",
              href: `/rgpv/${branch}/semester-6`,
            },
          ],
        },
        {
          year: "4th Year",
          badge: "Year IV",
          description: "Industry electives, major projects & internships.",
          semesters: [
            {
              num: "07",
              name: "Semester 7",
              desc: "Advanced Electives & Major Project I",
              href: `/rgpv/${branch}/semester-7`,
            },
            {
              num: "08",
              name: "Semester 8",
              desc: "Industry Training & Capstone Project",
              href: `/rgpv/${branch}/semester-8`,
            },
          ],
        },
      ];

  return (
    <section className="relative overflow-hidden bg-background text-foreground py-16 sm:py-24 lg:py-28">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[130px] dark:bg-blue-500/15" />
        <div className="absolute right-0 top-1/4 h-[550px] w-[550px] rounded-full bg-indigo-500/10 blur-[130px] dark:bg-indigo-500/10" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{branchDisplayName}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-foreground leading-[1.15]">
            Semester Wise{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-400">
              Learning Path
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Access official RGPV syllabus, previous year questions, and AI study
            resources organized by semester.
          </p>
        </motion.div>

        {/* Common Branch Layout (2-card Grid) */}
        {isCommon ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mx-auto max-w-3xl"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              {yearsData[0].semesters.map((sem) => (
                <Link
                  key={sem.name}
                  href={sem.href}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card/70 p-7 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-blue-500/40 hover:bg-card hover:shadow-2xl dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                >
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-black text-base">
                        {sem.num}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        RGPV 1st Year
                      </span>
                    </div>

                    <h3 className="mt-6 text-2xl font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {sem.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {sem.desc}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    <span>Explore Curriculum</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Non-Common Branches Layout (Clean 3-column Year Cards) */
          <div className="grid gap-6 md:grid-cols-3">
            {yearsData.map((yearBlock, idx) => (
              <motion.div
                key={yearBlock.year}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 + idx * 0.08 }}
                className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-md transition-all duration-300 hover:border-blue-500/30 hover:bg-card dark:border-white/10 dark:bg-white/[0.025] dark:hover:bg-white/[0.05]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Layers className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {yearBlock.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground">
                    {yearBlock.year}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {yearBlock.description}
                  </p>

                  <div className="mt-6 flex flex-col gap-3">
                    {yearBlock.semesters.map((sem) => (
                      <Link
                        key={sem.name}
                        href={sem.href}
                        className="group/sem flex items-center justify-between rounded-2xl border border-border bg-background/80 p-4 transition-all duration-200 hover:border-blue-500/40 hover:bg-background hover:shadow-md dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400 text-xs font-bold">
                            {sem.num}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground group-hover/sem:text-blue-600 dark:group-hover/sem:text-blue-400 transition-colors">
                              {sem.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              {sem.desc}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover/sem:translate-x-1 group-hover/sem:text-blue-600 dark:group-hover/sem:text-blue-400 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
