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
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-[#1D4ED8]/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] dark:hover:border-blue-500/30"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-[#1D4ED8]/10 group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-semibold text-foreground transition-colors group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400">
              {title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex w-fit items-center gap-1.5 self-start rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeAgo}</span>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${statusColor}`} />
          {progressText}
        </div>
        <div className="flex items-center text-sm font-medium text-[#1D4ED8] transition-colors dark:text-blue-400">
          Resume{" "}
          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
