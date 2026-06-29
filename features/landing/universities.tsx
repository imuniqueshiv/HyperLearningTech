"use client";

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
    branches: ["CSE", "IT", "ECE", "ME", "CE"],
    status: "Coming Soon",
    href: "#",
  },
  {
    id: "coming-soon-2",
    name: "RTU",
    fullName: "Rajasthan Technical University",
    description:
      "Planned support for engineering students with AI-assisted learning workflows.",
    branches: ["CSE", "AI/ML", "IT", "EE", "ME"],
    status: "Coming Soon",
    href: "#",
  },
];

export default function Universities() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUniversities = universities.filter((uni) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      uni.name.toLowerCase().includes(query) ||
      uni.fullName.toLowerCase().includes(query) ||
      uni.description.toLowerCase().includes(query) ||
      uni.branches.some((branch) => branch.toLowerCase().includes(query))
    );
  });

  return (
    <section className="relative flex min-h-[115vh] flex-col justify-center overflow-hidden border-none bg-background pt-16 pb-32">
      {/* Background Layers */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Light Mode Wavy Refraction Background (Inverted) */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 800' preserveAspectRatio='none'%3E%3Cpath fill='%234a6cf7' fill-opacity='0.10' d='M0,400 C320,500 420,300 720,400 C1020,500 1120,300 1440,400 L1440,0 L0,0 Z'/%3E%3Cpath fill='%236e8efb' fill-opacity='0.14' d='M0,500 C320,400 420,600 720,500 C1020,400 1120,600 1440,500 L1440,0 L0,0 Z'/%3E%3Cpath fill='%234a6cf7' fill-opacity='0.08' d='M0,600 C320,700 420,500 720,600 C1020,700 1120,500 1440,600 L1440,0 L0,0 Z'/%3E%3C/svg%3E"),
              linear-gradient(to top, #f0f4ff, #ffffff)
            `,
            backgroundSize: "cover, auto",
            backgroundPosition: "center, top",
            backgroundRepeat: "no-repeat, no-repeat",
          }}
        />

        {/* Dark Mode Ambient Glows */}
        <div className="hidden dark:block absolute left-[-10%] top-20 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="hidden dark:block absolute right-[-10%] bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div
        id="Universities"
        className="relative mx-auto w-full max-w-7xl px-6 lg:px-8 scroll-mt-[12vh]"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto mb-6 max-w-3xl text-center"
        >
          <div className="mb-6 flex items-center justify-center">
            <div className="group relative inline-flex items-center gap-2.5 rounded-full border border-blue-200/40 bg-blue-50/80 px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-500/15 dark:bg-blue-500/10 dark:text-blue-400 transition-all">
              <GraduationCap className="relative z-10 h-4 w-4 text-blue-700 dark:text-blue-400" />
              <span className="relative z-10 tracking-wide">
                University Support
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            One Platform,
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent pb-4 -mb-3">
              Every University
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground/90">
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
          className="mx-auto mb-10 max-w-2xl"
        >
          <div className="relative group flex items-center justify-between rounded-full border border-border/50 dark:border-white/10 bg-background/80 dark:bg-white/[0.03] p-2 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-all focus-within:border-blue-500/50 focus-within:bg-background dark:focus-within:bg-white/[0.05] focus-within:shadow-[0_0_30px_rgba(37,99,235,0.1)] dark:focus-within:shadow-[0_0_30px_rgba(37,99,235,0.15)]">
            <input
              type="text"
              aria-label="Search universities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search universities by name, branch, or location..."
              className="w-full bg-transparent px-6 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
            <div className="group/lens relative mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/50 bg-muted/50 text-muted-foreground transition-all duration-500 hover:scale-[1.03] hover:border-border hover:bg-muted hover:text-foreground hover:shadow-sm cursor-pointer active:scale-95 overflow-hidden">
              <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] pointer-events-none" />
              <Search className="relative z-10 h-[18px] w-[18px] transition-transform duration-300 group-hover/lens:scale-[1.05]" />
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredUniversities.length > 0 ? (
              filteredUniversities.map((university) => (
                <motion.div
                  layout
                  key={university.id}
                  onClick={() => {
                    if (university.status === "Available") {
                      window.location.href = university.href;
                    }
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border border-border/50 dark:border-white/10 bg-card dark:bg-gradient-to-b dark:from-white/5 dark:to-transparent p-5 shadow-lg dark:shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-[5.5px] hover:border-blue-400/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:hover:border-blue-400/30 dark:hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] ${
                    university.status === "Available" ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="absolute inset-0 rounded-3xl border border-border/50 dark:border-white/5 transition-colors pointer-events-none group-hover:border-blue-500/15" />
                  {/* Hover Glow */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-500/15" />
                  </div>

                  {/* Badge */}
                  <div className="relative z-10 mb-4 flex items-center justify-between">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 text-blue-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:border-blue-400/20 dark:from-blue-400/10 dark:via-indigo-400/10 dark:to-purple-400/10 dark:text-blue-400 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                      <GraduationCap className="relative z-10 h-7 w-7 drop-shadow-sm" />
                    </div>

                    <span
                      className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        university.status === "Available"
                          ? "border-emerald-500/20 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "border-orange-500/20 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                      }`}
                    >
                      {university.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-1 flex-col">
                    <h3 className="text-2xl font-black tracking-tight text-foreground">
                      {university.name}
                    </h3>

                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
                      {university.fullName}
                    </p>

                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                      {university.description}
                    </p>

                    <div className="mt-4 mb-6 flex flex-wrap gap-2">
                      {university.branches.map((branch) => (
                        <span
                          key={branch}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                            university.status === "Available"
                              ? "bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20"
                              : "bg-muted text-muted-foreground ring-border/50 dark:bg-white/[0.02] dark:text-white/50 dark:ring-white/10"
                          }`}
                        >
                          {branch}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-6">
                      {university.status === "Available" ? (
                        <div className="group/btn relative flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-4 py-3.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.15)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-400/50 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] active:translate-y-0 active:shadow-[0_0_15px_rgba(37,99,235,0.2)] overflow-hidden">
                          <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] pointer-events-none" />
                          <span className="relative z-10 flex items-center gap-2">
                            Explore University
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                          </span>
                        </div>
                      ) : (
                        <div className="flex w-full items-center justify-start gap-2 py-3.5 text-sm font-medium text-muted-foreground/70">
                          <Sparkles className="h-4 w-4 opacity-70" />
                          Planned Expansion
                        </div>
                      )}
                    </div>
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
