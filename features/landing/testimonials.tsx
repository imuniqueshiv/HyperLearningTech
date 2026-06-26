"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { Quote, Star, Pause, Play } from "lucide-react";

import { landingTestimonials } from "@/lib/data/landing";

export default function Testimonials() {
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimation();

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (isPaused) {
      controls.stop();
    } else {
      controls.start({
        x: ["0%", "-50%"],
        transition: {
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        },
      });
    }
  }, [isPaused, shouldReduceMotion, controls]);

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
          <div className="absolute right-4 top-0 z-20 mb-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-muted/80"
              aria-label={isPaused ? "Play testimonials" : "Pause testimonials"}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              <span className="sr-only sm:not-sr-only">
                {isPaused ? "Play" : "Pause"}
              </span>
            </button>
          </div>
          <motion.div
            initial={{ x: 0 }}
            animate={shouldReduceMotion ? { x: 0 } : controls}
            className="flex gap-6 pt-12"
            style={{ width: "max-content" }}
          >
            {[...landingTestimonials, ...landingTestimonials].map(
              (testimonial, index) => (
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
                    <Quote className="h-5 w-5" aria-hidden="true" />
                  </div>

                  {/* Rating */}
                  <div className="relative z-10 mb-4 flex gap-1">
                    {[...Array(5)].map((_, idx) => (
                      <Star
                        key={idx}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        aria-hidden="true"
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
              )
            )}
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
