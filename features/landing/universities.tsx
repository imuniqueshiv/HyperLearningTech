"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ArrowRight, Sparkles, Search } from "lucide-react";

const universities = [
  {
    id: "rgpv",
    name: "RGPV",
    fullName: "Rajiv Gandhi Proudyogiki Vishwavidyalaya",
    description:
      "Access syllabus, AI-generated notes, mapped PYQs, and exam preparation resources for engineering programs.",
    branches: ["AIML", "CSE", "CSIT", "CY", "IT"],
    status: "Available",
    href: "/rgpv",
  },
  {
    id: "coming-soon-1",
    name: "AKTU",
    fullName: "Dr. A.P.J. Abdul Kalam Technical University",
    description:
      "Future expansion planned with syllabus mapping, PYQs, and AI-powered learning resources.",
    branches: ["Coming Soon"],
    status: "Coming Soon",
    href: "#",
  },
  {
    id: "coming-soon-2",
    name: "RTU",
    fullName: "Rajasthan Technical University",
    description:
      "Planned support for engineering students with AI-assisted learning workflows.",
    branches: ["Coming Soon"],
    status: "Coming Soon",
    href: "#",
  },
];

export default function Universities() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUniversities = universities.filter((uni) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      uni.name.toLowerCase().includes(query) ||
      uni.fullName.toLowerCase().includes(query) ||
      uni.description.toLowerCase().includes(query) ||
      uni.branches.some((branch) => branch.toLowerCase().includes(query))
    );
  });

  return (
    <section
      id="Universities"
      className="relative overflow-hidden border-b border-border bg-background py-24"
    >
      {/* Background Glows - No grid pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-20 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            University Support
          </span>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Learn Across
            <span className="block bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
              Universities
            </span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Hyper Learning is designed to evolve into a multi-university
            learning platform. Start with RGPV and expand to universities across
            India.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl"
        >
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-[#1D4ED8] transition-colors" />
            </div>
            <input
              type="text"
              aria-label="Search universities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search universities by name, branch, or location..."
              className="w-full rounded-2xl border border-border bg-background/50 py-4 pl-12 pr-4 text-sm text-foreground shadow-sm backdrop-blur-md transition-all focus:border-[#1D4ED8] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
            />
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredUniversities.length > 0 ? (
              filteredUniversities.map((university) => (
                <motion.div
                  layout
                  key={university.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-background/80 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:hover:border-blue-500/30"
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100 blur-3xl dark:bg-blue-500/20" />
                  </div>

                  {/* Badge */}
                  <div className="relative z-10 mb-6 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#1D4ED8] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                      <GraduationCap className="h-7 w-7" />
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        university.status === "Available"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
                      }`}
                    >
                      {university.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-3xl font-bold text-foreground">
                      {university.name}
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {university.fullName}
                    </p>

                    <p className="mt-6 leading-7 text-muted-foreground">
                      {university.description}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-2">
                      {university.branches.map((branch) => (
                        <span
                          key={branch}
                          className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {branch}
                        </span>
                      ))}
                    </div>

                    {university.status === "Available" ? (
                      <Link
                        href={university.href}
                        className="mt-8 inline-flex items-center gap-2 font-semibold text-[#1D4ED8] transition-colors hover:text-[#1E40AF] dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Explore University
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <div className="mt-8 inline-flex items-center gap-2 text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                        Planned Expansion
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full py-12 text-center"
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  No universities found
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your search query.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
