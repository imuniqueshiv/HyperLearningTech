import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";

type ColorVariant = "blue" | "indigo" | "emerald" | "purple";

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  colorVariant: ColorVariant;
}

export function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  colorVariant,
}: QuickActionCardProps) {
  const variants = {
    blue: {
      wrapper:
        "hover:border-[#1D4ED8]/30 focus-visible:ring-[#1D4ED8] dark:hover:border-blue-500/30",
      iconBox:
        "bg-blue-50 text-[#1D4ED8] group-hover:bg-[#1D4ED8] group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-500 dark:group-hover:text-white",
      title: "group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400",
      arrow: "group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400",
    },
    indigo: {
      wrapper:
        "hover:border-indigo-500/30 focus-visible:ring-indigo-500 dark:hover:border-indigo-500/30",
      iconBox:
        "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400 dark:group-hover:bg-indigo-500 dark:group-hover:text-white",
      title: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
      arrow: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
    },
    emerald: {
      wrapper:
        "hover:border-emerald-500/30 focus-visible:ring-emerald-500 dark:hover:border-emerald-500/30",
      iconBox:
        "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-500 dark:group-hover:text-white",
      title: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
      arrow: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    },
    purple: {
      wrapper:
        "hover:border-purple-500/30 focus-visible:ring-purple-500 dark:hover:border-purple-500/30",
      iconBox:
        "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-500/10 dark:text-purple-400 dark:group-hover:bg-purple-500 dark:group-hover:text-white",
      title: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
      arrow: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    },
  };

  const style = variants[colorVariant];

  return (
    <Link
      href={href}
      className={`group relative flex flex-col gap-3 overflow-hidden rounded-[20px] border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-transform hover:-translate-y-1 hover:shadow-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:border-blue-500/30 ${style.wrapper}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex items-center justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 ${style.iconBox}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-[#1D4ED8]/10 group-hover:border-[#1D4ED8]/20 group-hover:text-[#1D4ED8] ${style.arrow}`}
        >
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      <div className="relative z-10 mt-1">
        <h3
          className={`font-bold text-[15px] sm:text-base tracking-tight text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 ${style.title}`}
        >
          {title}
        </h3>
        <p className="mt-1 text-[13px] sm:text-sm leading-relaxed text-muted-foreground font-medium line-clamp-2">
          {description}
        </p>
      </div>
    </Link>
  );
}
