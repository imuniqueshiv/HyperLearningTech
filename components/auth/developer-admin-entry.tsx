import Link from "next/link";

import { CMS_ROUTES } from "@/lib/content-pipeline/constants";

/**
 * Local-only navigation to the CMS dashboard.
 * Not auth — server-side CMS_LOCAL_MODE remains authoritative.
 */
export function DeveloperAdminEntry({ className }: { className?: string }) {
  return (
    <Link
      href={CMS_ROUTES.content}
      className={
        className ??
        "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-transparent px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-border"
      }
    >
      Developer Admin (Local)
      <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        DEV ONLY
      </span>
    </Link>
  );
}
