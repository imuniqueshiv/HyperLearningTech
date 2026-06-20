"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is Hyper Learning?",
    answer:
      "Hyper Learning is an AI-powered learning platform designed to help engineering students learn smarter through syllabus mapping, previous year questions, AI-generated notes, and interactive learning experiences.",
  },
  {
    question: "Is Hyper Learning only for RGPV students?",
    answer:
      "Currently, Hyper Learning focuses on RGPV engineering students. However, the platform is being designed to support multiple universities in the future.",
  },
  {
    question: "How does the AI Tutor work?",
    answer:
      "Students can open any syllabus topic and receive AI-generated explanations, examples, summaries, and revision notes. They can also ask follow-up questions for deeper understanding.",
  },
  {
    question: "Are the AI-generated answers exam-oriented?",
    answer:
      "Yes. Hyper Learning is optimized for engineering exam preparation. Answers are structured to help students understand concepts and prepare effectively for university examinations.",
  },
  {
    question: "How are Previous Year Questions organized?",
    answer:
      "Questions are mapped directly to syllabus units and topics, making it easier to identify important concepts and prepare strategically for exams.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. Most content can be accessed without an account. However, creating an account unlocks bookmarks, progress tracking, personalized learning, and future premium features.",
  },
  {
    question: "Is Hyper Learning free to use?",
    answer:
      "The core learning features are free. Additional advanced features may be introduced in the future while keeping educational accessibility as a priority.",
  },
  {
    question: "Can I contribute papers or learning resources?",
    answer:
      "Yes. Approved contributors and administrators can upload question papers, improve content quality, and help expand educational resources on the platform.",
  },
];

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
          {faqs.map((faq, index) => (
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
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
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
            We're continuously improving Hyper Learning based on student
            feedback.
          </div>
        </motion.div>
      </div>
    </section>
  );
}