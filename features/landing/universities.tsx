"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const universities = [
  {
    id: "rgpv",
    name: "RGPV",
    fullName: "Rajiv Gandhi Proudyogiki Vishwavidyalaya",
    description:
      "Access syllabus, AI-generated notes, mapped PYQs, and exam preparation resources for engineering programs.",
    branches: ["AIML", "CSE", "CSIT", "CY", "IT"],
    status: "Available",
  },
  {
    id: "coming-soon-1",
    name: "AKTU",
    fullName: "Dr. A.P.J. Abdul Kalam Technical University",
    description:
      "Future expansion planned with syllabus mapping, PYQs, and AI-powered learning resources.",
    branches: ["Coming Soon"],
    status: "Coming Soon",
  },
  {
    id: "coming-soon-2",
    name: "RTU",
    fullName: "Rajasthan Technical University",
    description:
      "Planned support for engineering students with AI-assisted learning workflows.",
    branches: ["Coming Soon"],
    status: "Coming Soon",
  },
];

export default function Universities() {
  return (
    <section className="relative overflow-hidden border-b border-border py-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-10 top-20 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute right-10 bottom-10 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl" />
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
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            University Support
          </span>

          <h2 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Learn Across
            <span className="block bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Universities
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-400">
            Hyper Learning is designed to evolve into a multi-university
            learning platform. Start with RGPV and expand to universities across
            India.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {universities.map((university, index) => (
            <motion.div
              key={university.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 p-8 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:bg-slate-950"
            >
              {/* Glow */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
              </div>

              {/* Badge */}
              <div className="relative z-10 mb-6 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <GraduationCap className="h-7 w-7" />
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    university.status === "Available"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  }`}
                >
                  {university.status}
                </span>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white">
                  {university.name}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {university.fullName}
                </p>

                <p className="mt-6 leading-7 text-slate-400">
                  {university.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {university.branches.map((branch) => (
                    <span
                      key={branch}
                      className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
                    >
                      {branch}
                    </span>
                  ))}
                </div>

                {university.status === "Available" ? (
                  <Link
                    href="/subjects"
                    className="mt-8 inline-flex items-center gap-2 font-medium text-blue-400 transition-colors hover:text-blue-300"
                  >
                    Explore University
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <div className="mt-8 inline-flex items-center gap-2 text-slate-500">
                    <Sparkles className="h-4 w-4" />
                    Planned Expansion
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-20 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-10"
        >
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-3xl font-bold text-white">
                Building The Future Of Academic Learning
              </h3>

              <p className="mt-4 text-lg text-slate-400">
                Starting with RGPV and expanding toward a unified AI-powered
                platform supporting engineering students across multiple
                universities.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <BookOpen className="mb-3 h-6 w-6 text-blue-400" />
                <h4 className="font-semibold text-white">AI Notes</h4>
                <p className="mt-1 text-sm text-slate-400">
                  Topic-wise learning
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <GraduationCap className="mb-3 h-6 w-6 text-violet-400" />
                <h4 className="font-semibold text-white">Universities</h4>
                <p className="mt-1 text-sm text-slate-400">
                  Multi-campus support
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}