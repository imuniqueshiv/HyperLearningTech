"use client";

import { motion } from "framer-motion";
import React from "react";

export default function UniversityFlowBanner() {
  const steps = [
    "Branch",
    "Semester",
    "Subject",
    "Syllabus",
    "PYQs",
    "Hyper AI",
  ];

  return (
    <div className="relative z-10 flex justify-center w-full">
      <div className="px-6 lg:px-8 w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 md:gap-4"
        >
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`flex items-center rounded-full px-4 py-1.5 text-[13px] md:text-[14px] font-medium transition-all ${
                  step === "Hyper AI"
                    ? "bg-gradient-to-b from-cyan-400 to-blue-600 text-white font-semibold shadow-[0_4px_14px_0_rgb(6,182,212,39%)]"
                    : "bg-white/60 border border-slate-200/60 text-slate-600 shadow-sm backdrop-blur-md hover:border-slate-300 hover:text-slate-900 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700"
                }`}
              >
                {step}
              </div>
              {index < steps.length - 1 && (
                <div className="text-slate-300 dark:text-slate-700 flex-shrink-0">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
