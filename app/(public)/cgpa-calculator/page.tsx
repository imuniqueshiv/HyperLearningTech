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
  Compass,
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
    <main className="relative min-h-screen pt-24 pb-20 overflow-hidden bg-slate-50/80 dark:bg-[#040814]">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 w-full h-[600px] bg-gradient-to-b from-[#E2E8F0]/30 to-transparent dark:from-[#0B132B] dark:to-transparent" />
        <div className="absolute top-20 left-[15%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-40 right-[15%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-20">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-3 p-8 md:p-10 rounded-[32px] border border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#0B1528]/60 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Total Semesters */}
              <div className="space-y-3">
                <label className="text-[13px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400">
                  Total Semesters
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="number"
                    value={totalSemesters}
                    onChange={(e) => setTotalSemesters(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 hover:bg-slate-50 dark:bg-black/20 dark:hover:bg-white/[0.02] text-slate-900 dark:text-white font-semibold text-lg focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Current Semester */}
              <div className="space-y-3">
                <label className="text-[13px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400">
                  Completed Sems
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <History className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="number"
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 hover:bg-slate-50 dark:bg-black/20 dark:hover:bg-white/[0.02] text-slate-900 dark:text-white font-semibold text-lg focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Current CGPA */}
              <div className="space-y-3">
                <label className="text-[13px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400">
                  Current CGPA
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BarChart className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 7.5"
                    value={currentCgpa}
                    onChange={(e) => setCurrentCgpa(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 hover:bg-slate-50 dark:bg-black/20 dark:hover:bg-white/[0.02] text-slate-900 dark:text-white font-semibold text-lg focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Target CGPA */}
              <div className="space-y-3">
                <label className="text-[13px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  Target CGPA
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Target className="w-5 h-5 text-indigo-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 8.5"
                    value={targetCgpa}
                    onChange={(e) => setTargetCgpa(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 hover:bg-indigo-50 dark:bg-indigo-500/5 dark:hover:bg-indigo-500/10 text-slate-900 dark:text-white font-semibold text-lg focus:bg-white dark:focus:bg-indigo-500/10 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-start gap-4 p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
              <div className="p-2 bg-slate-200/60 dark:bg-white/10 rounded-full shrink-0">
                <Info className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
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
            className="lg:col-span-2 flex flex-col"
          >
            <div className="flex-1 p-8 md:p-10 rounded-[32px] border border-slate-200/60 dark:border-white/10 bg-gradient-to-b from-blue-50/40 to-white dark:from-[#0D1B36] dark:to-[#0B1528] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-center relative overflow-hidden backdrop-blur-2xl">
              <AnimatePresence mode="wait">
                {!currentCgpa || !targetCgpa ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center z-10"
                  >
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-500/10 rounded-full animate-ping opacity-50" />
                      <div className="relative w-full h-full rounded-full bg-white dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-sm">
                        <TrendingUp className="w-10 h-10 text-slate-300 dark:text-white/20" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                      Awaiting Inputs
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Enter your current and target CGPA to reveal your custom
                      academic roadmap.
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
                      <div className="space-y-5 w-full">
                        <h3 className="text-[13px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                          Required Average SGPA
                        </h3>
                        <div className="text-[72px] leading-none font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">
                          {result.toFixed(2)}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full pt-4 pb-2">
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                            <span>Current: {currentCgpa}</span>
                            <span className="text-indigo-600 dark:text-indigo-400">
                              Target: {targetCgpa}
                            </span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(progressValue, 100)}%`,
                              }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            />
                          </div>
                        </div>

                        <p className="text-[15px] font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                          Maintain this precise minimum SGPA across your
                          remaining{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {totalSemesters - currentSemester}
                          </strong>{" "}
                          semesters to successfully unlock your target CGPA.
                        </p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Placement Eligibility Radar */}
            <div className="p-8 rounded-[32px] border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/[0.02] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Compass className="w-32 h-32" />
              </div>

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
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                          radarTier === tier.id
                            ? "bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                            : "bg-slate-50/50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10"
                        }`}
                      >
                        <span
                          className={`font-semibold ${radarTier === tier.id ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          {tier.label}
                        </span>
                        <span
                          className={`text-[13px] font-bold px-2.5 py-1 rounded-md ${radarTier === tier.id ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" : "bg-slate-200/50 dark:bg-white/10 text-slate-600 dark:text-slate-400"}`}
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
                      <div className="flex gap-4 p-5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
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
            <div className="p-8 rounded-[32px] border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/[0.02] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pro-Tips for Higher SGPA
                </h3>
              </div>

              <div className="space-y-4">
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
