import Link from "next/link";
import {
  BookOpen,
  FileText,
  BrainCircuit,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

interface SubjectPageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
  }>;
}

export default async function SubjectPage({
  params,
}: SubjectPageProps) {
  const { branch, semester, subject } = await params;

  const subjectCode = subject.toUpperCase();

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
              {subjectCode}
            </h1>

            <p className="mt-4 text-lg text-muted-foreground">
              Branch:{" "}
              <span className="font-semibold uppercase text-foreground">
                {branch}
              </span>
              {" • "}
              Semester:{" "}
              <span className="font-semibold uppercase text-foreground">
                {semester}
              </span>
            </p>

            <p className="mt-6 max-w-2xl text-muted-foreground">
              Access syllabus, previous year questions, AI notes,
              topic-wise learning resources, and Hyper AI assistance.
            </p>
          </div>
        </div>
      </section>

      {/* Main Actions */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">

            {/* Syllabus */}
            <Link
              href={`/rgpv/${branch}/${semester}/${subject}/syllabus`}
              className="group rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:border-blue-500/20 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                <BookOpen className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>

              <h3 className="mt-6 text-2xl font-bold text-foreground">
                Syllabus
              </h3>

              <p className="mt-3 text-muted-foreground">
                Browse units, topics, learning resources,
                AI notes, and structured content.
              </p>

              <div className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                Open
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>

            {/* PYQs */}
            <Link
              href={`/rgpv/${branch}/${semester}/${subject}/pyqs`}
              className="group rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:border-blue-500/20 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>

              <h3 className="mt-6 text-2xl font-bold text-foreground">
                Previous Year Questions
              </h3>

              <p className="mt-3 text-muted-foreground">
                Access year-wise papers, question analysis,
                important trends, and solutions.
              </p>

              <div className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                Open
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>

            {/* Hyper AI */}
            <Link
              href={`/rgpv/${branch}/${semester}/${subject}/ai`}
              className="group rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:border-blue-500/20 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                <BrainCircuit className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>

              <h3 className="mt-6 text-2xl font-bold text-foreground">
                Hyper AI
              </h3>

              <p className="mt-3 text-muted-foreground">
                Ask questions, generate notes,
                simplify concepts, and learn faster.
              </p>

              <div className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                Open
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-foreground">
              Quick Overview
            </h2>

            <p className="mt-3 text-muted-foreground">
              Everything you need for this subject.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-3xl border border-border bg-card p-6">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h3 className="mt-4 text-xl font-bold text-foreground">
                5 Units
              </h3>
              <p className="text-sm text-muted-foreground">
                Structured Learning
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <FileText className="h-8 w-8 text-blue-600" />
              <h3 className="mt-4 text-xl font-bold text-foreground">
                PYQs
              </h3>
              <p className="text-sm text-muted-foreground">
                Exam Preparation
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <BrainCircuit className="h-8 w-8 text-blue-600" />
              <h3 className="mt-4 text-xl font-bold text-foreground">
                Hyper AI
              </h3>
              <p className="text-sm text-muted-foreground">
                Learning Assistant
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <h3 className="mt-4 text-xl font-bold text-foreground">
                Notes
              </h3>
              <p className="text-sm text-muted-foreground">
                Topic-wise Content
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}