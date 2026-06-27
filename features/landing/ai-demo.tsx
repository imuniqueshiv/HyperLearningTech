"use client";

import { motion } from "framer-motion";
import { BrainCircuit, BookOpen, Sparkles } from "lucide-react";
import ChatMockup from "@/components/ai/chat-mockup";

export default function AIDemo() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-24">
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
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            AI Learning Assistant
          </span>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Learn Like You&apos;re Talking To A
            <span className="block bg-gradient-to-r from-[#1D4ED8] to-indigo-600 bg-clip-text text-transparent">
              Personal Tutor
            </span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Ask questions, understand difficult concepts, explore topic-wise
            notes, and prepare for exams with AI-powered guidance.
          </p>
        </motion.div>

        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-background/80 p-6 shadow-lg backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[#1D4ED8] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                    <BookOpen className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Topic-Based Learning
                    </h3>

                    <p className="mt-2 leading-7 text-muted-foreground">
                      Open any syllabus topic and instantly generate detailed
                      explanations, examples, revision notes, and key concepts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background/80 p-6 shadow-lg backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <BrainCircuit className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Interactive AI Tutor
                    </h3>

                    <p className="mt-2 leading-7 text-muted-foreground">
                      Ask follow-up questions and receive personalized answers
                      based on the topic you&apos;re studying.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background/80 p-6 shadow-lg backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-cyan-600 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Exam Focused Answers
                    </h3>

                    <p className="mt-2 leading-7 text-muted-foreground">
                      AI-generated responses are optimized for engineering exam
                      preparation and structured learning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side Chat Demo */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <ChatMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
