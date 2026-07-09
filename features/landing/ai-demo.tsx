"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { BrainCircuit, BookOpen, Sparkles } from "lucide-react";
import ChatMockup from "@/components/ai/chat-mockup";

const aiFeatures = [
  {
    title: "Topic-Based Learning",
    description:
      "Open any syllabus topic and instantly generate detailed explanations, examples, revision notes, and key concepts.",
    icon: BookOpen,
    color: "bg-[#3B82F6]",
    shadow: "shadow-blue-500/20",
    chatData: {
      topic: "Module 2: Deadlocks",
      messages: [
        {
          type: "user" as const,
          text: "Show me the most important questions for Deadlocks from RGPV previous years.",
        },
        {
          type: "ai" as const,
          text: "I've scanned the syllabus. Here are the most frequently asked questions on Deadlocks, sorted by weightage. I also generated a quick revision PDF for you:",
          uiComponent: "notes" as const,
        },
      ],
      pyqs: [
        "Explain the 4 Coffman conditions for deadlock. (10M)",
        "What is Bankers Algorithm? Explain with example. (8M)",
        "Differentiate between Deadlock Prevention and Avoidance. (6M)",
      ],
    },
  },
  {
    title: "Interactive AI Tutor",
    description:
      "Ask follow-up questions and receive personalized answers based on the topic you're studying.",
    icon: BrainCircuit,
    color: "bg-[#8B5CF6]",
    shadow: "shadow-purple-500/20",
    chatData: {
      topic: "Database Normalization",
      messages: [
        {
          type: "user" as const,
          text: "I don't understand the difference between 2NF and 3NF. Explain it simply.",
        },
        {
          type: "ai" as const,
          text: "Think of 2NF as 'the whole key' and 3NF as 'nothing but the key'.",
        },
        {
          type: "user" as const,
          text: "Can you give me an example with a student database?",
        },
        {
          type: "ai" as const,
          text: "Sure! If an Employee table has 'Department_ID' and 'Department_Name'. Department_Name depends on Department_ID, not the Employee_ID. You should split them like this:",
          uiComponent: "tutor_code" as const,
        },
      ],
    },
  },
  {
    title: "Exam Focused Answers",
    description:
      "AI-generated responses are optimized for engineering exam preparation and structured learning.",
    icon: Sparkles,
    color: "bg-[#10B981]",
    shadow: "shadow-emerald-500/20",
    chatData: {
      topic: "Computer Networks",
      messages: [
        {
          type: "user" as const,
          text: "Generate a 10-mark answer structure for 'OSI Reference Model'.",
        },
        {
          type: "ai" as const,
          text: "Here is the optimal structure to score full marks in your exams:",
          uiComponent: "exam_structure" as const,
        },
      ],
      pyqs: ["Explain the functions of all 7 layers of the OSI model. (10M)"],
    },
  },
];

