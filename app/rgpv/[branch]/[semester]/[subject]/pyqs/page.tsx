import Link from "next/link";
import {
  FileText,
  Calendar,
  BrainCircuit,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface PYQPageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
  }>;
}

export default async function PYQPage({
  params,
}: PYQPageProps) {
  const { branch, semester, subject } = await params;

  const papers = [
    {
      year: "2025",
      session: "December",
    },
    {
      year: "2025",
      session: "June",
    },
    {
      year: "2024",
      session: "December",
    },
    {
      year: "2024",
      session: "June",
    },
    {
      year: "2023",
      session: "December",
    },
    {
      year: "2023",
      session: "June",
    },
    {
      year: "2022",
      session: "December",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <FileText className="h-4 w-4" />
            Previous Year Questions
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
            {subject.toUpperCase()} PYQs
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">
            {branch.toUpperCase()} • {semester.toUpperCase()}
          </p>

          <p className="mt-6 max-w-3xl text-muted-foreground">
            Access previous year papers, discover repeated questions,
            generate AI answers, and prepare strategically for exams.
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-3xl font-bold text-foreground">
                {papers.length}
              </h3>
              <p className="mt-2 text-muted-foreground">
                Papers Available
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-3xl font-bold text-foreground">
                2022-25
              </h3>
              <p className="mt-2 text-muted-foreground">
                Coverage
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-3xl font-bold text-foreground">
                AI
              </h3>
              <p className="mt-2 text-muted-foreground">
                Answer Generator
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-3xl font-bold text-foreground">
                Smart
              </h3>
              <p className="mt-2 text-muted-foreground">
                Analysis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PYQ Papers */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Available Papers
            </h2>

            <p className="mt-3 text-muted-foreground">
              Browse previous year examination papers.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {papers.map((paper) => (
              <div
                key={`${paper.year}-${paper.session}`}
                className="rounded-3xl border border-border bg-card p-7"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground">
                      {paper.session}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {paper.year}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <button className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground">
                    View Paper
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Smart PYQ Tools
            </h2>

            <p className="mt-3 text-muted-foreground">
              Use AI to learn from previous year questions.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-8">
              <BrainCircuit className="h-8 w-8 text-blue-600 dark:text-blue-400" />

              <h3 className="mt-6 text-xl font-bold text-foreground">
                AI Answer Generator
              </h3>

              <p className="mt-3 text-muted-foreground">
                Generate structured 2, 5, and 10-mark answers
                instantly from previous year questions.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-8">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />

              <h3 className="mt-6 text-xl font-bold text-foreground">
                Repeated Questions
              </h3>

              <p className="mt-3 text-muted-foreground">
                Discover frequently repeated questions and
                important examination patterns.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-8">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />

              <h3 className="mt-6 text-xl font-bold text-foreground">
                Topic Mapping
              </h3>

              <p className="mt-3 text-muted-foreground">
                Connect previous year questions directly
                with syllabus topics and units.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hyper AI CTA */}
      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Hyper AI
                  </span>
                </div>

                <h3 className="mt-3 text-2xl font-bold text-foreground">
                  Generate Answers From PYQs
                </h3>

                <p className="mt-3 text-muted-foreground">
                  Upload a question or select any PYQ and let
                  Hyper AI generate exam-focused answers.
                </p>
              </div>

              <Link
                href={`/rgpv/${branch}/${semester}/${subject}/ai`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3 font-medium text-white transition hover:bg-[#1E40AF]"
              >
                Open Hyper AI
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}