"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Target,
  Info,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  History,
  BarChart,
  TrendingUp,
  BookOpen,
  Lightbulb,
  Star,
  Briefcase,
  ShieldCheck,
} from "lucide-react";

export default function CgpaCalculatorPage() {
  const [totalSemesters, setTotalSemesters] = useState<number>(8);
  const [currentSemester, setCurrentSemester] = useState<number>(4);
  const [currentCgpa, setCurrentCgpa] = useState<string>("");
  const [targetCgpa, setTargetCgpa] = useState<string>("");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);

  // Radar State
  const [radarTier, setRadarTier] = useState<string | null>(null);

  const calculateRequiredSgpa = React.useCallback(() => {
    setError(null);
    setResult(null);
    setProgressValue(0);

    const current = parseFloat(currentCgpa);
    const target = parseFloat(targetCgpa);

    if (isNaN(current) || isNaN(target)) return;

    if (current < 0 || current > 10 || target < 0 || target > 10) {
      setError("CGPA must be between 0 and 10.");
      return;
    }

    if (currentSemester >= totalSemesters) {
      setError("You have already completed all semesters!");
      return;
    }

    const targetTotalPoints = target * totalSemesters;
    const currentTotalPoints = current * currentSemester;

    const remainingPointsNeeded = targetTotalPoints - currentTotalPoints;
    const remainingSemesters = totalSemesters - currentSemester;

    const requiredSgpa = remainingPointsNeeded / remainingSemesters;

    setResult(parseFloat(requiredSgpa.toFixed(2)));
    setProgressValue((current / target) * 100);
  }, [totalSemesters, currentSemester, currentCgpa, targetCgpa]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    calculateRequiredSgpa();
  }, [calculateRequiredSgpa]);

  return (
    <main className="relative min-h-[90vh] pt-12 md:pt-16 pb-12 overflow-hidden bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-white to-slate-50 dark:bg-none dark:bg-[#020617] flex flex-col justify-center">
      {/* Ultra-Premium Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {/* Orb 1: Top Left Blue */}
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, 60, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] h-[900px] w-[900px] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[160px] mix-blend-multiply dark:mix-blend-normal"
        />
        {/* Orb 2: Top Right Purple */}
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 80, 0], scale: [1, 1.05, 1] }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-[10%] -right-[20%] h-[800px] w-[800px] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[160px] mix-blend-multiply dark:mix-blend-normal"
        />
        {/* Orb 3: Bottom Center Indigo */}
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -100, 0], scale: [1, 1.2, 1] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          className="absolute -bottom-[20%] left-[15%] h-[1000px] w-[1000px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[160px] mix-blend-multiply dark:mix-blend-normal"
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 lg:px-8 w-full">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200/50 bg-white/80 backdrop-blur-sm text-blue-700 text-[12px] font-bold tracking-wide dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 mb-4 shadow-sm"
          >
            <Calculator className="w-4 h-4" />
            <span className="uppercase tracking-widest">Academic Planning</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[32px] md:text-[42px] font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 leading-[1.1]"
          >
            Target CGPA{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Calculator
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto"
          >
            Find out exactly how much SGPA you need to score in your remaining
            semesters to reach your graduation goal.
          </motion.p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6 mb-8 relative z-10">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border border-white/80 dark:border-white/[0.08] bg-blue-50/90 dark:bg-slate-900/50 dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-transparent backdrop-blur-3xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-transparent dark:ring-white/[0.05] relative overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-6">
              {/* Total Semesters */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[11px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  Total Semesters
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center group-focus-within:bg-blue-50 dark:group-focus-within:bg-blue-500/20 transition-colors">
                      <GraduationCap className="w-4 h-4 text-slate-500 dark:text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={totalSemesters}
                    onChange={(e) => setTotalSemesters(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-transparent bg-white dark:bg-slate-950/50 text-slate-900 dark:text-white font-black text-lg dark:ring-1 dark:ring-inset dark:ring-white/[0.06] focus:bg-white dark:focus:bg-slate-900/80 focus:border-blue-500 dark:focus:border-transparent focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 outline-none transition-all shadow-sm hover:shadow-md"
                  />
                </div>
              </div>

              {/* Current Semester */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[11px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  Completed Sems
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center group-focus-within:bg-blue-50 dark:group-focus-within:bg-blue-500/20 transition-colors">
                      <History className="w-4 h-4 text-slate-500 dark:text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-transparent bg-white dark:bg-slate-950/50 text-slate-900 dark:text-white font-black text-lg dark:ring-1 dark:ring-inset dark:ring-white/[0.06] focus:bg-white dark:focus:bg-slate-900/80 focus:border-blue-500 dark:focus:border-transparent focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 outline-none transition-all shadow-sm hover:shadow-md"
                  />
                </div>
              </div>

              {/* Current CGPA */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[11px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  Current CGPA
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center group-focus-within:bg-blue-50 dark:group-focus-within:bg-blue-500/20 transition-colors">
                      <BarChart className="w-4 h-4 text-slate-500 dark:text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    placeholder="0.00"
                    value={currentCgpa}
                    onChange={(e) => setCurrentCgpa(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-transparent bg-white dark:bg-slate-950/50 text-slate-900 dark:text-white font-black text-lg dark:ring-1 dark:ring-inset dark:ring-white/[0.06] focus:bg-white dark:focus:bg-slate-900/80 focus:border-blue-500 dark:focus:border-transparent focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 outline-none transition-all shadow-sm hover:shadow-md placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Target CGPA */}
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[11px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  Target CGPA
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center group-focus-within:bg-blue-50 dark:group-focus-within:bg-blue-500/20 transition-colors">
                      <Target className="w-4 h-4 text-slate-500 dark:text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    placeholder="0.00"
                    value={targetCgpa}
                    onChange={(e) => setTargetCgpa(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-transparent bg-white dark:bg-slate-950/50 text-slate-900 dark:text-white font-black text-lg dark:ring-1 dark:ring-inset dark:ring-white/[0.06] focus:bg-white dark:focus:bg-slate-900/80 focus:border-blue-500 dark:focus:border-transparent focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 outline-none transition-all shadow-sm hover:shadow-md placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 flex items-start gap-4 p-4 rounded-r-xl rounded-l-md bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-500/10 dark:to-transparent border-y border-r border-slate-100 dark:border-white/[0.05] border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
              <div className="p-2 bg-white dark:bg-white/[0.06] rounded-full shrink-0 shadow-sm border border-slate-100 dark:border-slate-700 relative z-10">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium pt-0.5 relative z-10">
                This calculator uses average arithmetic weighting across
                semesters. If your university uses significantly different total
                credits per semester, your required SGPA may vary slightly.
              </p>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 flex flex-col relative lg:h-full"
          >
            {/* Absolute Glow behind the card */}
            <div className="absolute inset-0 bg-blue-500/10 dark:bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none z-0" />
            <div className="flex-1 w-full min-h-[380px] lg:min-h-[420px] p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border border-white/80 dark:border-white/[0.04] bg-indigo-50/90 dark:bg-[#030712]/80 dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-transparent shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] ring-1 ring-inset ring-transparent dark:ring-white/[0.03] flex flex-col justify-center items-center relative overflow-hidden backdrop-blur-3xl z-10">
              <AnimatePresence mode="wait">
                {!currentCgpa || !targetCgpa ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center z-10 flex flex-col items-center justify-center h-full w-full py-10"
                  >
                    <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                      {/* Rotating Dashed Ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700 animate-[spin_10s_linear_infinite]" />

                      {/* Pulsing Core */}
                      <div className="absolute inset-4 bg-blue-50 dark:bg-blue-500/10 rounded-full animate-pulse" />

                      {/* Inner Icon Container */}
                      <div className="relative w-16 h-16 rounded-full bg-white dark:bg-white/[0.06] flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-lg">
                        <TrendingUp className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-white/80 dark:border-slate-700 mb-4">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        System Standby
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-3 tracking-tight">
                      Awaiting Calculation
                    </h3>

                    <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Please enter your{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        Current CGPA
                      </strong>{" "}
                      and{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        Target CGPA
                      </strong>{" "}
                      in the fields to generate your custom academic roadmap.
                    </p>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center z-10"
                  >
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6 border border-red-100 dark:border-red-500/20 shadow-sm">
                      <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <p className="text-base font-semibold text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </motion.div>
                ) : result !== null ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center z-10 w-full"
                  >
                    {result > 10 ? (
                      <div className="space-y-5">
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-2 border border-red-100 dark:border-red-500/20 shadow-sm">
                          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                          Mathematically Impossible!
                        </h3>
                        <p className="text-[15px] font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                          This target mathematically requires an SGPA of{" "}
                          <strong className="text-red-600 dark:text-red-400">
                            {result.toFixed(2)}
                          </strong>
                          , which exceeds the{" "}
                          <strong className="text-slate-900 dark:text-white">
                            10.0
                          </strong>{" "}
                          maximum threshold. We recommend setting a more
                          realistic academic milestone.
                        </p>
                      </div>
                    ) : result <= 0 ? (
                      <div className="space-y-6 flex flex-col items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                          <div className="relative w-24 h-24 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-400 dark:border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 drop-shadow-md" />
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                          <h3 className="text-[13px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                            Goal Surpassed
                          </h3>
                        </div>
                        <div className="text-[80px] md:text-[100px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-500 to-emerald-700 dark:from-emerald-300 dark:to-emerald-600 tracking-tighter drop-shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                          0.00
                        </div>
                        <p className="text-[16px] font-medium leading-relaxed text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                          Your current performance is so strong that you will
                          achieve your target even if you score a{" "}
                          <strong className="text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                            0.00 SGPA
                          </strong>{" "}
                          in your remaining semesters!
                        </p>
                      </div>
                    ) : result <= parseFloat(currentCgpa) ? (
                      <div className="space-y-6 flex flex-col items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                          <div className="relative w-24 h-24 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-400 dark:border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 drop-shadow-md" />
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                          <h3 className="text-[13px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                            Target Secured
                          </h3>
                        </div>
                        <div className="text-[80px] md:text-[100px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-500 to-emerald-700 dark:from-emerald-300 dark:to-emerald-600 tracking-tighter drop-shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                          {result.toFixed(2)}
                        </div>
                        <p className="text-[16px] font-medium leading-relaxed text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                          You are currently pacing ahead of your goal! Simply
                          maintain this baseline SGPA across your final{" "}
                          <strong className="text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                            {totalSemesters - currentSemester}
                          </strong>{" "}
                          semesters to secure your target.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6 w-full flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/10 mb-2">
                          <Target className="w-4 h-4 text-blue-600 dark:text-slate-300" />
                          <h3 className="text-[13px] font-bold uppercase tracking-widest text-blue-700 dark:text-slate-300">
                            Required Average SGPA
                          </h3>
                        </div>

                        <div className="relative">
                          <div className="text-[80px] md:text-[110px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-white/40 tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] pb-2">
                            {result.toFixed(2)}
                          </div>
                          {result > parseFloat(currentCgpa) && (
                            <div className="absolute -right-4 top-0 -translate-y-1/4 translate-x-full hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                +{(result - parseFloat(currentCgpa)).toFixed(2)}{" "}
                                jump
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Premium Progress Bar */}
                        <div className="w-full pt-6 pb-2">
                          <div className="flex justify-between items-end mb-3 px-1">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Current
                              </span>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 rounded-md border border-white/80 dark:border-white/5 shadow-sm">
                                {currentCgpa}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                Target
                              </span>
                              <span className="text-sm font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                {targetCgpa}
                              </span>
                            </div>
                          </div>
                          <div className="relative h-4 w-full bg-slate-100 dark:bg-white/[0.06]/80 rounded-full overflow-visible shadow-inner border border-white/80/50 dark:border-slate-700/50">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(progressValue, 100)}%`,
                              }}
                              transition={{
                                duration: 1.2,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              className="relative h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full"
                            >
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-900 border-4 border-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] z-10" />
                            </motion.div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                          <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 text-left">
                            Maintain this precise minimum SGPA across your
                            remaining{" "}
                            <strong className="text-slate-900 dark:text-white font-bold px-1 rounded bg-slate-200/50 dark:bg-white/10">
                              {totalSemesters - currentSemester}
                            </strong>{" "}
                            semesters to successfully unlock your target CGPA.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Decorative Result Glow */}
              {result !== null && result <= 10 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none z-0" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Academic Guide Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-12"
        >
          {/* Section Divider */}
          <div className="flex items-center justify-center gap-4 opacity-50">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-slate-400 dark:to-white/30" />
            <Star className="w-4 h-4 text-slate-400 dark:text-white/50" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-slate-400 dark:to-white/30" />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
              Your Academic Blueprint
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Understand your grades and discover actionable ways to boost your
              SGPA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Placement Eligibility Radar */}
            <div className="p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-white/80 dark:border-white/[0.08] bg-indigo-50/90 dark:bg-slate-900/50 dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-transparent backdrop-blur-3xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-transparent dark:ring-white/[0.05] relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Placement Radar
                </h3>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-[13px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400">
                    Target Career Path
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        id: "tier1",
                        label: "Tier-1 Product (Google, Microsoft)",
                        cutoff: 8.0,
                      },
                      {
                        id: "core",
                        label: "Core Engineering & PSUs",
                        cutoff: 7.5,
                      },
                      {
                        id: "tier2",
                        label: "Tier-2 Tech & Consulting",
                        cutoff: 7.0,
                      },
                      {
                        id: "mass",
                        label: "Mass Recruiters (TCS, Infosys)",
                        cutoff: 6.0,
                      },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() =>
                          setRadarTier(radarTier === tier.id ? null : tier.id)
                        }
                        className={`group flex items-center justify-between p-4 rounded-2xl text-left transition-all duration-300 ${
                          radarTier === tier.id
                            ? "bg-indigo-50/50 dark:bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
                            : "bg-transparent hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                        }`}
                      >
                        <span
                          className={`font-semibold transition-colors ${
                            radarTier === tier.id
                              ? "text-indigo-700 dark:text-white"
                              : "text-slate-600 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-slate-300"
                          }`}
                        >
                          {tier.label}
                        </span>
                        <span
                          className={`text-[13px] font-bold px-3 py-1 rounded-full transition-colors ${
                            radarTier === tier.id
                              ? "bg-indigo-600 text-white shadow-sm dark:bg-white dark:text-slate-900"
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-transparent dark:text-slate-500 group-hover:dark:text-slate-400"
                          }`}
                        >
                          {tier.cutoff}+
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  if (!radarTier) {
                    return (
                      <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Select a career path above to unlock tailored insights
                          and view your eligibility status.
                        </p>
                      </div>
                    );
                  }

                  const cutoffs: Record<string, number> = {
                    tier1: 8.0,
                    core: 7.5,
                    tier2: 7.0,
                    mass: 6.0,
                  };
                  const required = cutoffs[radarTier];
                  const current = parseFloat(currentCgpa);

                  if (!currentCgpa || isNaN(current)) {
                    return (
                      <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Enter your current CGPA above to see your eligibility
                          status for this path.
                        </p>
                      </div>
                    );
                  }

                  if (current >= required) {
                    return (
                      <div className="flex gap-4 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                            Safe Zone
                          </h4>
                          <p className="text-[13px] text-emerald-700 dark:text-emerald-400/80 leading-relaxed font-medium">
                            Your CGPA comfortably meets the standard{" "}
                            {required.toFixed(1)} cutoff for this tier. Focus
                            heavily on DSA and interview prep!
                          </p>
                        </div>
                      </div>
                    );
                  } else if (current >= required - 0.5) {
                    return (
                      <div className="flex gap-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                        <AlertTriangle className="w-6 h-6 text-amber-500 dark:text-amber-400 shrink-0" />
                        <div>
                          <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-1">
                            Borderline
                          </h4>
                          <p className="text-[13px] text-amber-700 dark:text-amber-400/80 leading-relaxed font-medium">
                            You are very close to the {required.toFixed(1)}{" "}
                            cutoff. Pushing your CGPA up slightly in remaining
                            semesters will safely unlock this tier.
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
                        <div>
                          <h4 className="font-bold text-red-800 dark:text-red-300 mb-1">
                            Action Required
                          </h4>
                          <p className="text-[13px] text-red-700 dark:text-red-400/80 leading-relaxed font-medium">
                            You are currently falling short of the{" "}
                            {required.toFixed(1)} cutoff. Don&apos;t panic! Set{" "}
                            <strong className="text-red-800 dark:text-red-300">
                              {required.toFixed(1)}
                            </strong>{" "}
                            as your Target CGPA above to calculate the exact
                            comeback strategy you need in your remaining
                            semesters.
                          </p>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* Pro-Tips for Boosting SGPA */}
            <div className="p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-white/80 dark:border-white/[0.08] bg-blue-50/90 dark:bg-slate-900/50 dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-transparent backdrop-blur-3xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-transparent dark:ring-white/[0.05] relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-all">
                  {radarTier
                    ? "Premium Career Insights"
                    : "Pro-Tips for Higher SGPA"}
                </h3>
              </div>

              <div className="relative">
                {(() => {
                  const defaultTips = [
                    {
                      title: "Master High-Credit Subjects",
                      desc: "Subjects with 4 or 5 credits impact your SGPA exponentially more than 1-credit labs.",
                      icon: BarChart,
                    },
                    {
                      title: "Analyze Previous Year Questions",
                      desc: "Professors frequently repeat patterns. Mastering PYQs is the fastest way to score marks.",
                      icon: History,
                    },
                    {
                      title: "Utilize the Hyper AI Tutor",
                      desc: "Stuck on a concept? Use our AI tutor to instantly get syllabus-mapped explanations.",
                      icon: BookOpen,
                    },
                  ];

                  const tierTips: Record<
                    string,
                    { title: string; desc: string; icon: any }[]
                  > = {
                    tier1: [
                      {
                        title: "Advanced DSA & Problem Solving",
                        desc: "Top product companies test heavily on data structures. Master Leetcode Medium/Hard and participate in contests.",
                        icon: BookOpen,
                      },
                      {
                        title: "Impactful Open Source Contributions",
                        desc: "Build a strong GitHub profile. Contributing to real-world open source projects sets you apart from the crowd.",
                        icon: Star,
                      },
                      {
                        title: "System Design Fundamentals",
                        desc: "Learn how large-scale systems work. Understanding scalability and databases is crucial for top-tier roles.",
                        icon: Lightbulb,
                      },
                    ],
                    core: [
                      {
                        title: "GATE & ESE Preparation",
                        desc: "Start preparing for competitive exams early. A high GATE score opens doors to top PSUs and core companies.",
                        icon: Target,
                      },
                      {
                        title: "Core Subject Mastery",
                        desc: "Focus intensely on fundamental subjects like Thermodynamics, Fluid Mechanics, or Power Systems.",
                        icon: BookOpen,
                      },
                      {
                        title: "Industrial Internships",
                        desc: "Practical experience is vital. Secure internships at manufacturing plants or core research labs.",
                        icon: Briefcase,
                      },
                    ],
                    tier2: [
                      {
                        title: "Full Stack Development",
                        desc: "Build end-to-end projects. Frameworks like React, Node.js, and Spring Boot are highly sought after.",
                        icon: Lightbulb,
                      },
                      {
                        title: "Aptitude & Soft Skills",
                        desc: "Many companies have rigorous aptitude rounds. Regular practice of quantitative and logical reasoning is essential.",
                        icon: Target,
                      },
                      {
                        title: "Hackathon Participation",
                        desc: "Winning or participating in hackathons demonstrates your ability to build under pressure.",
                        icon: Star,
                      },
                    ],
                    mass: [
                      {
                        title: "Quantitative Aptitude",
                        desc: "The first elimination round is almost always an aptitude test. Practice quantitative reasoning daily.",
                        icon: Calculator,
                      },
                      {
                        title: "Basic Coding & CS Fundamentals",
                        desc: "Ensure you are very comfortable with OOPS, DBMS, and basic coding in at least one language (Java/C++).",
                        icon: BookOpen,
                      },
                      {
                        title: "Communication & Interview Skills",
                        desc: "Strong verbal and written English can significantly improve your chances during HR and technical interviews.",
                        icon: Info,
                      },
                    ],
                  };

                  const activeTips =
                    radarTier && tierTips[radarTier]
                      ? tierTips[radarTier]
                      : defaultTips;

                  return (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={radarTier || "default"}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3 sm:space-y-4"
                      >
                        {activeTips.map((tip, idx) => (
                          <div
                            key={idx}
                            className="flex gap-4 p-4 rounded-2xl bg-transparent hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all cursor-default group"
                          >
                            <div className="shrink-0 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 group-hover:dark:text-white transition-colors h-fit">
                              <tip.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                                {tip.title}
                              </h4>
                              <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                {tip.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  );
                })()}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
