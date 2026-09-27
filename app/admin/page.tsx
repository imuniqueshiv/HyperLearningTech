import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileStack, LayoutDashboard } from "lucide-react";

import { CMS_ROUTES } from "@/lib/content-pipeline";

export const metadata: Metadata = {
  title: "Admin",
  description: "Hyper Learning Tech administration.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Local administration for Hyper Learning Tech
            </p>
          </div>
        </div>

        <Link
          href={CMS_ROUTES.content}
          className="group flex items-center justify-between rounded-2xl border border-border bg-card p-6 transition hover:border-blue-500/30 hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileStack className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Content CMS
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload syllabus, PYQs, and diagrams. Review imports and
                validation findings.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
        </Link>
      </div>
    </main>
  );
}
