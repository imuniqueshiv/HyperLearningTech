"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  FileText,
  Sparkles,
  GraduationCap,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  Target,
} from "lucide-react";

// ─── Local data model ─────────────────────────────────────────────────────────

interface TopicState {
  id: string;
  unit: string;
  unitLabel: string;
  topic: string;
  notes: string[];
  pyqA: { label: string; ref: string };
  pyqB: { label: string; ref: string };
  aiTitle: string;
  aiBody: string[];
  aiSource: string;
}

const TOPICS: TopicState[] = [
  {
    id: "intro",
    unit: "Unit 1",
    unitLabel: "Introduction",
    topic: "Introduction to Algorithms",
    notes: [
      "Algorithm definition and properties",
      "Problem solving strategies",
      "Flowcharts and pseudocode",
      "Algorithm correctness",
    ],
    pyqA: { label: "June 2025 • Q1(a)", ref: "jun25-q1a" },
    pyqB: { label: "Dec 2024 • Q2(b)", ref: "dec24-q2b" },
    aiTitle: "What is an Algorithm?",
    aiBody: [
      "An algorithm is a finite, well-defined sequence of steps that solves a problem or computes a function in a bounded amount of time.",
      "A good algorithm is correct, efficient, and unambiguous—producing the right output for every valid input.",
    ],
    aiSource: "RGPV PYQ • Jun 2025 Q1(a)",
  },
  {
    id: "asymptotic",
    unit: "Unit 2",
    unitLabel: "Algorithms",
    topic: "Asymptotic Analysis",
    notes: [
      "Time and space complexity",
      "Big O, Θ and Ω notations",
      "Best, average and worst case",
      "Common complexity classes",
    ],
    pyqA: { label: "June 2025 • Q1(b)", ref: "jun25-q1b" },
    pyqB: { label: "Dec 2024 • Q3(a)", ref: "dec24-q3a" },
    aiTitle: "Big O notation",
    aiBody: [
      "Big O notation represents the upper bound on the growth rate of an algorithm's running time as input size increases.",
      "For example, a linear search has O(n) complexity because each element may need to be checked once.",
    ],
    aiSource: "RGPV PYQ • Jun 2025 Q1(b)",
  },
  {
    id: "ds",
    unit: "Unit 3",
    unitLabel: "Data Structures",
    topic: "Fundamental Data Structures",
    notes: [
      "Arrays, stacks, and queues",
      "Linked lists (singly and doubly)",
      "Trees and binary search trees",
      "Hash tables and collision handling",
    ],
    pyqA: { label: "Dec 2024 • Q4(a)", ref: "dec24-q4a" },
    pyqB: { label: "June 2024 • Q2(a)", ref: "jun24-q2a" },
    aiTitle: "Binary Search Tree",
    aiBody: [
      "A BST is a binary tree where each node's left subtree has values less than the node, and the right subtree has greater values.",
      "Search, insert, and delete each take O(h) time — O(log n) on average for a balanced tree.",
    ],
    aiSource: "RGPV PYQ • Dec 2024 Q4(a)",
  },
  {
    id: "os",
    unit: "Unit 4",
    unitLabel: "Operating Systems",
    topic: "Process Management",
    notes: [
      "Process states and PCB",
      "Context switching",
      "CPU scheduling algorithms",
      "Inter-process communication",
    ],
    pyqA: { label: "June 2025 • Q5(a)", ref: "jun25-q5a" },
    pyqB: { label: "Dec 2024 • Q5(b)", ref: "dec24-q5b" },
    aiTitle: "What is a Process?",
    aiBody: [
      "A process is a program in execution, with its own address space, registers, and a process control block that the OS uses to track it.",
      "The scheduler moves processes between ready, running, and waiting states to keep the CPU busy.",
    ],
    aiSource: "RGPV PYQ • Jun 2025 Q5(a)",
  },
];

const CYCLE_MS = 9000;

// Design-space size of the right-hand panel stage. All panel positions and
// connector coordinates below are authored in this 720 × 640 space, then the
// whole stage is scaled to fit its column so lines always stay attached.
const STAGE_W = 720;
const STAGE_H = 640;

