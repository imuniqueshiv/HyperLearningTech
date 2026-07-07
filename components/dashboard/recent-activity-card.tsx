import Link from "next/link";
import { BookOpen, FileText, Clock, ChevronRight } from "lucide-react";

interface RecentActivityCardProps {
  title: string;
  subtitle: string;
  href: string;
  timeAgo: string;
  progressText: string;
  statusColor?: string; // Kept for backwards compatibility
  type: "book" | "file";
  progressValue: number;
  theme?: "cyan" | "orange";
}

export function RecentActivityCard({
  title,
  subtitle,
  href,
  timeAgo,
  progressText,
  type,
  progressValue,
  theme = "cyan",
}: RecentActivityCardProps) {
  const Icon = type === "book" ? BookOpen : FileText;

  // Determine dynamic colors based on theme
  const isCyan = theme === "cyan";
  const glowBorderClass = isCyan
    ? "group-hover:border-cyan-500/30"
    : "group-hover:border-orange-500/30";
  const iconBgClass = isCyan
    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    : "bg-orange-500/10 text-orange-400 border-orange-500/20";
  const trackBgClass = "bg-zinc-800/50";
  const barBgClass = isCyan
    ? "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.56)]"
    : "bg-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.56)]";
  const dotClass = isCyan
    ? "bg-white shadow-[0_0_10px_rgba(34,211,238,1)]"
    : "bg-white shadow-[0_0_10px_rgba(251,146,60,1)]";
  const statusDotClass = isCyan ? "bg-cyan-400" : "bg-orange-400";

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(149,157,165,0.15)] hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(96,165,250,0.2)] hover:-translate-y-1 transition-all duration-300 dark:bg-slate-900/60 dark:border-blue-400/15 dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] dark:hover:border-blue-400/30 focus-visible:outline-none focus-visible:ring-2 flex-1 h-full"
    >
      <div className="relative z-10 flex flex-col gap-5">
        {/* Header Row */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] border border-zinc-200 bg-zinc-50 dark:border-white/[0.08] dark:bg-[#0c1017] dark:shadow-inner transition-colors ${isCyan ? "text-cyan-600 dark:text-cyan-400" : "text-orange-600 dark:text-orange-400"}`}
            >
              <Icon
                className="h-5 w-5 dark:drop-shadow-[0_0_8px_currentColor]"
                strokeWidth={2}
              />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="font-bold text-[15px] tracking-tight text-zinc-900 dark:text-white leading-snug">
                {title}
              </h3>
              <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 rounded-md border border-zinc-200/60 bg-zinc-50 dark:border-white/5 dark:bg-[#1b2234] px-2 py-0.5 text-[10.5px] font-medium text-zinc-600 dark:text-zinc-300">
              <Clock className="h-3 w-3 text-zinc-400" />
              <span>{timeAgo}</span>
            </div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 pr-0.5">
              {progressValue}% complete
            </span>
          </div>
        </div>

        {/* Full-Width Progress Bar Row */}
        <div className="relative w-full h-[2px] rounded-full bg-zinc-200 dark:bg-[#1e2638] mt-1 mb-1">
          <div
            className={`absolute top-0 left-0 h-full rounded-full ${barBgClass} transition-all duration-700`}
            style={{ width: `${progressValue}%` }}
          />
          {/* Glowing Knob */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ${dotClass} transition-all duration-700`}
            style={{ left: `calc(${progressValue}% - 5px)` }}
          />
        </div>

        {/* Footer Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-600 dark:text-zinc-300">
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDotClass} dark:shadow-[0_0_8px_currentColor]`}
            />
            {progressText}
          </div>
          <div className="flex items-center px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-white/5 dark:bg-[#1b2234] text-[11.5px] font-medium dark:text-zinc-300 transition-colors dark:group-hover:bg-white/10 dark:group-hover:text-white group-hover:bg-zinc-100">
            Resume{" "}
            <ChevronRight className="ml-0.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
