"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, Sparkles } from "lucide-react";

// Mapping dictionary for acronyms and friendly branch/path names
const PATH_MAP: Record<string, string> = {
  rgpv: "RGPV",
  common: "1st Year Common",
  aiml: "AI & Machine Learning",
  cse: "Computer Science",
  csit: "CS & Information Tech",
  aids: "AI & Data Science",
  csbs: "CS & Business Systems",
  cscy: "Cyber Security",
  civil: "Civil Engineering",
  me: "Mechanical Eng.",
  ec: "ECE",
  ee: "Electrical Eng.",
  eee: "EEE",
  ei: "Instrumentation",
  ex: "Electronics Eng.",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const pathNames = pathname.split("/").filter((path) => path);
  const isWorkspaceFocusRoute = /^\/rgpv\/[^/]+\/[^/]+\/[^/]+\/ai$/.test(
    pathname
  );

  if (isWorkspaceFocusRoute || pathNames.length <= 1) {
    return null;
  }

  const formatSegment = (segment: string): string => {
    const lower = segment.toLowerCase();
    if (PATH_MAP[lower]) return PATH_MAP[lower];

    if (/^semester-\d+$/.test(lower)) {
      const num = lower.replace("semester-", "");
      return `Semester ${num}`;
    }

    return decodeURIComponent(segment)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-4 sm:pt-6 pb-1 lg:px-8">
      <nav aria-label="Breadcrumb">
        <ol className="inline-flex max-w-full items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap rounded-full border border-slate-200/80 bg-white/80 px-3.5 sm:px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#12121a]/80 dark:text-slate-400">
          {/* Home button */}
          <li className="shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1 transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-label="Home"
            >
              <Home className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span className="sr-only sm:not-sr-only sm:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Home
              </span>
            </Link>
          </li>

          {pathNames.length > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          )}

          {pathNames.map((link, index) => {
            const href = `/${pathNames.slice(0, index + 1).join("/")}`;
            const isLast = index === pathNames.length - 1;
            const label = formatSegment(link);

            return (
              <li key={href} className="flex items-center gap-1.5 shrink-0">
                {isLast ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 text-[11.5px]"
                    aria-current="page"
                  >
                    <Sparkles className="h-3 w-3 text-blue-500 dark:text-blue-400 shrink-0" />
                    <span>{label}</span>
                  </span>
                ) : (
                  <>
                    <Link
                      href={href}
                      className="transition-colors hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-400 text-[11.5px]"
                    >
                      {label}
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
