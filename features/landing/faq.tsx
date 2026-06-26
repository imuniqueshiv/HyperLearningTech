"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { landingFaqs } from "@/lib/data/landing";

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <button
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s+/g, "-")}`}
        id={`faq-button-${question.replace(/\s+/g, "-")}`}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-muted/30"
      >
        <span className="pr-6 text-base font-semibold text-foreground md:text-lg">
          {question}
        </span>

        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${question.replace(/\s+/g, "-")}`}
            role="region"
            aria-labelledby={`faq-button-${question.replace(/\s+/g, "-")}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.25,
            }}
          >
            <div className="border-t border-border px-6 py-5">
              <p className="leading-8 text-muted-foreground">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-24">
      {/* Background Glows - No grid pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-20 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute right-0 bottom-20 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 text-center"
        >
          <span className="inline-flex rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-semibold text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            Frequently Asked Questions
          </span>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Got Questions?
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Everything you need to know about Hyper Learning, AI-powered
            learning, syllabus mapping, and exam preparation.
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-4">
          {landingFaqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
              }}
              viewport={{ once: true }}
            >
              <FAQItem
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{
            opacity: 0,
            y: 24,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.1,
          }}
          viewport={{ once: true }}
          className="mt-16 rounded-3xl border border-border bg-background/80 p-8 text-center shadow-lg backdrop-blur-sm"
        >
          <h3 className="text-2xl font-bold text-foreground">
            Still Have Questions?
          </h3>

          <p className="mt-4 text-muted-foreground">
            Reach out through our contact page or use the AI assistant to get
            help with your learning journey.
          </p>

          <div className="mt-6 inline-flex rounded-xl border border-blue-200/60 bg-blue-50/80 px-5 py-3 text-sm font-semibold text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            We&apos;re continuously improving Hyper Learning based on student
            feedback.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