export default function AIDemo() {
  const [activeIndex, setActiveIndex] = useState(0);

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
    hidden: { opacity: 0, y: 25, scale: 0.9, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden border-b border-slate-100 bg-white py-8 lg:py-10 dark:border-border dark:bg-background">
      {/* Premium High-Contrast Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Light Mode Blobs */}
        <div className="absolute -left-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-cyan-400/15 via-blue-500/10 to-transparent blur-[120px] dark:hidden pointer-events-none" />
        <div className="absolute -right-[10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-fuchsia-400/15 via-purple-500/10 to-transparent blur-[120px] dark:hidden pointer-events-none" />

        {/* Dark Mode Blobs */}
        <div className="hidden dark:block absolute left-[-10%] top-[20%] h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="hidden dark:block absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mx-auto flex flex-col items-center"
        >
          {/* Header */}
          <div className="mx-auto mb-10 lg:mb-12 max-w-3xl text-center font-sans">
            <motion.div variants={itemVariants}>
              <div className="mb-4 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 py-[4px] pl-[10px] pr-[12px] shadow-sm dark:bg-[rgba(99,102,241,0.05)] dark:border-indigo-400/20 dark:backdrop-blur-md">
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[11px] font-[700] tracking-[0.05em] uppercase text-indigo-700 dark:text-indigo-300">
                  AI Learning Assistant
                </span>
              </div>
            </motion.div>

            <motion.h2
              variants={itemVariants}
              className="text-[32px] md:text-[40px] lg:text-[48px] font-[900] leading-[1.05] tracking-[-0.03em] text-slate-900 dark:text-white max-w-3xl drop-shadow-sm dark:drop-shadow-none"
            >
              Learn Like You&apos;re Talking To A
              <br />
              <span className="text-blue-600 dark:bg-gradient-to-r dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
                Personal Tutor
              </span>
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="mt-4 max-w-[560px] mx-auto text-[14px] md:text-[15px] leading-[1.6] font-[500] text-slate-600 dark:text-slate-300"
            >
              Ask questions, understand difficult concepts, explore topic-wise
              notes, and prepare for exams with AI-powered guidance.
            </motion.p>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 w-full">
            {/* Left Side (Features) */}
            <motion.div
              variants={containerVariants}
              className="flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6 pb-4 pt-1 lg:mx-0 lg:px-0 lg:pb-0 lg:pt-0 lg:flex-col lg:space-y-4 gap-4 lg:gap-0"
            >
              {aiFeatures.map((feature, idx) => {
                const isActive = activeIndex === idx;
                const Icon = feature.icon;

                return (
                  <motion.button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    variants={itemVariants}
                    className={`group relative text-left overflow-hidden rounded-[16px] sm:rounded-[20px] p-4 sm:p-5 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] min-w-[280px] w-[85vw] sm:w-auto lg:w-full snap-center flex-shrink-0 lg:flex-shrink ${
                      isActive
                        ? "border border-indigo-400/50 bg-white shadow-[0_20px_40px_-12px_rgba(99,102,241,0.2)] lg:scale-[1.02] lg:-translate-y-2 dark:border-indigo-500/[0.4] dark:bg-[#1e293b]/90 dark:shadow-[0_15px_30px_-10px_rgba(99,102,241,0.2)]"
                        : "border border-slate-100 sm:border-transparent bg-white shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:scale-[1.01] sm:hover:scale-[1.02] hover:-translate-y-1 sm:hover:-translate-y-2 hover:border-indigo-400/50 hover:bg-white hover:shadow-[0_30px_60px_-12px_rgba(99,102,241,0.25)] dark:border-white/[0.08] dark:bg-[#0f172a]/60 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] dark:hover:border-indigo-500/[0.2] dark:hover:bg-[#1e293b]/80"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 -z-10 transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      <div
                        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${feature.color} opacity-5 dark:opacity-20 blur-2xl`}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div
                        className={`inline-flex h-10 w-10 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-[10px] sm:rounded-[12px] text-white shadow-sm ${feature.color} ${feature.shadow} dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:border dark:border-white/10 transition-transform duration-500 ${isActive ? "scale-105" : "group-hover:scale-110"}`}
                      >
                        <Icon className="h-4 w-4 sm:h-4 sm:w-4" />
                      </div>
                      <div>
                        <h3
                          className={`text-[15px] sm:text-[16px] font-[800] tracking-tight transition-colors ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}
                        >
                          {feature.title}
                        </h3>
                        <p className="mt-1 text-[13px] leading-[1.5] sm:leading-[1.6] font-[500] text-slate-500 dark:text-slate-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Right Side Chat Demo */}
            <motion.div
              variants={itemVariants}
              className="relative w-full max-w-[420px] mx-auto lg:ml-auto scale-[0.9] lg:scale-100 origin-center lg:origin-right mt-4 lg:mt-0"
            >
              <div className="absolute inset-0 -z-10 rounded-[24px] bg-indigo-500/20 blur-[60px] dark:bg-transparent" />
              <ChatMockup
                topic={aiFeatures[activeIndex].chatData.topic}
                messages={aiFeatures[activeIndex].chatData.messages}
                pyqs={aiFeatures[activeIndex].chatData.pyqs}
                id={activeIndex}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
