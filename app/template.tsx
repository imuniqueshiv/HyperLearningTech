"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 16,
    },
    enter: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <motion.main
      variants={variants}
      initial="hidden"
      animate="enter"
      transition={{
        type: "tween",
        ease: "easeOut",
        duration: shouldReduceMotion ? 0.15 : 0.4,
      }}
      className="flex min-h-screen w-full flex-col"
    >
      {children}
    </motion.main>
  );
}
