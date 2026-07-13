"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";

import { PremiumAnimatedBoy } from "./premium-animated-boy";

export default function UniversityFlowBanner() {
  const steps = [
    "Branch",
    "Semester",
    "Subject",
    "Syllabus",
    "PYQs",
    "Hyper AI",
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [jumpGap, setJumpGap] = useState<number | null>(null);
  const [targetX, setTargetX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const jumpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current) {
        const nodes =
          containerRef.current.querySelectorAll(".node-center-point");
        if (nodes[activeStep]) {
          const node = nodes[activeStep] as HTMLElement;
          const containerRect = containerRef.current.getBoundingClientRect();
          const nodeRect = node.getBoundingClientRect();
          const x = nodeRect.left - containerRect.left + nodeRect.width / 2;
          setTargetX(x);

          if (scrollContainerRef.current) {
            const scrollContainer = scrollContainerRef.current;
            const scrollLeft =
              node.offsetLeft -
              scrollContainer.clientWidth / 2 +
              node.clientWidth / 2;
            scrollContainer.scrollTo({ left: scrollLeft, behavior: "smooth" });
          }
        }
      }
    };

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updatePosition, 100);
    };

    // Need a small timeout to ensure DOM layout is complete before measuring
    const t = setTimeout(updatePosition, 50);
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(t);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeStep]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (activeStep >= steps.length - 1) {
      // We reached the end. Do nothing, stay on the last node forever.
      return;
    } else {
      // First node: 1.5s to build anticipation for standing jump
      // Second node: 1s brief pause after landing first jump
      // Remaining nodes: 700ms for continuous running — must be > 500ms so bounce resets
      const delay = activeStep === 0 ? 1500 : activeStep === 1 ? 1000 : 700;

      timeoutId = setTimeout(() => {
        // 1. Trigger the jump trail arc and boy's leap animation
        setJumpGap(activeStep);
        jumpTimeoutRef.current = setTimeout(
          () => setJumpGap(null),
          activeStep === 0 ? 500 : 600
        );

        // 2. Actually move to the next node
        setActiveStep(activeStep + 1);
      }, delay);
    }

    return () => clearTimeout(timeoutId);
  }, [activeStep, steps.length]);

  const isJumping = jumpGap !== null;

  return (
    <div className="relative z-10 flex justify-center w-full mt-8">
      <div className="w-full max-w-6xl">
        <div
          className="relative overflow-x-auto px-8 md:px-12 pb-8 pt-28 -mt-20 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          ref={scrollContainerRef}
        >
          {/* Inner container that enforces min-width so nodes don't get squished */}
          <div className="relative min-w-[700px]">
            {/* Premium Braided Rope / Cable (Background Track) */}
            <div
              className="absolute top-1/2 left-[5%] right-[5%] md:left-[8%] md:right-[8%] h-[8px] -translate-y-1/2 rounded-full z-0 overflow-hidden bg-slate-200 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_4px_rgba(0,0,0,0.8)]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 6px, rgba(255,255,255,0.2) 6px, rgba(255,255,255,0.2) 7px)",
              }}
            >
              {/* Animated Blue Rope Fill */}
              <motion.div
                className="h-full rounded-full bg-blue-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_0_12px_rgba(59,130,246,0.6)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_0_16px_rgba(59,130,246,0.8)]"
                initial={{ width: "0%" }}
                animate={{
                  width: `${(activeStep / (steps.length - 1)) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.25) 4px, rgba(0,0,0,0.25) 6px, rgba(255,255,255,0.3) 6px, rgba(255,255,255,0.3) 7px)",
                }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative z-10 flex items-center justify-between w-full"
              ref={containerRef}
            >
              {/* SINGLE GLOBAL BOY TO PREVENT GHOSTING */}
              {targetX > 0 && (
                <motion.div
                  className="absolute top-[-70px] z-20 pointer-events-none"
                  initial={false}
                  animate={{ left: targetX }}
                  transition={{
                    left: { type: "spring", stiffness: 200, damping: 25 },
                  }}
                  style={{ x: "-50%" }}
                >
                  <motion.div
                    className="relative flex items-center justify-center"
                    initial={{ y: 0 }}
                    animate={isJumping ? { y: [0, -45, 0] } : { y: 0 }}
                    transition={{ y: { duration: 0.5, ease: "easeInOut" } }}
                  >
                    <PremiumAnimatedBoy
                      isHappy={activeStep === steps.length - 1}
                      isJumping={isJumping}
                      isIdle={
                        !isJumping && (activeStep === 0 || activeStep === 1)
                      }
                      jumpType={jumpGap === 0 ? "standing" : "running"}
                    />

                    {activeStep === steps.length - 1 && !isJumping && (
                      <>
                        {/* Minimal Radial Burst */}
                        {[
                          {
                            x: 35,
                            y: -35,
                            r: 45,
                            color: "#3b82f6",
                            size: 3,
                            delay: 0,
                          },
                          {
                            x: 50,
                            y: -10,
                            r: 75,
                            color: "#10b981",
                            size: 2.5,
                            delay: 0.05,
                          },
                          {
                            x: 35,
                            y: 25,
                            r: 125,
                            color: "#06b6d4",
                            size: 3,
                            delay: 0.1,
                          },
                          {
                            x: -35,
                            y: 25,
                            r: 235,
                            color: "#ec4899",
                            size: 2.5,
                            delay: 0.02,
                          },
                          {
                            x: -50,
                            y: -10,
                            r: 285,
                            color: "#f59e0b",
                            size: 3,
                            delay: 0.08,
                          },
                          {
                            x: -35,
                            y: -35,
                            r: 315,
                            color: "#8b5cf6",
                            size: 2.5,
                            delay: 0.04,
                          },
                          {
                            x: 20,
                            y: -15,
                            r: 55,
                            color: "#f43f5e",
                            size: 2,
                            delay: 0.07,
                          },
                          {
                            x: -20,
                            y: -15,
                            r: 305,
                            color: "#eab308",
                            size: 2,
                            delay: 0.03,
                          },
                        ].map((p, i) => (
                          <motion.div
                            key={i}
                            className="absolute pointer-events-none"
                            initial={{
                              opacity: 0,
                              x: 0,
                              y: 0,
                              scale: 0,
                              rotate: p.r,
                            }}
                            animate={{
                              opacity: [0, 1, 1, 0],
                              x: p.x,
                              y: p.y,
                              scale: [0, 1, 0.8, 0],
                              rotate: p.r,
                            }}
                            transition={{
                              duration: 0.8,
                              delay: p.delay,
                              ease: "easeOut",
                            }}
                            style={{
                              width: p.size,
                              height: p.size * 3.5, // long streak!
                              backgroundColor: p.color,
                              borderRadius: "999px", // perfect pill shape
                              left: "50%",
                              top: "50%",
                              marginLeft: -(p.size / 2),
                              marginTop: -((p.size * 3.5) / 2),
                            }}
                          />
                        ))}
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}

              {steps.map((step, index) => (
                <React.Fragment key={step}>
                  {/* Node Container */}
                  <div className="relative flex justify-center z-10 shrink-0 node-center-point">
                    {/* Glass Platform underneath the Node */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-blue-400/20 rounded-[100%] shadow-[inset_0_0_12px_rgba(59,130,246,0.3)] dark:bg-blue-600/30 dark:shadow-[inset_0_0_12px_rgba(59,130,246,0.6)] -z-10" />

                    {/* The Node Pill */}
                    <div
                      className={`relative z-10 flex items-center justify-center rounded-full px-5 py-2 text-[13px] md:text-[15px] font-semibold transition-all duration-500 whitespace-nowrap ${
                        activeStep === index
                          ? "ring-4 ring-blue-400/30 ring-offset-2 dark:ring-offset-background scale-110"
                          : activeStep > index
                            ? "scale-100 opacity-100"
                            : "scale-100 opacity-70"
                      } ${
                        step === "Hyper AI"
                          ? "bg-gradient-to-b from-blue-500 to-indigo-600 text-white shadow-[0_4px_14px_0_rgb(59,130,246,40%)] border-0"
                          : activeStep === index
                            ? "bg-blue-50 border-2 border-blue-400 text-blue-700 shadow-sm dark:bg-blue-950 dark:border-blue-500/80 dark:text-blue-300"
                            : activeStep > index
                              ? "bg-white border-2 border-blue-200 text-blue-600 shadow-sm dark:bg-slate-900 dark:border-blue-800/60 dark:text-blue-400"
                              : "bg-white border-2 border-slate-200 text-slate-500 shadow-sm dark:bg-slate-900 dark:border-slate-700/80 dark:text-slate-400"
                      }`}
                    >
                      {step}
                    </div>
                  </div>

                  {/* Dynamic Dashed Jump Arc Trail */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 relative h-[70px] -mt-[35px] mx-[8px] z-0 pointer-events-none">
                      <AnimatePresence>
                        {jumpGap === index && (
                          <motion.div
                            initial={
                              {
                                maskPosition: "-80% 0%",
                                WebkitMaskPosition: "-80% 0%",
                              } as any
                            }
                            animate={
                              {
                                maskPosition: "100% 0%",
                                WebkitMaskPosition: "100% 0%",
                              } as any
                            }
                            exit={{ opacity: 0, transition: { duration: 0.1 } }}
                            transition={{ duration: 0.5, ease: "linear" }}
                            style={{
                              maskImage:
                                "linear-gradient(to right, transparent 0%, black 85%, transparent 100%)",
                              WebkitMaskImage:
                                "linear-gradient(to right, transparent 0%, black 85%, transparent 100%)",
                              maskSize: "80% 100%",
                              WebkitMaskSize: "80% 100%",
                              maskRepeat: "no-repeat",
                              WebkitMaskRepeat: "no-repeat",
                            }}
                            className="absolute inset-0 border-t-[3px] border-dashed border-blue-400/80 rounded-t-full shadow-[0_-4px_10px_rgba(59,130,246,0.2)]"
                          />
                        )}
                      </AnimatePresence>
                      
                      {/* Mobile Separator */}
                      <div className="sm:hidden absolute top-[35px] w-full border-t-2 border-dashed border-slate-300" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
