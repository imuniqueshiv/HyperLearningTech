"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
}) {
  // 3D unfolding effect!
  // Left cards fold out from the right edge (touching desktop path).
  // Right cards fold out from the left edge (touching desktop path).
  // On mobile, they both fold out from the center (touching mobile path).

  const initialRotateY =
    direction === "left" ? -90 : direction === "right" ? 90 : 0;
  const initialRotateX = direction === "up" ? -90 : 0;

  const originClass =
    direction === "left"
      ? "origin-center md:origin-right"
      : direction === "right"
        ? "origin-center md:origin-left"
        : "origin-bottom";

  return (
    <div style={{ perspective: "2000px" }} className="w-full relative z-10">
      <motion.div
        initial={{
          opacity: 0,
          rotateY: initialRotateY,
          rotateX: initialRotateX,
          scale: 0.9,
        }}
        whileInView={{
          opacity: 1,
          rotateY: 0,
          rotateX: 0,
          scale: 1,
        }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{
          duration: 1.2,
          delay: delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`w-full ${originClass}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
