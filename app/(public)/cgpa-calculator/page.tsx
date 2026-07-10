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
  const [radarTier, setRadarTier] = useState<string>("tier1");

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
    <main className="relative min-h-screen pt-28 pb-24 overflow-hidden bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-white to-slate-50 dark:bg-none dark:bg-[#020617]">
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

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200/50 bg-white/80 backdrop-blur-sm text-blue-700 text-[13px] font-bold tracking-wide dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 mb-6 shadow-sm"
          >
            <Calculator className="w-4 h-4" />
            <span className="uppercase tracking-widest">Academic Planning</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[40px] md:text-[56px] font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]"
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
            className="text-slate-600 dark:text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto"
          >
            Find out exactly how much SGPA you need to score in your remaining
            semesters to reach your graduation goal.
          </motion.p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-24 relative z-10">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-white/80 dark:border-white/[0.05] bg-blue-50/90 dark:bg-white/[0.02] backdrop-blur-3xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-10">
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
                    className="w-full pl-14 pr-4 py-3 sm:py-4 rounded-xl border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white font-black text-lg sm:text-xl focus:bg-white dark:focus:bg-black/40 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-sm hover:shadow-md"
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
                    className="w-full pl-14 pr-4 py-3 sm:py-4 rounded-xl border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white font-black text-lg sm:text-xl focus:bg-white dark:focus:bg-black/40 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-sm hover:shadow-md"
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
                    className="w-full pl-14 pr-4 py-3 sm:py-4 rounded-xl border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white font-black text-lg sm:text-xl focus:bg-white dark:focus:bg-black/40 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-sm hover:shadow-md placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
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
                    className="w-full pl-14 pr-4 py-3 sm:py-4 rounded-xl border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white font-black text-lg sm:text-xl focus:bg-white dark:focus:bg-black/40 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-sm hover:shadow-md placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-12 flex items-start gap-4 p-5 rounded-r-2xl rounded-l-md bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-500/10 dark:to-transparent border-y border-r border-slate-100 dark:border-white/[0.05] border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden">
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
            className="lg:col-span-2 flex flex-col relative"
          >
            {/* Absolute Glow behind the card */}
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none z-0" />
            <div className="flex-1 p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-white/80 dark:border-white/[0.05] bg-indigo-50/90 dark:bg-white/[0.05] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col justify-center relative overflow-hidden backdrop-blur-3xl z-10">
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
                      <div className="space-y-5">
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-2 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-[13px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
                          Goal Surpassed
                        </h3>
                        <div className="text-[72px] leading-none font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">
                          0.00
                        </div>
                        <p className="text-[15px] font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                          Your current performance is so strong that you will
                          achieve your target even if you score a{" "}
                          <strong className="text-slate-900 dark:text-white">
                            0.00 SGPA
                          </strong>{" "}
                          in your remaining semesters!
                        </p>
                      </div>
                    ) : result <= parseFloat(currentCgpa) ? (
                      <div className="space-y-5">
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-2 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-[13px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
                          Target Secured
                        </h3>
                        <div className="text-[72px] leading-none font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">
                          {result.toFixed(2)}
                        </div>
                        <p className="text-[15px] font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                          You are currently pacing ahead of your goal! Simply
                          maintain this baseline SGPA across your final{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {totalSemesters - currentSemester}
                          </strong>{" "}
                          semesters to secure your target.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6 w-full flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 mb-2">
                          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            Required Average SGPA
                          </h3>
                        </div>

                        <div className="relative">
                          <div className="text-[80px] md:text-[100px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tighter drop-shadow-sm pb-2">
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
            <div className="p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-white/80 dark:border-white/[0.05] bg-indigo-50/90 dark:bg-white/[0.02] backdrop-blur-3xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
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
                        onClick={() => setRadarTier(tier.id)}
                        className={`group flex items-center justify-between p-4 rounded-2xl border text-left transition-colors duration-200 ${
                          radarTier === tier.id
                            ? "bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                            : "bg-slate-50/50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/10 hover:border-slate-200 dark:hover:border-white/10"
                        }`}
                      >
                        <span
                          className={`font-semibold transition-colors ${
                            radarTier === tier.id
                              ? "text-indigo-700 dark:text-indigo-300"
                              : "text-slate-600 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200"
                          }`}
                        >
                          {tier.label}
                        </span>
                        <span
                          className={`text-[13px] font-bold px-3 py-1 rounded-full transition-colors ${
                            radarTier === tier.id
                              ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
                              : "bg-slate-200/60 dark:bg-white/10 text-slate-500 group-hover:bg-slate-300/50 group-hover:text-slate-700 dark:group-hover:bg-white/20 dark:group-hover:text-slate-200"
                          }`}
                        >
                          {tier.cutoff}+
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
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
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Enter your current CGPA above to see your eligibility
                          status.
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
            <div className="p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-white/80 dark:border-white/[0.05] bg-blue-50/90 dark:bg-white/[0.02] backdrop-blur-3xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pro-Tips for Higher SGPA
                </h3>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {[
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
                ].map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 shadow-sm transition-colors cursor-default"
                  >
                    <div className="shrink-0 p-2.5 rounded-xl bg-white dark:bg-white/10 border border-slate-100 dark:border-transparent shadow-sm h-fit">
                      <tip.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
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
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
