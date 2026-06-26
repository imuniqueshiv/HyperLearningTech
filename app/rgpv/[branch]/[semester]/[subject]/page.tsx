import Link from "next/link";
import { ArrowRight, BookOpen, FileText } from "lucide-react";

import { getSyllabus, getPYQs } from "@/lib/content";

interface SubjectPageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
  }>;
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { branch, semester, subject } = await params;

  const syllabus = await getSyllabus(branch, semester, subject);

  const pyqs = await getPYQs(branch, semester, subject);

  const subjectTitle = syllabus?.subject?.title || subject.toUpperCase();

  const papers: {
    exam: string;
    month: string;
    year: number;
    questions?: unknown[];
  }[] = pyqs?.papers || [];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />

          <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              Subject Dashboard
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
              {subjectTitle}
            </h1>

            <p className="mt-4 text-lg text-muted-foreground">
              {branch.toUpperCase()} • {semester.toUpperCase()}
            </p>

            <p className="mt-6 max-w-2xl text-muted-foreground">
              Start with syllabus topics and prepare using mapped previous year
              questions.
            </p>
          </div>
        </div>
      </section>
      {/* Syllabus CTA */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex justify-center">
            <Link
              href={`/rgpv/${branch}/${semester}/${subject}/syllabus`}
              className="group inline-flex items-center gap-4 rounded-xl border border-border bg-card px-8 py-5 transition-all duration-300 hover:border-blue-500/20 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>

              <span className="text-lg font-semibold text-foreground">
                Subject Syllabus
              </span>

              <ArrowRight className="h-6 w-6 text-blue-600" />
            </Link>
          </div>
        </div>
      </section>
      {/* PYQs */}
      {/* PYQ Section */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-foreground">
              Previous Year Question Papers
            </h2>
          </div>

          {papers.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">
                No previous year papers available.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {papers.map((paper, index) => (
                <Link
                  key={`${paper.exam}-${index}`}
                  href={`/rgpv/${branch}/${semester}/${subject}/pyqs/${paper.month.toLowerCase()}-${paper.year}`}
                  className="group rounded-2xl border border-border bg-card px-6 py-5 transition hover:border-blue-500/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        RGPV {paper.month} - {paper.year}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {paper.questions?.length || 0} Questions
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>{" "}
    </main>
  );
}
