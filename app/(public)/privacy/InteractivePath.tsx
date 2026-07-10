"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useMotionValueEvent,
} from "framer-motion";

export function InteractivePath() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const desktopTrackerRef = useRef<HTMLDivElement>(null);
  const mobileTrackerRef = useRef<HTMLDivElement>(null);
  const jumpBackEndTimeRef = useRef<number>(0);

  const [hasJumped, setHasJumped] = useState(false);
  const [jumpOffset, setJumpOffset] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    restDelta: 0.001,
  });

  const triggerJump = () => {
    const button = document.getElementById("contact-cta-button");
    const isMobile = window.innerWidth < 640;
    const activeTracker = isMobile
      ? mobileTrackerRef.current
      : desktopTrackerRef.current;

    if (button && activeTracker && !hasJumped) {
      const btnRect = button.getBoundingClientRect();
      const trackerRect = activeTracker.getBoundingClientRect();

      const deltaX =
        btnRect.left +
        btnRect.width / 2 -
        (trackerRect.left + trackerRect.width / 2);
      const deltaY =
        btnRect.top +
        btnRect.height / 2 -
        (trackerRect.top + trackerRect.height / 2);

      setJumpOffset({ x: deltaX, y: deltaY });
      setHasJumped(true);
    }
  };

  useMotionValueEvent(smoothProgress, "change", (val) => {
    // Clamp value between 0 and 1 to prevent spring overshoot from breaking getPointAtLength coordinates
    const clampedVal = Math.max(0, Math.min(1, val));

    // Lock the tracker position at exactly 1.0 when we exceed 0.99 OR if the reverse jump animation is currently playing (850ms).
    // This stops the anchor from moving up the path while the man is mid-air jumping backward, guaranteeing he lands exactly where he jumped from.
    const isMidAirReverse = Date.now() < jumpBackEndTimeRef.current;
    const effectiveVal = clampedVal > 0.99 || isMidAirReverse ? 1 : clampedVal;

    // Desktop tracker
    if (pathRef.current && desktopTrackerRef.current) {
      const length = pathRef.current.getTotalLength();
      const point = pathRef.current.getPointAtLength(effectiveVal * length);

      desktopTrackerRef.current.style.left = `${point.x}%`;
      desktopTrackerRef.current.style.top = `${point.y}%`;
      desktopTrackerRef.current.style.transform = `translate(-50%, -50%)`;
    }

    // Mobile tracker (straight line down)
    if (mobileTrackerRef.current) {
      mobileTrackerRef.current.style.top = `${effectiveVal * 100}%`;
      mobileTrackerRef.current.style.transform = `translate(-50%, -50%)`;
    }

    // NOW that the DOM is locked in position, check for the jump.
    if (clampedVal > 0.99 && !hasJumped) {
      triggerJump();
    } else if (clampedVal < 0.97 && hasJumped) {
      setHasJumped(false);
      jumpBackEndTimeRef.current = Date.now() + 850; // Lock the anchor for the 0.85s reverse animation time
    }
  });

  // Parabolic Jump Physics:
  const jumpStyleX = {
    transform: hasJumped ? `translateX(${jumpOffset.x}px)` : "translateX(0px)",
    transition: "transform 1.05s linear", // always animate X
  };

  const jumpStyleY = {
    transform: hasJumped
      ? `translateY(${jumpOffset.y}px) scale(0.5)`
      : "translateY(0px) scale(1)",
    // Jump IN: cubic-bezier with negative parameter (pulls UP before releasing DOWN).
    // Jump OUT (reverse): cubic-bezier with >1 parameter (overshoots UP before settling back to 0).
    transition: hasJumped
      ? "transform 1.05s cubic-bezier(0.35, -0.6, 0.75, 1)"
      : "transform 0.85s cubic-bezier(0.25, 1.4, 0.65, 1)",
  };

  return (
    <motion.div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    >
      {/* ================= MOBILE ================= */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-20 bottom-0 w-0 border-l-[2.5px] border-dashed border-slate-300 dark:border-cyan-500/30 sm:hidden" />

      <div
        ref={mobileTrackerRef}
        className="absolute left-1/2 top-0 w-10 h-10 sm:hidden flex items-center justify-center z-20"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div
          style={jumpStyleX}
          className="w-full h-full flex items-center justify-center"
        >
          <div
            style={jumpStyleY}
            className="w-full h-full flex items-center justify-center"
          >
            <RunningManIcon hasJumped={hasJumped} />
          </div>
        </div>
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="absolute inset-0 hidden sm:block">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
          fill="none"
        >
          <path
            d="M 50 0 C 50 5, 25 10, 25 15 C 25 25, 75 30, 75 40 C 75 50, 25 55, 25 65 C 25 75, 75 80, 75 90 C 75 95, 50 100, 50 100"
            vectorEffect="non-scaling-stroke"
            stroke="currentColor"
            strokeWidth="10"
            className="text-cyan-500/10 dark:text-cyan-500/5"
            filter="blur(6px)"
          />
          <path
            ref={pathRef}
            d="M 50 0 C 50 5, 25 10, 25 15 C 25 25, 75 30, 75 40 C 75 50, 25 55, 25 65 C 25 75, 75 80, 75 90 C 75 95, 50 100, 50 100"
            vectorEffect="non-scaling-stroke"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 8"
            strokeLinecap="round"
            className="text-slate-300 dark:text-cyan-500/30"
          />
          <path
            d="M 50 0 C 50 5, 25 10, 25 15 C 25 25, 75 30, 75 40 C 75 50, 25 55, 25 65 C 25 75, 75 80, 75 90 C 75 95, 50 100, 50 100"
            vectorEffect="non-scaling-stroke"
            stroke="url(#cyan-pulse)"
            strokeWidth="3.5"
            strokeDasharray="20 80"
            strokeLinecap="round"
            className="animate-travel drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
          />

          <defs>
            <linearGradient id="cyan-pulse" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34, 211, 238, 1)" />
              <stop offset="100%" stopColor="rgba(99, 102, 241, 1)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div
        ref={desktopTrackerRef}
        className="absolute top-0 left-1/2 w-10 h-10 hidden sm:flex items-center justify-center z-20"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div
          style={jumpStyleX}
          className="w-full h-full flex items-center justify-center"
        >
          <div
            style={jumpStyleY}
            className="w-full h-full flex items-center justify-center"
          >
            <RunningManIcon hasJumped={hasJumped} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes travel {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-travel {
          animation: travel 3s linear infinite;
        }
      `}</style>
    </motion.div>
  );
}

function RunningManIcon({ hasJumped }: { hasJumped: boolean }) {
  // Generate 8 particles for the sprinkle explosion
  const particles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    const radius = 45;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Sprinkle Explosion */}
      {particles.map((p, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 z-20 pointer-events-none"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: hasJumped ? p.x : 0,
            y: hasJumped ? p.y : 0,
            opacity: hasJumped ? [0, 1, 0] : 0,
            scale: hasJumped ? [0, 1.5, 0] : 0,
          }}
          transition={{
            duration: 0.6,
            delay: hasJumped ? 1.05 : 0, // Delay until jump physically lands
            ease: "easeOut",
          }}
        />
      ))}

      {/* Stone in Water Ripple Effect */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute rounded-full border-2 border-cyan-400 dark:border-cyan-300 z-10 pointer-events-none shadow-[0_0_15px_rgba(34,211,238,0.5)]"
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: hasJumped ? 250 : 0,
            height: hasJumped ? 250 : 0,
            opacity: hasJumped ? [0, 0.6, 0] : 0,
          }}
          transition={{
            duration: 1.5,
            delay: hasJumped ? 1.05 + i * 0.3 : 0, // Staggered ripples starting exactly at landing
            ease: "easeOut",
          }}
        />
      ))}

      <div
        className="absolute inset-0 bg-cyan-500/40 dark:bg-cyan-400/40 rounded-full animate-ping"
        style={{
          animationDuration: "2s",
          opacity: hasJumped ? 0 : 1,
          transition: hasJumped
            ? "opacity 0.2s ease-in 0.85s"
            : "opacity 0.2s ease-out",
        }}
      />
      <div
        className="relative flex items-center justify-center w-8 h-8 bg-white dark:bg-[#030712] border-2 border-cyan-500 rounded-full shadow-[0_0_20px_rgba(34,211,238,1)] z-10 text-cyan-600 dark:text-cyan-400"
        style={{
          opacity: hasJumped ? 0 : 1,
          transition: hasJumped
            ? "opacity 0.2s ease-in 0.85s"
            : "opacity 0.2s ease-out",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 6.7 1.4z" />
        </svg>
      </div>
    </div>
  );
}
