import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import type { Metadata } from "next";

import { branches } from "@/lib/data/branches";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Subjects & Syllabus",
  description:
    "Explore subject-wise RGPV curriculum on Hyper Learning Tech. Browse engineering branches, semesters, syllabus topics, and mapped previous-year questions.",
  path: "/subjects",
});

const availableBranches = branches.filter(
  (branch) => branch.status === "Available"
);

export default function SubjectsPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <BookOpen className="h-4 w-4" />
              Subjects & Syllabus
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              Explore subject-wise curriculum
            </h1>

            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Browse RGPV engineering branches and open semester subject pages
              for syllabus topics and previous-year question papers.
            </p>

            <div className="mt-8">
              <Link
                href="/rgpv"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                RGPV Engineering Hub
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-foreground">
              Available branches
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableBranches.map((branch) => (
              <Link
                key={branch.id}
                href={`/rgpv/${branch.slug}`}
                className="group rounded-2xl border border-border bg-card p-5 transition hover:border-blue-500/30 hover:shadow-md"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  {branch.id}
                </p>
                <h3 className="mt-2 text-lg font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {branch.name}
                </h3>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  View semesters & subjects
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
