"use client";

import { useState } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Sparkles,
  ArrowRight,
  MessageCircleQuestion,
} from "lucide-react";
import { landingFaqs as faqs } from "@/lib/data/landing";
import Link from "next/link";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden bg-slate-50 dark:bg-[#090e17]">
      {/* Premium High-Contrast Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Light Mode Blobs - Premium prominent pastel mesh */}
        <div className="absolute -left-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-cyan-400/15 via-blue-500/10 to-transparent blur-[120px] dark:hidden pointer-events-none" />
        <div className="absolute -right-[10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-fuchsia-400/15 via-purple-500/10 to-transparent blur-[120px] dark:hidden pointer-events-none" />

        {/* Dark Mode Blobs */}
        <div className="hidden dark:block absolute left-[20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full mx-auto max-w-[800px] px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-col items-center"
        >
          {/* Header */}
          <div className="mx-auto mb-10 lg:mb-14 text-center font-sans">
            <motion.div variants={itemVariants}>
              <div className="mb-5 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 py-[6px] pl-[12px] pr-[16px] shadow-sm dark:bg-[rgba(99,102,241,0.05)] dark:border-indigo-400/20 dark:backdrop-blur-md">
                <Sparkles className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[12px] font-[700] tracking-[0.06em] uppercase text-indigo-700 dark:text-indigo-300">
                  Common Questions
                </span>
              </div>
            </motion.div>

            <motion.h2
              variants={itemVariants}
              className="text-[36px] md:text-[48px] lg:text-[56px] font-[900] leading-[1.05] tracking-[-0.03em] text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-none"
            >
              Everything You Need
              <br />
              <span className="text-blue-600 dark:bg-gradient-to-r dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
                To Know
              </span>
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-[540px] mx-auto text-[15px] md:text-[16px] leading-[1.7] font-[500] text-slate-600 dark:text-slate-300"
            >
              Have questions about how Hyper Learning works? Check out our most
              frequently asked questions below.
            </motion.p>
          </div>

          {/* FAQ Accordions - Ultra Premium Unified Card */}
          <motion.div
            variants={itemVariants}
            className="w-full relative group/card"
          >
            {/* Soft backdrop glow */}
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-b from-slate-200/50 to-slate-100/10 opacity-50 blur-xl transition duration-500 group-hover/card:opacity-100 dark:from-white/10 dark:to-transparent" />

            <div className="relative w-full overflow-hidden rounded-[24px] border border-transparent bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/[0.08] dark:bg-[#0f172a]/60 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] dark:backdrop-blur-2xl">
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {faqs.map((faq, index) => {
                  const isOpen = openIndex === index;
                  return (
                    <div
                      key={index}
                      className={`transition-colors duration-500 ease-out ${isOpen ? "bg-slate-50/50 dark:bg-white/[0.03]" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="flex w-full items-center justify-between px-5 py-4 md:px-8 md:py-7 text-left outline-none group"
                      >
                        <span
                          className={`text-[15px] md:text-[17px] font-[600] tracking-tight transition-colors duration-300 ${
                            isOpen
                              ? "text-[#3B82F6] dark:text-blue-400"
                              : "text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400"
                          }`}
                        >
                          {faq.question}
                        </span>
                        <div
                          className={`ml-4 md:ml-6 flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                            isOpen
                              ? "bg-blue-100 text-[#3B82F6] shadow-sm dark:bg-blue-500/20 dark:text-blue-400"
                              : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:scale-110 dark:bg-white/5 dark:text-slate-500 dark:group-hover:bg-white/10"
                          }`}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.4,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          >
                            <div className="px-5 pb-5 pt-0 md:px-8 md:pb-8 text-[14px] md:text-[15px] leading-[1.6] md:leading-[1.75] font-[500] text-slate-600 dark:text-slate-400">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Still Have Questions CTA */}
          <motion.div
            variants={itemVariants}
            className="relative mt-24 w-full border-t border-slate-200/60 dark:border-white/[0.05] pt-16 pb-10"
          >
            {/* Premium Texture & Glow */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 dark:bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_10%,transparent_100%)] pointer-events-none" />
            <div className="absolute left-1/2 top-0 z-0 h-[300px] w-[600px] -translate-x-1/2 bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/15 pointer-events-none" />

            <div className="relative z-10 mx-auto max-w-[800px] text-center">
              {/* Dynamic Status Badge */}
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/50 bg-emerald-50/50 px-3 py-1.5 text-[13px] font-[650] text-emerald-700 shadow-sm backdrop-blur-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Support team is online
              </div>

              <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-b from-slate-50 to-white text-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] ring-1 ring-inset ring-slate-200/60 dark:from-white/10 dark:to-white/5 dark:text-white dark:ring-white/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <MessageCircleQuestion
                  className="h-7 w-7 drop-shadow-sm"
                  strokeWidth={2}
                />
              </div>

              <h3 className="text-[28px] md:text-[36px] font-[900] tracking-tight text-slate-900 dark:text-white">
                Still have questions?
              </h3>

              <p className="mt-4 text-[16px] md:text-[17px] font-[500] text-slate-500 dark:text-slate-400 max-w-[480px] mx-auto leading-relaxed">
                Can&apos;t find the answer you&apos;re looking for? Please chat to our
                friendly team.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/contact">
                  <button className="inline-flex h-[52px] w-full sm:w-auto items-center justify-center rounded-full bg-slate-900 px-8 text-[15px] font-[650] text-white shadow-md shadow-slate-900/10 transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 active:scale-[0.98]">
                    Contact Support
                  </button>
                </Link>
                <Link href="/auth/signup">
                  <button className="group inline-flex h-[52px] w-full sm:w-auto items-center justify-center rounded-full border border-slate-200 bg-white/60 px-8 text-[15px] font-[650] text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-white/[0.08] dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/[0.04] dark:hover:text-white active:scale-[0.98] backdrop-blur-sm">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
