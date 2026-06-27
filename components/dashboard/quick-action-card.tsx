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
      className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 ${style.wrapper}`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${style.iconBox}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3
          className={`font-semibold text-foreground transition-colors ${style.title}`}
        >
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <ArrowRight
        className={`absolute bottom-6 right-6 h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 ${style.arrow}`}
      />
    </Link>
  );
}
