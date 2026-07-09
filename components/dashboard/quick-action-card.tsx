import Link from "next/link";
import { LucideIcon } from "lucide-react";

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
      wrapper: "hover:border-blue-500/30 focus-visible:ring-blue-500",
      iconBox: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    indigo: {
      wrapper: "hover:border-purple-500/30 focus-visible:ring-purple-500",
      iconBox: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    emerald: {
      wrapper: "hover:border-emerald-500/30 focus-visible:ring-emerald-500",
      iconBox: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    purple: {
      wrapper: "hover:border-amber-500/30 focus-visible:ring-amber-500",
      iconBox: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  };

  const style = variants[colorVariant];

  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between h-full overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(149,157,165,0.15)] hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(96,165,250,0.2)] hover:-translate-y-1 transition-all duration-300 dark:bg-slate-900/60 dark:border-blue-400/15 dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] dark:hover:border-blue-400/30 ${style.wrapper}`}
    >
      {/* Subtle Radial Glow on the Right Edge (Only in Dark Mode or very faint in Light Mode) */}
      <div
        className={`absolute top-0 -right-20 w-48 h-full rounded-full blur-[50px] opacity-[0.02] dark:opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.04] dark:group-hover:opacity-[0.12] ${
          colorVariant === "blue"
            ? "bg-blue-500"
            : colorVariant === "indigo"
              ? "bg-purple-500"
              : colorVariant === "emerald"
                ? "bg-emerald-500"
                : "bg-amber-500"
        }`}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100/50 dark:from-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Top Section: Icon */}
      <div className="relative z-10 flex items-start justify-between">
        <div
          className={`flex h-[42px] w-[42px] items-center justify-center rounded-[12px] shadow-sm dark:shadow-inner border border-zinc-200/60 bg-zinc-50 dark:border-white/[0.08] dark:bg-[#0c1017] transition-colors ${style.iconBox}`}
        >
          <Icon
            className="h-5 w-5 dark:drop-shadow-[0_0_8px_currentColor]"
            strokeWidth={2}
          />
        </div>
      </div>

      {/* Bottom Section: Text */}
      <div className="relative z-10 mt-8 flex flex-col gap-0.5">
        <h3 className="font-bold text-[15px] tracking-tight text-zinc-900 dark:text-white leading-snug">
          {title}
        </h3>
        <p className="text-[12.5px] font-medium text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </Link>
  );
}
