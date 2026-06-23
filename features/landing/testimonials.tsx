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
  {
    name: "Nitin Pandey",
    role: "B.Tech Student",
    university: "RGPV",
    review:
      "Hyper Learning has completely transformed how I prepare for my exams. The AI-powered insights are incredibly accurate and helpful.",
  },
  {
    name: "Ramoo Kachhee",
    role: "B.Tech Student",
    university: "RGPV",
    review:
      "The platform is a game-changer for engineering students. I can now access all my study materials in one place without any hassle.",
  },
  {
    name: "Rayush Bisen",
    role: "B.Tech Student",
    university: "RGPV",
    review:
      "I love how the AI breaks down complex topics into simple explanations. It makes learning so much easier and more enjoyable.",
  },
  {
    name: "Vivek Patel",
    role: "B.Tech Student",
    university: "RGPV",
    review:
      "The previous year questions and syllabus mapping are spot on. I feel much more confident going into my exams now.",
  },
  {
    name: "Shivam Gurjar",
    role: "B.Tech Student",
    university: "RGPV",
    review:
      "This is exactly what every engineering student needs. The AI tutor is like having a personal teacher available 24/7.",
  },
  {
    name: "Shalini Ade",
    role: "B.Tech Student",
    university: "RGPV",
    review:
      "Hyper Learning has made studying so much more efficient. I can focus on what really matters for my exams.",
  },
  {
    name: "Satyam Mishra",
    role: "B.Tech Student",
    university: "RGPV",
    review:
      "The platform is intuitive and the AI-generated notes are top-notch. Highly recommend it to all engineering students.",
  },
  {
    name: "Manas",
    role: "B.Tech Student",
    university: "RGPV",
    review:
      "I've never seen such a comprehensive learning tool before. It covers everything from syllabus to PYQs in one place.",
  },
  {
    name: "Prince Dhote",
    role: "B.Tech Student",
    university: "RGPV",
    review:
      "The AI explanations are a lifesaver during exam preparation. It helps me understand concepts that I previously struggled with.",
  },
  {
    name: "Saubhagya Chaurasiya",
    role: "B.Tech Student",
    university: "RGPV",
    review:
      "Hyper Learning is the future of engineering education. The seamless integration of AI with learning is truly impressive.",
  },
];

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-24">
      {/* Background Glows - No grid pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-20 top-10 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute right-20 bottom-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-semibold text-[#1D4ED8] shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            Student Feedback
          </span>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Loved By Students
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Hyper Learning is designed to simplify engineering education through
            AI-powered learning, syllabus mapping, and smarter exam preparation.
          </p>
        </motion.div>

        {/* Testimonials */}
        <div className="relative overflow-hidden">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex gap-6"
            style={{ width: "max-content" }}
          >
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="group relative w-[320px] flex-shrink-0 overflow-hidden rounded-3xl border border-border bg-background/90 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:hover:border-blue-500/30"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100 blur-3xl dark:bg-blue-500/20" />
                </div>

                {/* Quote */}
                <div className="relative z-10 mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#1D4ED8] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                  <Quote className="h-5 w-5" />
                </div>

                {/* Rating */}
                <div className="relative z-10 mb-4 flex gap-1">
                  {[...Array(5)].map((_, idx) => (
                    <Star
                      key={idx}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Review */}
                <p className="relative z-10 text-sm leading-7 text-muted-foreground">
                  &apos;{testimonial.review}&apos;
                </p>

                {/* User */}
                <div className="relative z-10 mt-5 border-t border-border pt-4">
                  <h3 className="font-semibold text-foreground">
                    {testimonial.name}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#1D4ED8] dark:text-blue-400">
                    {testimonial.university}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <div className="inline-block rounded-3xl border border-border bg-background/80 px-12 py-8 shadow-lg backdrop-blur-sm">
            <h3 className="text-4xl font-extrabold text-foreground">500+</h3>
            <p className="mt-2 text-muted-foreground">Happy Learners</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
