/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Quote, Star, Pause, Play, Sparkles } from "lucide-react";

import { landingTestimonials } from "@/lib/data/landing";

export default function Testimonials() {
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden border-b border-slate-100 bg-white py-12 lg:py-16 dark:border-border dark:bg-background">
      <style>{`
        @keyframes custom-marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

      {/* Premium High-Contrast Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Light Mode Blobs - Premium prominent pastel mesh */}
        <div className="absolute -left-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-cyan-400/15 via-blue-500/10 to-transparent blur-[120px] dark:hidden pointer-events-none" />
        <div className="absolute -right-[10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-fuchsia-400/15 via-purple-500/10 to-transparent blur-[120px] dark:hidden pointer-events-none" />

        {/* Dark Mode Blobs */}
        <div className="hidden dark:block absolute left-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="hidden dark:block absolute right-[10%] bottom-[20%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8 font-sans">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="mx-auto mb-10 flex max-w-2xl flex-col items-center text-center"
        >
          {/* Eyebrow Pill */}
          <div className="mb-4 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 py-[4px] pl-[10px] pr-[12px] shadow-sm dark:bg-[rgba(99,102,241,0.05)] dark:border-indigo-400/20 dark:backdrop-blur-md">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[11px] font-[700] tracking-[0.05em] uppercase text-indigo-700 dark:text-indigo-300">
              Student Feedback
            </span>
          </div>

          <h2 className="text-[32px] md:text-[40px] font-[900] leading-[1.05] tracking-[-0.03em] text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-none">
            Loved By Thousands Of
            <br />
            <span className="text-blue-600 dark:bg-gradient-to-r dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
              Engineering Students
            </span>
          </h2>

          <p className="mt-3 max-w-[480px] text-[13px] md:text-[14px] leading-[1.6] font-[500] text-slate-600 dark:text-slate-300">
            Hyper Learning is designed to simplify engineering education through
            AI-powered learning and smarter exam preparation.
          </p>
        </motion.div>

        {/* Testimonials Marquee */}
        <div className="relative overflow-hidden pt-10 pb-4 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] dark:[mask-image:linear-gradient(to_right,transparent,white_5%,white_95%,transparent)]">
          <div className="absolute right-4 top-0 z-20 mb-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200/80 bg-white/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-[#0f172a]/60 dark:hover:bg-white/10"
              aria-label={isPaused ? "Play testimonials" : "Pause testimonials"}
            >
              {isPaused ? (
                <Play className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300 ml-0.5" />
              ) : (
                <Pause className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
              )}
            </button>
          </div>

          <div
            className="flex gap-5"
            style={{
              width: "max-content",
              animation: shouldReduceMotion
                ? "none"
                : "custom-marquee 40s linear infinite",
              animationPlayState: isPaused ? "paused" : "running",
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(0)",
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {[...landingTestimonials, ...landingTestimonials].map(
              (testimonial, index) => (
                <div
                  key={`${testimonial.name}-${index}`}
                  className="group relative w-[280px] md:w-[320px] h-full flex-shrink-0 overflow-hidden rounded-[20px] border border-transparent bg-white p-5 text-left shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.02] hover:-translate-y-2 hover:border-indigo-400/50 hover:bg-white hover:shadow-[0_30px_60px_-12px_rgba(99,102,241,0.25)] dark:border-white/[0.08] dark:bg-[#0f172a]/60 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] dark:hover:border-indigo-500/[0.2] dark:hover:bg-[#1e293b]/80 dark:hover:scale-[1.01] dark:hover:-translate-y-1 dark:hover:shadow-[0_15px_30px_-10px_rgba(99,102,241,0.15)] flex flex-col"
                >
                  {/* Premium Hover Glow */}
                  <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#3B82F6] opacity-5 dark:opacity-20 blur-2xl" />
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    {/* Quote Icon */}
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#3B82F6] text-white shadow-sm shadow-blue-500/20 dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:border dark:border-white/10">
                      <Quote
                        className="h-3.5 w-3.5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                        aria-hidden="true"
                      />
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className="h-3.5 w-3.5 fill-amber-400 text-amber-400 dark:fill-amber-500 dark:text-amber-500"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review */}
                  <p className="flex-grow text-[13px] leading-[1.65] font-[500] text-slate-600 dark:text-slate-300">
                    &quot;{testimonial.review}&quot;
                  </p>

                  {/* User Area */}
                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/10">
                    <h3 className="text-[14px] font-[800] tracking-tight text-slate-900 dark:text-white">
                      {testimonial.name}
                    </h3>
                    <p className="mt-0.5 text-[12px] font-[600] text-slate-500 dark:text-slate-400">
                      {testimonial.role}
                    </p>
                    <p className="mt-0.5 text-[11px] font-[700] text-[#3B82F6] dark:text-blue-400 uppercase tracking-wider">
                      {testimonial.university}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Ultra Premium Glassmorphism Social Proof Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="mt-14 flex justify-center relative"
        >
          {/* Ambient Glow Behind Badge */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            <div className="h-[120px] w-[300px] rounded-[100%] bg-blue-500/10 dark:bg-blue-500/20 blur-[60px]" />
            <div className="absolute h-[100px] w-[200px] rounded-[100%] bg-purple-500/10 dark:bg-purple-500/20 blur-[50px] translate-x-10" />
          </div>

          <div className="group relative z-10 flex flex-col items-center sm:flex-row sm:gap-6 rounded-[24px] sm:rounded-full border border-slate-200/80 bg-white/70 px-6 py-5 sm:px-8 sm:py-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl transition-all hover:scale-[1.02] dark:border-white/[0.08] dark:bg-[#0A0F1C]/70 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_15px_40px_rgba(0,0,0,0.4)]">
            {/* Avatar Cluster */}
            <div className="flex -space-x-2.5 mb-4 sm:mb-0">
              <div className="h-10 w-10 rounded-full border-2 border-white dark:border-[#0A0F1C] bg-blue-100 flex items-center justify-center overflow-hidden shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4"
                  alt="avatar"
                />
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-white dark:border-[#0A0F1C] bg-pink-100 flex items-center justify-center overflow-hidden shadow-sm transition-transform duration-300 group-hover:-translate-y-1 delay-75">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf"
                  alt="avatar"
                />
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-white dark:border-[#0A0F1C] bg-emerald-100 flex items-center justify-center overflow-hidden shadow-sm transition-transform duration-300 group-hover:-translate-y-1 delay-100">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=c0aede"
                  alt="avatar"
                />
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-white dark:border-[#0A0F1C] bg-indigo-100 flex items-center justify-center overflow-hidden shadow-sm transition-transform duration-300 group-hover:-translate-y-1 delay-150">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria&backgroundColor=e6e6fa"
                  alt="avatar"
                />
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-white dark:border-[#0A0F1C] bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold shadow-inner z-10 transition-transform duration-300 group-hover:-translate-y-1 delay-200">
                500+
              </div>
            </div>

            {/* Separator line */}
            <div className="hidden sm:block h-10 w-[1px] bg-slate-200 dark:bg-white/10" />

            {/* Stars and Text */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]"
                    />
                  ))}
                </div>
                <span className="text-[13px] font-[800] text-slate-900 dark:text-white leading-none tracking-tight">
                  4.9/5 Rating
                </span>
              </div>
              <p className="text-[13px] font-[500] text-slate-500 dark:text-slate-300">
                Join{" "}
                <span className="font-[800] bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
                  500+
                </span>{" "}
                engineers already learning
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
