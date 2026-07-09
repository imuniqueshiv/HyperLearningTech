"use client";

import {
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
  FileText,
  Download,
  Code2,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChatMessage {
  type: "user" | "ai";
  text: string;
  uiComponent?: "notes" | "exam_structure" | "tutor_code";
}

export interface ChatMockupProps {
  topic: string;
  messages: ChatMessage[];
  pyqs?: string[];
  id: number;
}

export default function ChatMockup({
  topic,
  messages,
  pyqs,
  id,
}: ChatMockupProps) {
  return (
    <div className="relative w-full max-w-[440px] origin-top overflow-hidden rounded-[20px] md:rounded-[24px] border border-indigo-100 dark:border-white/[0.06] bg-gradient-to-br from-indigo-50 via-white/80 to-purple-50 dark:bg-none dark:bg-[#0f172a]/80 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-indigo-100 dark:border-white/[0.06] bg-[#F4F7FF] dark:bg-white/[0.02] px-4 pt-4 pb-3 md:px-5 md:pt-5 md:pb-4 backdrop-blur-md">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-r from-[#5964F4] to-[#7D52F5] shadow-[0_0_12px_rgba(99,102,241,0.4)]">
          <BrainCircuit
            className="h-[18px] w-[18px] text-white"
            strokeWidth={2.2}
          />
        </div>

        <div className="flex flex-col justify-center">
          <h3 className="text-[14px] font-[600] leading-tight text-slate-800 dark:text-[#f0f0f5]">
            Hyper AI
          </h3>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_5px_rgba(52,211,153,0.6)]" />
            <p className="text-[12px] font-medium leading-tight text-slate-500 dark:text-gray-400">
              Online • Ready to Help
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-[380px] md:h-[520px] p-3 md:p-5 relative">
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3 md:space-y-4 absolute inset-0 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {/* Topic Badge */}
              <div className="inline-flex rounded-xl border border-blue-100 bg-blue-50/50 px-2.5 py-1.5 md:px-3 dark:border-blue-500/20 dark:bg-blue-500/10">
                <span className="text-[10px] md:text-[11px] font-[700] uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Topic: {topic}
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-2.5 md:space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.type === "user"
                        ? "justify-end"
                        : "flex-col items-start gap-1.5 md:gap-2"
                    }`}
                  >
                    {msg.type === "user" ? (
                      <div className="max-w-[85%] rounded-[16px_16px_4px_16px] md:rounded-[20px_20px_6px_20px] bg-gradient-to-r from-[#5B6EFF] to-[#8B5CF6] px-3 py-2 md:px-4 md:py-2.5 text-[12px] md:text-[13px] font-medium text-white shadow-[0_3px_10px_rgba(91,110,255,0.3)]">
                        {msg.text}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 md:gap-2 px-1">
                          <div className="flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-[6px] bg-indigo-500/10">
                            <BrainCircuit
                              className="h-3 w-3 md:h-3.5 md:w-3.5 text-[#818cf8]"
                              strokeWidth={2.5}
                            />
                          </div>
                          <span className="text-[11px] md:text-[12px] font-[600] text-[#818cf8]">
                            Hyper AI
                          </span>
                        </div>
                        <div className="w-full rounded-[14px] md:rounded-[16px] border border-indigo-50 dark:border-white/5 bg-white/80 dark:bg-white/[0.05] px-3 py-2.5 md:px-5 md:py-3.5">
                          {msg.text && (
                            <p className="text-[12px] md:text-[13px] leading-[1.5] md:leading-[1.6] text-slate-600 dark:text-[#c8ccd8] font-medium mb-2.5 md:mb-3 last:mb-0">
                              {msg.text}
                            </p>
                          )}

                          {/* Rich UI Components */}
                          {msg.uiComponent === "notes" && (
                            <div className="mt-2 flex items-center justify-between rounded-xl border border-indigo-100 bg-white p-3 dark:border-white/10 dark:bg-[#0f172a]/50 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                                    Deadlocks_Revision.pdf
                                  </p>
                                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    RGPV Syllabus Mapped • 2.4 MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                                <Download className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                              </div>
                            </div>
                          )}

                          {msg.uiComponent === "exam_structure" && (
                            <div className="mt-2 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                              <div className="flex items-center gap-2 mb-3">
                                <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-[12px] font-bold text-emerald-700 dark:text-emerald-300">
                                  10-Mark Blueprint Guarantee
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[12px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0f172a]/60 px-3 py-1.5 rounded-md border border-slate-100 dark:border-white/5">
                                <span>1. Introduction & Definitions</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  [2M]
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[12px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0f172a]/60 px-3 py-1.5 rounded-md border border-slate-100 dark:border-white/5">
                                <span>2. OSI 7-Layer Diagram</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  [3M]
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[12px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0f172a]/60 px-3 py-1.5 rounded-md border border-slate-100 dark:border-white/5">
                                <span>3. Detailed Layer Functions</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  [5M]
                                </span>
                              </div>
                            </div>
                          )}

                          {msg.uiComponent === "tutor_code" && (
                            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-[#1e293b]">
                              <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 border-b border-white/10">
                                <Code2 className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-[11px] font-medium text-slate-400">
                                  SQL Example - 3NF Fix
                                </span>
                              </div>
                              <div className="p-3 text-[12px] font-mono leading-relaxed text-slate-300">
                                <span className="text-purple-400">
                                  CREATE TABLE
                                </span>{" "}
                                Departments (<br />
                                &nbsp;&nbsp;Dept_ID{" "}
                                <span className="text-blue-400">
                                  INT PRIMARY KEY
                                </span>
                                ,<br />
                                &nbsp;&nbsp;Dept_Name{" "}
                                <span className="text-blue-400">
                                  VARCHAR(50)
                                </span>
                                <br />
                                );
                                <br />
                                <br />
                                <span className="text-purple-400">
                                  CREATE TABLE
                                </span>{" "}
                                Employees (<br />
                                &nbsp;&nbsp;Emp_ID{" "}
                                <span className="text-blue-400">
                                  INT PRIMARY KEY
                                </span>
                                ,<br />
                                &nbsp;&nbsp;Dept_ID{" "}
                                <span className="text-blue-400">INT</span>,
                                <br />
                                &nbsp;&nbsp;
                                <span className="text-emerald-400">
                                  FOREIGN KEY
                                </span>{" "}
                                (Dept_ID){" "}
                                <span className="text-purple-400">
                                  REFERENCES
                                </span>{" "}
                                Departments(Dept_ID)
                                <br />
                                );
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* PYQs Block */}
              {pyqs && pyqs.length > 0 && (
                <div className="flex flex-col overflow-hidden rounded-[16px] border border-indigo-50 dark:border-white/5 bg-white dark:bg-white/[0.03]">
                  <div className="flex items-center gap-2 px-4 pb-1 pt-2.5 md:px-4 md:pb-1.5 md:pt-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_4px_rgba(129,140,248,0.5)]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#818cf8]">
                      Related PYQs found
                    </p>
                  </div>
                  <div className="flex flex-col divide-y divide-indigo-50 dark:divide-white/[0.02]">
                    {pyqs.map((pyq, idx) => (
                      <div
                        key={idx}
                        className="group flex cursor-pointer items-center justify-between px-4 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-[#34d399] drop-shadow-[0_0_3px_rgba(52,211,153,0.4)]"
                            strokeWidth={2.5}
                          />
                          <span className="text-[12px] font-medium text-slate-600 dark:text-[#d1d5db]">
                            {pyq}
                          </span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-gray-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#818cf8]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Input Footer */}
        <div className="shrink-0 mt-3 group flex items-center justify-between rounded-[16px] border border-indigo-100 dark:border-transparent bg-white/90 dark:bg-white/[0.04] px-3.5 py-2.5 md:px-4 md:py-3.5 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-indigo-300/50 dark:hover:border-indigo-500/50 hover:shadow-[0_4px_20px_-10px_rgba(99,102,241,0.2)] dark:hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_0_15px_rgba(99,102,241,0.2)] cursor-text relative z-10">
          <span className="text-[13px] font-medium text-slate-400 dark:text-[#6b7280]">
            Ask Hyper AI anything...
          </span>
          <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_4px_12px_rgba(168,85,247,0.25)] transition-transform hover:scale-105">
            <ArrowRight className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