// Subtle, front-facing tilt (small angles keep text readable).
const TILT = {
  syllabus: "perspective(1800px) rotateX(3deg) rotateY(5deg) rotateZ(-2deg)",
  notes: "perspective(1800px) rotateX(3deg) rotateY(-4deg) rotateZ(-1.5deg)",
  pyq: "perspective(1800px) rotateX(-2deg) rotateY(5deg) rotateZ(-1.5deg)",
  ai: "perspective(1800px) rotateX(-2deg) rotateY(-4deg) rotateZ(-1deg)",
  pill: "perspective(1800px) rotateX(2deg) rotateY(-3deg) rotateZ(-4deg)",
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useStageScale(designWidth: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1.2, entry.contentRect.width / designWidth));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);

  return [ref, scale] as const;
}

// ─── Feature chip ─────────────────────────────────────────────────────────────

function FeatureChip({
  icon,
  label,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
}) {
  return (
    <div
      className={`inline-flex shrink-0 items-center gap-1 sm:gap-2 rounded-[7px] sm:rounded-[10px] border px-2 py-1 min-[370px]:px-2.5 min-[370px]:py-1.5 sm:px-3.5 sm:py-2 text-[10px] min-[370px]:text-[10.5px] min-[390px]:text-[11px] sm:text-[13px] font-[500] backdrop-blur-sm select-none whitespace-nowrap ${colorClass}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

// ─── Glass panel ──────────────────────────────────────────────────────────────

function GlassPanel({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[16px] border border-indigo-200/70 bg-white/90 backdrop-blur-md dark:border-[rgba(99,130,255,0.26)] dark:bg-[rgba(9,16,46,0.8)] ${
        glow
          ? "shadow-[0_10px_40px_rgba(79,102,255,0.1),0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_32px_rgba(79,102,255,0.14),0_10px_40px_rgba(0,0,0,0.5)]"
          : "shadow-[0_10px_40px_rgba(15,23,42,0.08)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_40px_rgba(0,0,0,0.45)]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Syllabus panel ───────────────────────────────────────────────────────────

function SyllabusPanel({
  activeIdx,
  onSelect,
}: {
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen
            className="h-5 w-5 text-indigo-600 dark:text-[#8aa4ff]"
            strokeWidth={1.8}
          />
          <span className="text-[15px] font-[600] text-slate-900 dark:text-white">
            Syllabus
          </span>
        </div>
        <span className="text-[11px] font-[500] text-indigo-600 opacity-90 dark:text-[#8aa4ff]">
          RGPV • CSE • B.Tech
        </span>
      </div>

      <div className="relative space-y-1">
        {/* vertical timeline line */}
        <div
          aria-hidden="true"
          className="absolute bottom-4 left-[22px] top-4 w-px bg-indigo-300/60 dark:bg-[rgba(99,130,255,0.35)]"
        />
        {TOPICS.map((t, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(i)}
              aria-pressed={isActive}
              className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-all duration-300 ${
                isActive
                  ? "border-indigo-300 bg-indigo-50 shadow-[0_0_18px_rgba(79,102,255,0.12)] dark:border-[rgba(99,130,255,0.45)] dark:bg-[rgba(79,102,255,0.3)] dark:shadow-[0_0_18px_rgba(79,102,255,0.22)]"
                  : "border-transparent hover:bg-slate-50 dark:hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <div
                className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  isActive
                    ? "border-indigo-500 bg-indigo-500 dark:border-[#8aa4ff] dark:bg-[rgba(79,102,255,0.55)]"
                    : "border-indigo-300 bg-white dark:border-[rgba(138,164,255,0.45)] dark:bg-[#0a1236]"
                }`}
              >
                {isActive && (
                  <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-5">
                <span
                  className={`w-[44px] shrink-0 text-[12px] font-[500] transition-colors ${
                    isActive
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-[rgba(255,255,255,0.5)]"
                  }`}
                >
                  {t.unit}
                </span>
                <span
                  className={`truncate text-[14px] font-[500] leading-tight transition-colors ${
                    isActive
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-[rgba(255,255,255,0.58)]"
                  }`}
                >
                  {t.unitLabel}
                </span>
              </div>
              {isActive && (
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-900 dark:text-white" />
              )}
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ─── Notes panel ─────────────────────────────────────────────────────────────

function NotesPanel({ topic }: { topic: TopicState }) {
  return (
    <GlassPanel className="p-5" glow>
      <div className="mb-3 flex items-center gap-2.5">
        <FileText
          className="h-5 w-5 text-blue-500 dark:text-[#60a5fa]"
          strokeWidth={1.8}
        />
        <span className="text-[12px] font-[500] text-slate-500 dark:text-[#cbd5e1]">
          Topic Notes
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={topic.id + "-notes"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <h3 className="mb-3 text-[19px] font-[700] leading-tight text-slate-900 dark:text-white">
            {topic.topic}
          </h3>
          <ul className="space-y-2">
            {topic.notes.map((note) => (
              <li
                key={note}
                className="flex items-center gap-3 text-[13.5px] text-slate-600 dark:text-[#d5ddec]"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#3b82f6] shadow-[0_0_6px_rgba(59,130,246,0.7)]" />
                {note}
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
    </GlassPanel>
  );
}

// ─── PYQ panel ───────────────────────────────────────────────────────────────

function PYQPanel({
  topic,
  highlightA,
}: {
  topic: TopicState;
  highlightA: boolean;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FileText
            className="h-5 w-5 text-blue-500 dark:text-[#60a5fa]"
            strokeWidth={1.8}
          />
          <span className="text-[14px] font-[600] text-slate-900 dark:text-white">
            Previous Year Questions
          </span>
        </div>
        <span className="text-[11px] font-[500] text-indigo-600 dark:text-[#8aa4ff]">
          RGPV
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={topic.id + "-pyq"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          {[
            { q: topic.pyqA, hi: highlightA },
            { q: topic.pyqB, hi: !highlightA },
          ].map(({ q, hi }, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-[10px] border px-3 py-2.5 transition-all duration-500 ${
                hi
                  ? "border-indigo-300 bg-indigo-50 dark:border-[rgba(99,130,255,0.4)] dark:bg-[rgba(79,102,255,0.22)]"
                  : "border-indigo-100 bg-indigo-50/50 dark:border-[rgba(99,130,255,0.2)] dark:bg-[rgba(79,102,255,0.08)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText
                  className="h-5 w-5 shrink-0 text-blue-500 dark:text-[#60a5fa]"
                  strokeWidth={1.8}
                />
                <span className="text-[14px] font-[500] text-slate-900 dark:text-white">
                  {q.label}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[rgba(255,255,255,0.6)]" />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </GlassPanel>
  );
}

// ─── AI answer panel ──────────────────────────────────────────────────────────

function AIPanel({ topic }: { topic: TopicState }) {
  return (
    <GlassPanel className="p-5" glow>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sparkles
            className="h-5 w-5 text-indigo-500 dark:text-[#a5b4fc]"
            strokeWidth={1.8}
          />
          <span className="text-[13px] font-[600] text-slate-700 dark:text-[#e2e8f0]">
            AI Answer
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/70 bg-emerald-50 px-2.5 py-1 text-[11px] font-[500] text-emerald-700 dark:border-[rgba(52,211,153,0.45)] dark:bg-[rgba(16,185,129,0.12)] dark:text-[#6ee7b7]">
          <CheckCircle2 className="h-3 w-3" />
          RGPV Focused
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={topic.id + "-ai"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h3 className="mb-2.5 text-[19px] font-[700] leading-tight text-slate-900 dark:text-white">
            {topic.aiTitle}
          </h3>
          {topic.aiBody.map((para, i) => (
            <p
              key={i}
              className="mb-2.5 text-[13.5px] leading-[1.6] text-slate-600 dark:text-[#cbd5e1] last:mb-0"
            >
              {para}
            </p>
          ))}
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-400 dark:text-[rgba(255,255,255,0.45)]" />
              <span className="text-[12px] font-[500] text-slate-500 dark:text-[rgba(255,255,255,0.55)]">
                Sources
              </span>
            </div>
            <span className="text-[11.5px] font-[500] text-indigo-600 dark:text-[#a5b4fc]">
              {topic.aiSource}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </GlassPanel>
  );
}

// ─── "One topic. Complete prep." pill ─────────────────────────────────────────

function PrepPill() {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white px-4 py-3 shadow-[0_8px_28px_rgba(79,102,255,0.14)] backdrop-blur-md dark:border-[rgba(99,130,255,0.5)] dark:from-[rgba(40,48,140,0.75)] dark:to-[rgba(20,28,90,0.8)] dark:shadow-[0_0_28px_rgba(91,94,244,0.35),0_8px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]">
      <Target
        className="h-5 w-5 shrink-0 text-indigo-600 dark:text-[#a5b4fc]"
        strokeWidth={1.8}
      />
      <span className="whitespace-nowrap text-[15px] font-[600] text-slate-900 dark:text-white">
        One topic. Complete prep.
      </span>
    </div>
  );
}

// ─── Background ───────────────────────────────────────────────────────────────

function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Light base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FCFCFE] via-[#F8FAFC] to-white dark:hidden" />
      {/* Dark base */}
      <div className="absolute inset-0 hidden bg-[#020817] dark:block" />

      {/* Light ambient glows */}
      <div className="pointer-events-none absolute inset-0 dark:hidden">
        <div className="absolute left-[-10%] top-[-14%] h-[820px] w-[820px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14)_0%,transparent_68%)]" />
        <div className="absolute right-[-12%] top-[-4%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12)_0%,rgba(129,140,248,0.06)_40%,transparent_70%)]" />
        <div className="absolute bottom-[-14%] left-1/2 h-[520px] w-[1500px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.1)_0%,rgba(99,102,241,0.05)_45%,transparent_72%)]" />
      </div>

      {/* Dark ambient glows */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div
          className="absolute"
          style={{
            top: "-14%",
            left: "-10%",
            width: 820,
            height: 820,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(30,58,138,0.42) 0%, transparent 68%)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "-4%",
            right: "-12%",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(67,56,202,0.28) 0%, rgba(37,60,170,0.12) 40%, transparent 70%)",
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: "-14%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 1500,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(59,90,240,0.26) 0%, rgba(59,70,229,0.1) 45%, transparent 72%)",
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: -520,
            left: "-25%",
            width: "150%",
            height: 640,
            borderRadius: "50%",
            border: "1px solid rgba(107,140,255,0.38)",
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(59,90,240,0.2) 0%, rgba(8,14,60,0.0) 60%)",
            boxShadow:
              "0 -2px 40px rgba(79,102,255,0.38), inset 0 2px 36px rgba(79,102,255,0.28)",
          }}
        />
      </div>

      {/* Perspective grid */}
      <svg
        className="absolute bottom-0 left-0 w-full opacity-[0.1] dark:opacity-[0.17]"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ pointerEvents: "none", height: "26%" }}
      >
        <defs>
          <linearGradient id="grid-fade-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {Array.from({ length: 17 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={720}
            y1={0}
            x2={(i / 16) * 1440}
            y2={300}
            stroke="url(#grid-fade-v)"
            strokeWidth="0.8"
          />
        ))}
        {Array.from({ length: 7 }).map((_, i) => {
          const frac = (i + 1) / 7;
          const y = frac * 300;
          const sp = frac * 720;
          return (
            <line
              key={`h${i}`}
              x1={720 - sp}
              y1={y}
              x2={720 + sp}
              y2={y}
              stroke="#3b82f6"
              strokeWidth="0.6"
              opacity={frac * 0.55}
            />
          );
        })}
      </svg>

      {/* Ambient particles */}
      {[
        { top: "15%", left: "22%", s: 2, d: "0s" },
        { top: "35%", left: "55%", s: 1.5, d: "1.2s" },
        { top: "62%", left: "38%", s: 2.5, d: "2.4s" },
        { top: "25%", left: "78%", s: 1.5, d: "0.8s" },
        { top: "70%", left: "65%", s: 2, d: "1.8s" },
        { top: "48%", left: "12%", s: 1.5, d: "3s" },
        { top: "86%", left: "27%", s: 3, d: "0.4s" },
        { top: "84%", left: "66%", s: 3, d: "2s" },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute animate-pulse rounded-full bg-indigo-400 opacity-30 dark:bg-[#6b8cff] dark:opacity-45"
          style={{
            top: p.top,
            left: p.left,
            width: p.s,
            height: p.s,
            animationDelay: p.d,
            animationDuration: "3s",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Hero() {
  // Default to idx=1 (Algorithms) to match the reference screenshot
  const [activeIdx, setActiveIdx] = useState(1);
  const [highlightA, setHighlightA] = useState(true);
  const [isManual, setIsManual] = useState(false);
  const prefersReduced = useReducedMotion();
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const manualRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stageRef, stageScale] = useStageScale(STAGE_W);

  const topic = TOPICS[activeIdx] ?? TOPICS[1];

  // Alternate PYQ row highlight every 3.5 s
  useEffect(() => {
    if (prefersReduced) return;
    const t = setInterval(() => setHighlightA((h) => !h), 3500);
    return () => clearInterval(t);
  }, [prefersReduced]);

  // Auto-cycle
  const startCycle = useCallback(() => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % TOPICS.length);
    }, CYCLE_MS);
  }, []);

  useEffect(() => {
    if (!prefersReduced) startCycle();
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [prefersReduced, startCycle]);

  // Pause on tab hidden
  useEffect(() => {
    if (prefersReduced) return;
    const onVis = () => {
      if (document.hidden) {
        if (cycleRef.current) clearInterval(cycleRef.current);
      } else if (!isManual) {
        startCycle();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [prefersReduced, isManual, startCycle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
      if (manualRef.current) clearTimeout(manualRef.current);
    };
  }, []);

  const handleSelect = (i: number) => {
    setActiveIdx(i);
    setIsManual(true);
    if (cycleRef.current) clearInterval(cycleRef.current);
    if (manualRef.current) clearTimeout(manualRef.current);
    manualRef.current = setTimeout(() => {
      setIsManual(false);
      startCycle();
    }, 20_000);
  };

  // Animation variants
  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.06 },
    },
  };
  const rise = {
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const floatA = !prefersReduced
    ? { animation: "hero-float-a 6s ease-in-out infinite" }
    : {};
  const floatB = !prefersReduced
    ? { animation: "hero-float-b 7s ease-in-out infinite 1.5s" }
    : {};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
        @keyframes hero-float-a {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes hero-float-b {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="hero-float"] { animation: none !important; }
        }
      `}</style>

      <section
        id="Home"
        className="relative flex w-full scroll-mt-20 items-center overflow-hidden bg-white dark:bg-[#020817]"
        style={{
          minHeight: "calc(100dvh - 64px)",
        }}
      >
        <span
          id="hero"
          className="absolute top-0 -mt-20 pointer-events-none"
          aria-hidden="true"
        />
        <HeroBackground />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 min-[390px]:px-5 pt-8 pb-14 sm:px-6 sm:pb-14 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-12">
          <div className="grid w-full min-w-0 max-w-full items-center gap-8 lg:grid-cols-[44%_56%] lg:gap-4">
            {/* ─── LEFT ─── */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="flex w-full min-w-0 max-w-full flex-col items-start font-sans lg:max-w-none"
            >
              {/* Eyebrow */}
              <motion.div variants={rise} className="mb-7 sm:mb-10 lg:mb-12">
                <div className="badge-shimmer inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/80 px-3.5 py-1.5 backdrop-blur-sm sm:gap-2.5 sm:px-4 sm:py-2 dark:border-[rgba(99,130,255,0.35)] dark:bg-[rgba(8,14,40,0.72)]">
                  <GraduationCap className="h-3.5 w-3.5 shrink-0 text-indigo-600 sm:h-4 sm:w-4 dark:text-[#8aa4ff]" />
                  <span className="text-[10.5px] font-[700] uppercase tracking-[0.07em] text-indigo-700 sm:text-[11.5px] dark:text-[#8aa4ff]">
                    RGPV Engineering • Built for Exams
                  </span>
                </div>
              </motion.div>

              {/* Headline — two controlled lines on desktop, fluid on mobile */}
              <motion.h1
                variants={rise}
                className="w-full min-w-0 text-[29px] font-[800] leading-[1.14] tracking-[-0.035em] min-[390px]:text-[32px] sm:text-[42px] sm:leading-[1.04] sm:tracking-[-0.045em] md:text-[48px] lg:text-[54px] xl:text-[60px]"
              >
                <span className="block text-slate-900 dark:text-white md:whitespace-nowrap">
                  Know what to study.
                </span>
                <span className="block md:whitespace-nowrap">
                  <span className="bg-gradient-to-r from-[#6c5cff] via-[#5b7bff] to-[#6f9bff] bg-clip-text text-transparent">
                    Learn how to answer
                  </span>
                  <span className="text-[#34d399]">.</span>
                </span>
              </motion.h1>

              {/* Tagline */}
              <motion.p
                variants={rise}
                className="mt-5 w-full min-w-0 font-['Caveat',cursive] text-[28px] font-normal leading-normal tracking-tight text-slate-700 min-[390px]:text-[30px] sm:mt-4 sm:text-[40px] dark:text-[#e2e8f0]"
              >
                From confusion to confidence.
              </motion.p>

              {/* Body */}
              <motion.p
                variants={rise}
                className="mt-5 w-full min-w-0 max-w-[560px] text-[14.5px] leading-[1.75] text-slate-600 sm:mt-3 sm:text-[16px] sm:leading-[1.8] md:text-[17px] dark:text-[#94a3b8]"
              >
                Everything you need for smarter exam preparation—from{" "}
                <span className="font-[600] text-slate-900 dark:font-[500] dark:text-[#cbd5e1]">
                  syllabus-mapped PYQs
                </span>{" "}
                and{" "}
                <span className="font-[600] text-slate-900 dark:font-[500] dark:text-[#cbd5e1]">
                  AI-powered notes
                </span>{" "}
                to topic-wise explanations and instant AI guidance.
              </motion.p>

              {/* CTAs — side by side in a single row on mobile with equal margins */}
              <motion.div
                variants={rise}
                className="mt-7 flex w-full min-w-0 max-w-full flex-row items-center gap-2 min-[380px]:gap-2.5 sm:mt-8 sm:w-auto sm:gap-3.5"
              >
                <Link
                  href="/rgpv"
                  className="group relative flex flex-1 min-w-0 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#5b5ef4] to-[#4f46e5] px-2.5 py-3.5 text-[11px] font-[600] text-white shadow-[0_4px_24px_rgba(91,94,244,0.4)] backdrop-blur-sm transition-[transform,opacity,box-shadow,background-color] duration-500 hover:-translate-y-[2px] hover:shadow-[0_6px_28px_rgba(91,94,244,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 active:scale-[0.98] transform-gpu min-[370px]:px-3 min-[370px]:text-[11.5px] min-[400px]:px-3.5 min-[400px]:text-[12.5px] sm:flex-initial sm:px-7 sm:py-4 sm:text-[15px]"
                >
                  <span className="relative z-10 flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap sm:gap-2.5">
                    <span className="truncate">RGPV Engineering Hub</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 sm:h-4 sm:w-4" />
                  </span>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/25 to-white/0 transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />
                </Link>

                <Link
                  href="/about"
                  className="group relative flex flex-1 min-w-0 items-center justify-center overflow-hidden rounded-[10px] border border-indigo-200 bg-white/80 px-2.5 py-3.5 text-[11px] font-[600] text-slate-700 backdrop-blur-sm transition-[transform,opacity,border-color,background-color] duration-500 hover:-translate-y-[2px] hover:border-indigo-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 active:scale-[0.98] transform-gpu min-[370px]:px-3 min-[370px]:text-[11.5px] min-[400px]:px-3.5 min-[400px]:text-[12.5px] sm:flex-initial sm:px-7 sm:py-4 sm:text-[15px] dark:border-[rgba(99,130,255,0.4)] dark:bg-[rgba(4,10,34,0.7)] dark:text-white dark:hover:border-[rgba(99,130,255,0.75)] dark:hover:bg-[rgba(4,10,34,0.9)]"
                >
                  <span className="relative z-10 flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap sm:gap-2">
                    <span className="truncate">Explore Platform</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
                  </span>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 transition-transform duration-700 ease-out group-hover:translate-x-full dark:via-[rgba(99,130,255,0.25)]"
                  />
                </Link>
              </motion.div>

              {/* Feature chips — single row on all screens */}
              <motion.div
                variants={rise}
                className="mt-8 flex w-full min-w-0 max-w-full flex-nowrap items-center gap-1.5 min-[370px]:gap-2 sm:mt-7 sm:w-auto sm:gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Platform features"
              >
                <FeatureChip
                  colorClass="border-emerald-200 text-slate-700 bg-white/80 dark:border-[rgba(52,211,153,0.3)] dark:text-[#e2e8f0] dark:bg-[rgba(8,24,40,0.6)]"
                  icon={
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-emerald-600 dark:text-[#34d399]" />
                  }
                  label="Syllabus mapped"
                />
                <FeatureChip
                  colorClass="border-sky-200 text-slate-700 bg-white/80 dark:border-[rgba(56,189,248,0.28)] dark:text-[#e2e8f0] dark:bg-[rgba(8,14,40,0.6)]"
                  icon={
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-sky-600 dark:text-[#38bdf8]" />
                  }
                  label="PYQs by topic"
                />
                <FeatureChip
                  colorClass="border-violet-200 text-slate-700 bg-white/80 dark:border-[rgba(167,139,250,0.3)] dark:text-[#e2e8f0] dark:bg-[rgba(8,14,40,0.6)]"
                  icon={
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-violet-600 dark:text-[#a78bfa]" />
                  }
                  label="AI study help"
                />
              </motion.div>
            </motion.div>

            {/* ─── RIGHT — desktop panel stage ─── */}
            <motion.div
              initial={{ opacity: 0, x: 36, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                duration: 1.1,
                delay: 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative hidden lg:block"
              aria-label="Interactive learning workflow preview"
            >
              {/* Scale wrapper: measures column width, scales fixed-size stage */}
              <div
                ref={stageRef}
                className="relative w-full"
                style={{ height: STAGE_H * stageScale }}
              >
                {/* Behind-panel glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-[-40px] top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.12)_0%,transparent_70%)] blur-[40px] dark:bg-[radial-gradient(circle,rgba(79,70,229,0.2)_0%,transparent_70%)]"
                />

                <div
                  className="absolute left-0 top-0"
                  style={{
                    width: STAGE_W,
                    height: STAGE_H,
                    transform: `scale(${stageScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  {/* Pill — top-right */}
                  <div
                    className="absolute"
                    style={{
                      top: 0,
                      right: 0,
                      width: 268,
                      zIndex: 30,
                      ...floatB,
                    }}
                  >
                    <div style={{ transform: TILT.pill }}>
                      <PrepPill />
                    </div>
                  </div>

                  {/* Syllabus — top-left */}
                  <div
                    className="absolute"
                    style={{
                      top: 52,
                      left: 0,
                      width: 318,
                      zIndex: 10,
                      ...floatA,
                    }}
                  >
                    <div style={{ transform: TILT.syllabus }}>
                      <SyllabusPanel
                        activeIdx={activeIdx}
                        onSelect={handleSelect}
                      />
                    </div>
                  </div>

                  {/* Notes — top-right */}
                  <div
                    className="absolute"
                    style={{
                      top: 84,
                      right: 0,
                      width: 318,
                      zIndex: 20,
                      ...floatB,
                    }}
                  >
                    <div style={{ transform: TILT.notes }}>
                      <NotesPanel topic={topic} />
                    </div>
                  </div>

                  {/* PYQ — bottom-left */}
                  <div
                    className="absolute"
                    style={{
                      top: 352,
                      left: -8,
                      width: 318,
                      zIndex: 10,
                      ...floatA,
                    }}
                  >
                    <div style={{ transform: TILT.pyq }}>
                      <PYQPanel topic={topic} highlightA={highlightA} />
                    </div>
                  </div>

                  {/* AI Answer — bottom-right */}
                  <div
                    className="absolute"
                    style={{
                      top: 336,
                      right: 0,
                      width: 340,
                      zIndex: 20,
                      ...floatB,
                    }}
                  >
                    <div style={{ transform: TILT.ai }}>
                      <AIPanel topic={topic} />
                    </div>
                  </div>

                  {/* SVG connector overlay (720 × 640 design space) */}
                  <svg
                    className="pointer-events-none absolute inset-0"
                    width={STAGE_W}
                    height={STAGE_H}
                    viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
                    aria-hidden="true"
                    overflow="visible"
                    style={{ zIndex: 25 }}
                  >
                    <defs>
                      <linearGradient
                        id="hero-conn-grad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6b8cff"
                          stopOpacity="0.95"
                        />
                        <stop
                          offset="100%"
                          stopColor="#a78bfa"
                          stopOpacity="0.95"
                        />
                      </linearGradient>
                      <filter
                        id="hero-glow"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                      >
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* 1. Syllabus header → pill */}
                    <path
                      d="M 316 128 C 342 126, 360 114, 362 92 C 364 56, 380 30, 430 28"
                      stroke="url(#hero-conn-grad)"
                      strokeWidth="1.5"
                      fill="none"
                      filter="url(#hero-glow)"
                      opacity="0.85"
                    />

                    {/* 2. Syllabus active row → PYQ header */}
                    <path
                      d="M 316 196 C 342 196, 354 206, 354 232 L 354 330 C 354 362, 336 384, 312 396"
                      stroke="url(#hero-conn-grad)"
                      strokeWidth="1.5"
                      fill="none"
                      filter="url(#hero-glow)"
                      opacity="0.85"
                    />

                    {/* 3. PYQ row 2 → AI answer */}
                    <path
                      d="M 310 484 C 332 484, 346 490, 346 510 L 346 548 C 346 566, 352 574, 366 574"
                      stroke="url(#hero-conn-grad)"
                      strokeWidth="1.5"
                      fill="none"
                      filter="url(#hero-glow)"
                      opacity="0.85"
                    />

                    {/* 4. Notes → AI answer (short vertical) */}
                    <path
                      d="M 520 322 L 520 342"
                      stroke="url(#hero-conn-grad)"
                      strokeWidth="1.5"
                      fill="none"
                      filter="url(#hero-glow)"
                      opacity="0.85"
                    />

                    {/* Moving pulse dots */}
                    {!prefersReduced && (
                      <>
                        <circle
                          r="3"
                          fill="#6b8cff"
                          filter="url(#hero-glow)"
                          opacity="0.95"
                        >
                          <animateMotion
                            dur="2.6s"
                            repeatCount="indefinite"
                            path="M 316 128 C 342 126, 360 114, 362 92 C 364 56, 380 30, 430 28"
                          />
                        </circle>
                        <circle
                          r="3"
                          fill="#a78bfa"
                          filter="url(#hero-glow)"
                          opacity="0.95"
                        >
                          <animateMotion
                            dur="3s"
                            repeatCount="indefinite"
                            begin="1s"
                            path="M 316 196 C 342 196, 354 206, 354 232 L 354 330 C 354 362, 336 384, 312 396"
                          />
                        </circle>
                        <circle
                          r="3"
                          fill="#a78bfa"
                          filter="url(#hero-glow)"
                          opacity="0.95"
                        >
                          <animateMotion
                            dur="2.4s"
                            repeatCount="indefinite"
                            begin="0.5s"
                            path="M 310 484 C 332 484, 346 490, 346 510 L 346 548 C 346 566, 352 574, 366 574"
                          />
                        </circle>
                      </>
                    )}

                    {/* Node dots */}
                    {[
                      { x: 362, y: 92, c: "107,140,255", s: "#6b8cff" },
                      { x: 430, y: 28, c: "107,140,255", s: "#6b8cff" },
                      { x: 316, y: 196, c: "107,140,255", s: "#6b8cff" },
                      { x: 312, y: 396, c: "167,139,250", s: "#a78bfa" },
                      { x: 310, y: 484, c: "167,139,250", s: "#a78bfa" },
                      { x: 366, y: 574, c: "167,139,250", s: "#a78bfa" },
                      { x: 520, y: 322, c: "167,139,250", s: "#a78bfa" },
                      { x: 520, y: 342, c: "167,139,250", s: "#a78bfa" },
                    ].map((d, i) => (
                      <circle
                        key={i}
                        cx={d.x}
                        cy={d.y}
                        r="4"
                        fill={`rgba(${d.c},0.45)`}
                        stroke={d.s}
                        strokeWidth="1.5"
                        filter="url(#hero-glow)"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
