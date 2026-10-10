"use client";

import Link from "next/link";
import { FileText, History, ListChecks, Upload } from "lucide-react";

import { CMS_ROUTES } from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface CmsSidebarProps {
  activeHref?: string;
  onNavigate?: (section: "import" | "imports" | "review" | "history") => void;
}

const NAV_ITEMS = [
  {
    id: "import" as const,
    href: `${CMS_ROUTES.content}#uploads`,
    label: "Import",
    icon: Upload,
  },
  {
    id: "imports" as const,
    href: `${CMS_ROUTES.content}#imports`,
    label: "Imports",
    icon: ListChecks,
  },
  {
    id: "review" as const,
    href: `${CMS_ROUTES.content}#review`,
    label: "Review",
    icon: FileText,
  },
  {
    id: "history" as const,
    href: `${CMS_ROUTES.content}#import-history`,
    label: "History",
    icon: History,
  },
];

export function CmsSidebar({
  activeHref = CMS_ROUTES.content,
  onNavigate,
}: CmsSidebarProps) {
  return (
    <aside className="w-full shrink-0 lg:w-52">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Content CMS</p>
            <p className="text-xs text-muted-foreground">RGPV papers</p>
          </div>
        </div>

        <nav
          className="flex flex-row gap-1 overflow-x-auto lg:flex-col"
          aria-label="CMS navigation"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onNavigate?.(item.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  activeHref === CMS_ROUTES.content
                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 hidden border-t border-border pt-4 lg:block">
          <p className="px-2 text-[11px] leading-relaxed text-muted-foreground">
            Import → Process → Review → Approve → Save
          </p>
        </div>
      </div>
    </aside>
  );
}
