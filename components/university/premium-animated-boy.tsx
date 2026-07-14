import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export const PremiumAnimatedBoy = ({
  isJumping = false,
  isHappy = false,
  isIdle = false,
  jumpType = "standing",
}: {
  isJumping?: boolean;
  isHappy?: boolean;
  isIdle?: boolean;
  jumpType?: "standing" | "running";
}) => {
  const [stride, setStride] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t: any = {
    duration: isJumping && jumpType === "running" ? 0.6 : 0.45,
    ease:
      isJumping && jumpType === "running" ? "easeInOut" : [0.25, 1, 0.35, 1],
  };
  const ht = {
    repeat: Infinity,
    duration: 0.4,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sideToFrontVars = (sideVal: number, frontVal: number): any => ({
    run_a: { x: sideVal, transition: t },
    run_b: { x: sideVal, transition: t },
    standing_jump: { x: sideVal, transition: t },
    running_jump: { x: sideVal, transition: t },
    idle: { x: sideVal, transition: { duration: 0.3 } },
    happy: { x: frontVal, transition: { duration: 0.4, ease: "easeOut" } },
  });

  useEffect(() => {
    if (isJumping || isHappy || isIdle) return;
    const interval = setInterval(() => {
      setStride((s) => s + 1);
    }, 450);
    return () => clearInterval(interval);
  }, [isJumping, isHappy, isIdle]);

  const isStrideB = stride % 2 === 1;
  const currentVariant = isJumping
    ? jumpType === "running"
      ? "running_jump"
      : "standing_jump"
    : isHappy
      ? "happy"
      : isIdle
        ? "idle"
        : isStrideB
          ? "run_b"
          : "run_a";

  // ==========================================
  // FORWARD KINEMATICS ENGINE
  // ==========================================
  // Calculates the (x,y) of the knee/elbow and ankle/hand
  const getFK = (a1: number, a2: number, L1: number, L2: number) => {
    const r1 = (a1 * Math.PI) / 180;
    const x1 = -L1 * Math.sin(r1);
    const y1 = L1 * Math.cos(r1);
    const r2 = ((a1 + a2) * Math.PI) / 180;
    const x2 = x1 - L2 * Math.sin(r2);
    const y2 = y1 + L2 * Math.cos(r2);
    return { x1, y1, x2, y2 };
  };

  const getLimbPath = (
    a1s: number[],
    a2s: number[],
    L1: number,
    L2: number
  ) => {
    return a1s.map((a1, i) => {
      const { x1, y1, x2, y2 } = getFK(a1, a2s[i], L1, L2);
      return `M 0,0 L ${x1.toFixed(2)},${y1.toFixed(2)} L ${x2.toFixed(2)},${y2.toFixed(2)}`;
    });
  };

  const getEndObj = (a1s: number[], a2s: number[], L1: number, L2: number) => ({
    x: a1s.map((a1, i) => getFK(a1, a2s[i], L1, L2).x2),
    y: a1s.map((a1, i) => getFK(a1, a2s[i], L1, L2).y2),
  });

  const buildLimbVars = (
    h_ra: number[],
    k_ra: number[],
    h_rb: number[],
    k_rb: number[],
    h_j: number[],
    k_j: number[],
    h_rj: number[],
    k_rj: number[],
    h_h: number[],
    k_h: number[],
    L1: number,
    L2: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => ({
    run_a: { d: getLimbPath(h_ra, k_ra, L1, L2), transition: t },
    run_b: { d: getLimbPath(h_rb, k_rb, L1, L2), transition: t },
    standing_jump: { d: getLimbPath(h_j, k_j, L1, L2), transition: t },
    running_jump: { d: getLimbPath(h_rj, k_rj, L1, L2), transition: t },
    idle: {
      d: getLimbPath([0], [0], L1, L2)[0],
      transition: { duration: 0.3 },
    },
    happy: {
      d: getLimbPath([h_h[0]], [k_h[0]], L1, L2)[0],
      transition: { duration: 0.3 },
    },
  });

  const buildEndVars = (
    h_ra: number[],
    k_ra: number[],
    a_ra: number[] | null,
    h_rb: number[],
    k_rb: number[],
    a_rb: number[] | null,
    h_j: number[],
    k_j: number[],
    a_j: number[] | null,
    h_rj: number[],
    k_rj: number[],
    a_rj: number[] | null,
    h_h: number[],
    k_h: number[],
    a_h: number[] | null,
    L1: number,
    L2: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => ({
    run_a: {
      ...getEndObj(h_ra, k_ra, L1, L2),
      rotate: h_ra.map((h, i) => h + k_ra[i] + (a_ra?.[i] || 0)),
      transition: t,
    },
    run_b: {
      ...getEndObj(h_rb, k_rb, L1, L2),
      rotate: h_rb.map((h, i) => h + k_rb[i] + (a_rb?.[i] || 0)),
      transition: t,
    },
    standing_jump: {
      ...getEndObj(h_j, k_j, L1, L2),
      rotate: h_j.map((h, i) => h + k_j[i] + (a_j?.[i] || 0)),
      transition: t,
    },
    running_jump: {
      ...getEndObj(h_rj, k_rj, L1, L2),
      rotate: h_rj.map((h, i) => h + k_rj[i] + (a_rj?.[i] || 0)),
      transition: t,
    },
    idle: {
      x: getEndObj([0], [0], L1, L2).x[0],
      y: getEndObj([0], [0], L1, L2).y[0],
      rotate: 0,
      transition: { duration: 0.3 },
    },
    happy: {
      x: getEndObj([h_h[0]], [k_h[0]], L1, L2).x[0],
      y: getEndObj([h_h[0]], [k_h[0]], L1, L2).y[0],
      rotate: h_h[0] + k_h[0] + (a_h?.[0] || 0),
      transition: { duration: 0.3 },
    },
  });

  // ==========================================
  // KINEMATICS DATA
  // ==========================================
  const L_THIGH = 23;
  const L_CALF = 19;
  const L_UPARM = 12;
  const L_FOREARM = 12;

  // ==== FRONT LEG ====
  const fl_h_ra = [0, -15, -40, -30, -15];
  const fl_k_ra = [0, 20, 0, 15, 30];
  const fl_a_ra = [0, 30, -15, -25, -10];
  const fl_h_rb = [0, 15, 30, 15, 0];
  const fl_k_rb = [0, 40, 110, 60, 30];
  const fl_a_rb = [0, 15, -5, -10, 5];
  const fl_h_j = [0, -30, 10, -15, -25];
  const fl_k_j = [0, 60, 10, 30, 50];
  const fl_a_j = [0, 0, 10, 5, 0];
  const fl_h_rj = [0, -30, -50, -30, -10];
  const fl_k_rj = [0, 10, 5, 10, 20];
  const fl_a_rj = [0, -10, -20, -10, 0];
  const fl_h_h = [-5, -6];
  const fl_k_h = [5, 6];
  const fl_a_h = [0, 0];

  // ==== BACK LEG ====
  const bl_h_ra = [0, 15, 30, 15, 0];
  const bl_k_ra = [0, 40, 110, 60, 30];
  const bl_a_ra = [0, 15, -10, 5, 0];
  const bl_h_rb = [0, -15, -40, -30, -15];
  const bl_k_rb = [0, 20, 0, 15, 30];
  const bl_a_rb = [0, 25, -20, -5, 0];
  const bl_h_j = [0, -30, 10, -15, -25];
  const bl_k_j = [0, 60, 10, 30, 50];
  const bl_a_j = [0, 15, -5, 5, 10];
  const bl_h_rj = [0, 20, 45, 20, 10];
  const bl_k_rj = [0, 40, 80, 40, 20];
  const bl_a_rj = [0, 15, 5, 15, 0];
  const bl_h_h = [5, 6];
  const bl_k_h = [5, 6];
  const bl_a_h = [0, 0];

  // ==== FRONT ARM ====
  const fa_s_ra = [0, 50, 80, 50, -10];
  const fa_e_ra = [0, -60, -100, -70, -40];
  const fa_s_rb = [0, -50, -80, -50, 10];
  const fa_e_rb = [0, -60, -90, -60, -40];
  const fa_s_j = [0, 45, -60, -28, 10];
  const fa_e_j = [0, -20, -90, -60, -40];
  const fa_s_rj = [0, 30, 55, 30, 10];
  const fa_e_rj = [0, -40, -80, -40, -20];
  const fa_s_h = [-140, -142];
  const fa_e_h = [0, -2];

  // ==== BACK ARM ====
  const ba_s_ra = [0, -40, -70, -40, 10];
  const ba_e_ra = [0, 30, 70, 30, 0];
  const ba_s_rb = [0, 40, 70, 40, -10];
  const ba_e_rb = [0, -30, -60, -30, -15];
  const ba_s_j = [0, 45, -60, -28, 10];
  const ba_e_j = [0, 45, -90, -20, 10];
  const ba_s_rj = [0, -30, -55, -30, -10];
  const ba_e_rj = [0, 20, 50, 20, 0];
  const ba_s_h = [140, 142];
  const ba_e_h = [0, 2];

  const renderShoe = (isHappyFront = false) => {
    if (isHappyFront) {
      return (
        <g>
          <circle cx="0" cy="0" r="3.5" fill="#374151" />
          <ellipse cx="0" cy="4" rx="4.5" ry="2.5" fill="#ffffff" />
          <ellipse cx="0" cy="1.5" rx="4" ry="3.5" fill="url(#shoeG)" />
        </g>
      );
    }
    return (
      <g>
        <circle cx="0" cy="0" r="3.5" fill="#374151" />
        <path
          d="M -8,3.5 L 12,3.5 C 13,3.5 13,6 11,6 L -7,6 C -9,6 -9,3.5 -8,3.5 Z"
          fill="#ffffff"
        />
        <path
          d="M -7,-2 C -7,-5 6,-5 8,-1 L 12,2 C 13,3 13,3.5 12,3.5 L -8,3.5 C -10,3.5 -10,1 -7,-2 Z"
          fill="url(#shoeG)"
        />
      </g>
    );
  };

  return (
    <motion.div
      className="w-20 h-20 sm:w-28 sm:h-28 overflow-visible relative"
      initial={false}
      animate={currentVariant}
      variants={{
        run_a: {
          y: [0, -1.8, -8.4, -4.8, -1.2, 0],
          rotate: [0, 4.8, 7.2, 4.8, 1.8, 0],
          transition: t,
        },
        run_b: {
          y: [0, -1.8, -8.4, -4.8, -1.2, 0],
          rotate: [0, 4.8, 7.2, 4.8, 1.8, 0],
          transition: t,
        },
        standing_jump: {
          y: [0, 3.6, -10.8, -6, -1.2, 0],
          rotate: [0, 3, 0, -1.8, 0, 0],
          transition: t,
        },
        running_jump: {
          y: [0, 1.8, -7.2, -3.6, -0.6, 0],
          rotate: [0, 9, 12, 9, 3, 0],
          transition: t,
        },
        idle: { y: 0, rotate: 0, transition: { duration: 0.3 } },
        happy: { y: [0, -1.5], rotate: 0, transition: ht },
      }}
      style={{ transformOrigin: "center 80%" }}
    >
      <motion.svg
        viewBox="-55 -88 110 190"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="shirtG" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0e5ec" />
          </linearGradient>
          <linearGradient id="bpG" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="shoeG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
          <linearGradient id="hairG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        <motion.ellipse
          cx="0"
          cy="45"
          rx="18"
          ry="4"
          fill="rgba(0,0,0,0.2)"
          variants={{
            run_a: {
              scale: [1, 0.9, 0.6, 0.8, 0.95, 1],
              opacity: [1, 0.8, 0.4, 0.6, 0.9, 1],
              transition: t,
            },
            run_b: {
              scale: [1, 0.9, 0.6, 0.8, 0.95, 1],
              opacity: [1, 0.8, 0.4, 0.6, 0.9, 1],
              transition: t,
            },
            standing_jump: {
              scale: [1, 1.1, 0.5, 0.7, 0.9, 1],
              opacity: [1, 1, 0.3, 0.5, 0.8, 1],
              transition: t,
            },
            running_jump: {
              scale: [1, 1.1, 0.4, 0.6, 0.9, 1],
              opacity: [1, 1, 0.2, 0.4, 0.8, 1],
              transition: t,
            },
            idle: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
            happy: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
          }}
        />

        {/* ======== BACK ARM ======== */}
        <motion.g variants={sideToFrontVars(-3, -8)}>
          <g transform="translate(0, -23)">
            <motion.path
              stroke="#f0c9a0"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              variants={buildLimbVars(
                ba_s_ra,
                ba_e_ra,
                ba_s_rb,
                ba_e_rb,
                ba_s_j,
                ba_e_j,
                ba_s_rj,
                ba_e_rj,
                ba_s_h,
                ba_e_h,
                L_UPARM,
                L_FOREARM
              )}
            />
            <motion.g
              variants={buildEndVars(
                ba_s_ra,
                ba_e_ra,
                null,
                ba_s_rb,
                ba_e_rb,
                null,
                ba_s_j,
                ba_e_j,
                null,
                ba_s_rj,
                ba_e_rj,
                null,
                ba_s_h,
                ba_e_h,
                null,
                L_UPARM,
                L_FOREARM
              )}
            >
              <rect
                x="-4"
                y="-4"
                width="8"
                height="10"
                rx="3.5"
                fill="#f0c9a0"
              />
            </motion.g>
          </g>
        </motion.g>

        {/* ======== BACK LEG ======== */}
        <motion.g variants={sideToFrontVars(-2, -6)}>
          <g transform="translate(0, 4)">
            <motion.path
              stroke="#0f172a"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              variants={buildLimbVars(
                bl_h_ra,
                bl_k_ra,
                bl_h_rb,
                bl_k_rb,
                bl_h_j,
                bl_k_j,
                bl_h_rj,
                bl_k_rj,
                bl_h_h,
                bl_k_h,
                L_THIGH,
                L_CALF
              )}
            />
            <motion.g
              variants={buildEndVars(
                bl_h_ra,
                bl_k_ra,
                bl_a_ra,
                bl_h_rb,
                bl_k_rb,
                bl_a_rb,
                bl_h_j,
                bl_k_j,
                bl_a_j,
                bl_h_rj,
                bl_k_rj,
                bl_a_rj,
                bl_h_h,
                bl_k_h,
                bl_a_h,
                L_THIGH,
                L_CALF
              )}
            >
              {renderShoe(isHappy)}
            </motion.g>
          </g>
        </motion.g>

        {/* ======== BACKPACK ======== */}
        <g transform="translate(-8, -22)">
          <motion.g
            style={{}}
            variants={{
              run_a: { rotate: [0, 5, -5, 5, 0], opacity: 1, transition: t },
              run_b: { rotate: [0, 5, -5, 5, 0], opacity: 1, transition: t },
              standing_jump: {
                rotate: [0, -8, 15, 10, 0],
                opacity: 1,
                transition: t,
              },
              running_jump: {
                rotate: [0, -10, 20, 15, 0],
                opacity: 1,
                transition: t,
              },
              idle: { rotate: 0, opacity: 1, transition: { duration: 0.3 } },
              happy: { rotate: 0, opacity: 0, transition: { duration: 0.3 } },
            }}
          >
            <path
              d="M -14,-2 C -14,-8 -12,-10 -7,-10 L 1,-10 C 6,-10 8,-8 8,-2 L 8,16 C 8,22 6,24 1,24 L -7,24 C -12,24 -14,22 -14,16 Z"
              fill="url(#bpG)"
            />
            <rect x="-15" y="6" width="6" height="12" rx="3" fill="#3b82f6" />
            <path d="M -14,-2 L -3,-10 L 8,-2 Z" fill="#93c5fd" opacity="0.4" />
            <rect
              x="-9"
              y="-2"
              width="12"
              height="18"
              rx="4"
              fill="#93c5fd"
              opacity="0.25"
            />
          </motion.g>
        </g>

        <rect x="-3" y="-35" width="8" height="10" rx="3.5" fill="#f0c9a0" />
        <path
          d="M -13,-24 A 6,6 0 0,1 -7,-30 L 7,-30 A 6,6 0 0,1 13,-24 L 10,0 A 4,4 0 0,1 6,4 L -6,4 A 4,4 0 0,1 -10,0 Z"
          fill="url(#shirtG)"
        />

        {/* Static belly strap */}
        <rect x="-11" y="-3" width="22" height="13" rx="4" fill="#0f172a" />

        <motion.g variants={sideToFrontVars(6, 0)}>
          <path
            d="M -5,-30 L -2,-25 L 0,-28 L 2,-25 L 5,-30"
            stroke="#94a3b8"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
          />
          <line
            x1="0"
            y1="-24"
            x2="0"
            y2="4"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />
          <circle cx="0" cy="-20" r="1.2" fill="#cbd5e1" />
          <circle cx="0" cy="-14" r="1.2" fill="#cbd5e1" />
          <circle cx="0" cy="-8" r="1.2" fill="#cbd5e1" />
          {/* Drawstrings on waistband */}
          <path
            d="M -1,-2 Q -3,3 -3,6"
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 1,-2 Q 3,4 2,8"
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        <g transform="translate(1, -30)">
          <motion.g
            style={{ transformOrigin: "0px 0px" }}
            variants={{
              run_a: { rotate: [0, -5, -12, -5, 0], transition: t },
              run_b: { rotate: [0, -5, -12, -5, 0], transition: t },
              standing_jump: { rotate: [0, -10, -5, 5, 0], transition: t },
              running_jump: { rotate: [0, -15, -10, 0, 0], transition: t },
              idle: { rotate: 0, transition: { duration: 0.3 } },
              happy: { rotate: 0, transition: { duration: 0.3 } },
            }}
          >
            <path
              d="M -13,-18 C -14,-28 14,-28 14,-18 C 14,-8 8,-3 0,-3 C -8,-3 -13,-8 -13,-18 Z"
              fill="#fde8d0"
            />
            <path
              d="M -13,-18 C -13,-10 -7,-4 0,-4 C 7,-4 13,-10 13,-18"
              stroke="#e8cfa6"
              strokeWidth="1"
              fill="none"
              opacity="0.5"
            />
            <ellipse cx="-13" cy="-16" rx="3" ry="4" fill="#f0c9a0" />
            <ellipse cx="13" cy="-16" rx="3" ry="4" fill="#f0c9a0" />

            {/* Hair - Pulled up to Y=-23 to reveal the peach forehead! */}
            <path
              d="M -14,-23 C -16,-30 -12,-37 -5,-39 C -1,-40 3,-40 7,-39 C 13,-37 16,-30 14,-23 C 12,-25 9,-25 4,-23 C 0,-25 -4,-25 -8,-23 C -11,-25 -13,-25 -14,-23 Z"
              fill="url(#hairG)"
            />
            <path d="M -12,-34 Q -9,-39 -5,-36" fill="url(#hairG)" />
            <path d="M -5,-37 Q -2,-42 2,-38" fill="url(#hairG)" />
            <path d="M 1,-37 Q 5,-42 7,-36" fill="url(#hairG)" />
            <path d="M 7,-36 Q 11,-40 13,-34" fill="url(#hairG)" />

            {/* Hair Highlight (Shine) */}
            <ellipse
              cx="-4"
              cy="-33"
              rx="5"
              ry="1.2"
              fill="#4b5563"
              transform="rotate(-15 -4 -33)"
              opacity="0.6"
            />

            {/* Blush - Static so it stays perfectly on his cheeks! */}
            <circle cx="-9" cy="-10" r="2.5" fill="#f87171" opacity="0.3" />
            <circle cx="10" cy="-10" r="2.5" fill="#f87171" opacity="0.3" />

            {/* Face Details - Reduced shift to 3 to prevent spilling off the chin */}
            <motion.g variants={sideToFrontVars(3, 0)}>
              {!isHappy && (
                <g fill="#111827">
                  <circle cx="-4.5" cy="-15" r="1.8" />
                  <circle cx="5.5" cy="-15" r="1.8" />
                  {/* Catchlights (Premium Eye Shines) */}
                  <circle cx="-5.2" cy="-15.5" r="0.6" fill="white" />
                  <circle cx="4.8" cy="-15.5" r="0.6" fill="white" />
                </g>
              )}
              {isHappy && (
                <g
                  stroke="#111827"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                >
                  <path d="M -7,-16 Q -4.5,-19 -2,-16" />
                  <path d="M 3,-16 Q 5.5,-19 8,-16" />
                </g>
              )}
              <path
                d="M 0.5,-11.5 Q 1.5,-10 0.5,-9"
                stroke="#deb896"
                strokeWidth="0.8"
                fill="none"
              />

              {/* Centered mouth so it doesn't float off the cheek when shifted! */}
              {!isHappy && (
                <path
                  d="M -3,-7 Q 0,-4 3,-7"
                  stroke="#c9785c"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
              {isHappy && (
                <path d="M -3,-6.5 Q 0.5,1 4,-6.5 Z" fill="#c9785c" />
              )}

              {/* Animated Golden Stars when Happy! */}
              {isHappy && (
                <motion.g
                  initial={{ scale: 0, rotate: -45, opacity: 0, x: 28, y: -25 }}
                  animate={{
                    scale: [0, 1.8, 1.4],
                    rotate: [0, 20, 0],
                    opacity: 1,
                    x: 28,
                    y: -25,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  style={{ transformOrigin: "14px -26px" }}
                >
                  {/* Main 5-Point Star */}
                  <path
                    d="M 14,-31 L 15.5,-27.5 L 19.5,-27 L 16.5,-24.5 L 17.5,-21 L 14,-22.5 L 10.5,-21 L 11.5,-24.5 L 8.5,-27 L 12.5,-27.5 Z"
                    fill="#fde047"
                  />
                  {/* Small Diamond Sparkle */}
                  <path
                    d="M 21,-34 Q 21,-31 24,-31 Q 21,-31 21,-28 Q 21,-31 18,-31 Q 21,-31 21,-34 Z"
                    fill="#fef08a"
                  />
                </motion.g>
              )}
            </motion.g>
          </motion.g>
        </g>

        {/* ======== FRONT LEG ======== */}
        <motion.g variants={sideToFrontVars(3, 6)}>
          <g transform="translate(0, 4)">
            <motion.path
              stroke="#1e293b"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              variants={buildLimbVars(
                fl_h_ra,
                fl_k_ra,
                fl_h_rb,
                fl_k_rb,
                fl_h_j,
                fl_k_j,
                fl_h_rj,
                fl_k_rj,
                fl_h_h,
                fl_k_h,
                L_THIGH,
                L_CALF
              )}
            />
            <motion.g
              variants={buildEndVars(
                fl_h_ra,
                fl_k_ra,
                fl_a_ra,
                fl_h_rb,
                fl_k_rb,
                fl_a_rb,
                fl_h_j,
                fl_k_j,
                fl_a_j,
                fl_h_rj,
                fl_k_rj,
                fl_a_rj,
                fl_h_h,
                fl_k_h,
                fl_a_h,
                L_THIGH,
                L_CALF
              )}
            >
              {renderShoe(isHappy)}
            </motion.g>
          </g>
        </motion.g>

        {/* ======== FRONT ARM ======== */}
        <motion.g variants={sideToFrontVars(4, 8)}>
          <g transform="translate(0, -23)">
            <motion.path
              style={{}}
              stroke="#fde8d0"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              variants={buildLimbVars(
                fa_s_ra,
                fa_e_ra,
                fa_s_rb,
                fa_e_rb,
                fa_s_j,
                fa_e_j,
                fa_s_rj,
                fa_e_rj,
                fa_s_h,
                fa_e_h,
                L_UPARM,
                L_FOREARM
              )}
            />
            <motion.g
              variants={buildEndVars(
                fa_s_ra,
                fa_e_ra,
                null,
                fa_s_rb,
                fa_e_rb,
                null,
                fa_s_j,
                fa_e_j,
                null,
                fa_s_rj,
                fa_e_rj,
                null,
                fa_s_h,
                fa_e_h,
                null,
                L_UPARM,
                L_FOREARM
              )}
            >
              <rect
                x="-4"
                y="-4"
                width="8"
                height="10"
                rx="3.5"
                fill="#fde8d0"
              />
            </motion.g>
          </g>
        </motion.g>
      </motion.svg>
    </motion.div>
  );
};
