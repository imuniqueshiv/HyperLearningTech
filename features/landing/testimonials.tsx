"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Aman Verma",
    role: "B.Tech AIML Student",
    university: "RGPV",
    review:
      "The syllabus mapping and AI-generated explanations saved me countless hours during exam preparation. Everything is structured exactly how a student needs it.",
  },
  {
    name: "Priya Sharma",
    role: "B.Tech CSE Student",
    university: "RGPV",
    review:
      "Instead of searching multiple websites, I can find PYQs, topic notes, and explanations in one place. The AI tutor is especially useful before exams.",
  },
  {
    name: "Rahul Patel",
    role: "B.Tech CSIT Student",
    university: "RGPV",
    review:
      "The biggest advantage is the connection between syllabus topics and previous year questions. It helps me focus only on what actually matters.",
  },
];

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden border-b border-border py-24">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-20 top-10 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute right-20 bottom-10 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
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
            Student Feedback
          </span>

          <h2 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Loved By Students
          </h2>

          <p className="mt-6 text-lg text-slate-400">
            Hyper Learning is designed to simplify engineering education through
            AI-powered learning, syllabus mapping, and smarter exam preparation.
          </p>
        </motion.div>

        {/* Testimonials */}
        <div className="grid gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 24 }}
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

              {/* Quote Icon */}
              <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <Quote className="h-6 w-6" />
              </div>

              {/* Rating */}
              <div className="relative z-10 mb-5 flex gap-1">
                {[...Array(5)].map((_, idx) => (
                  <Star
                    key={idx}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Review */}
              <p className="relative z-10 leading-8 text-slate-300">
                "{testimonial.review}"
              </p>

              {/* User */}
              <div className="relative z-10 mt-8 border-t border-slate-800 pt-6">
                <h3 className="font-semibold text-white">
                  {testimonial.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {testimonial.role}
                </p>

                <p className="mt-1 text-sm text-blue-400">
                  {testimonial.university}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-20 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-10"
        >
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <h3 className="text-4xl font-bold text-white">5000+</h3>
              <p className="mt-2 text-slate-400">
                Previous Year Questions
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-white">200+</h3>
              <p className="mt-2 text-slate-400">
                AI Generated Learning Topics
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-white">24/7</h3>
              <p className="mt-2 text-slate-400">
                AI Learning Assistance
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}