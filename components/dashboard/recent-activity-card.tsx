import Link from "next/link";
import { BookOpen, FileText, Clock, ChevronRight } from "lucide-react";

interface RecentActivityCardProps {
  title: string;
  subtitle: string;
  href: string;
  timeAgo: string;
  progressText: string;
  statusColor: string;
  type: "book" | "file";
}

export function RecentActivityCard({
  title,
  subtitle,
  href,
  timeAgo,
  progressText,
  statusColor,
  type,
}: RecentActivityCardProps) {
  const Icon = type === "book" ? BookOpen : FileText;

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-5 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-transform hover:-translate-y-1 hover:shadow-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:border-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4 items-center sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background border border-border text-muted-foreground transition-colors group-hover:bg-[#1D4ED8]/10 group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-bold text-[15px] sm:text-base tracking-tight text-foreground group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400">
              {title}
            </h3>
            <p className="mt-0.5 text-[13px] sm:text-sm font-medium text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="hidden sm:flex w-fit items-center gap-1.5 self-start rounded-md bg-background border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeAgo}</span>
        </div>
      </div>
      
      <div className="relative z-10 mt-6 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2.5 text-[13px] sm:text-sm font-medium text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${statusColor}`} />
          {progressText}
        </div>
        <div className="flex items-center text-[13px] sm:text-sm font-bold text-[#1D4ED8] transition-colors dark:text-blue-400">
          Resume{" "}
          <ChevronRight className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
