import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react";

interface SyllabusPageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
  }>;
}

export default async function SyllabusPage({
  params,
}: SyllabusPageProps) {
  const { branch, semester, subject } = await params;

  const units = [
    {
      id: 1,
      title: "Unit 1",
      topics: 8,
      description:
        "Fundamental concepts, definitions, and introductory topics.",
    },
    {
      id: 2,
      title: "Unit 2",
      topics: 7,
      description:
        "Core concepts and practical applications of the subject.",
    },
    {
      id: 3,
      title: "Unit 3",
      topics: 9,
      description:
        "Intermediate concepts and problem-solving techniques.",
    },
    {
      id: 4,
      title: "Unit 4",
      topics: 6,
      description:
        "Advanced concepts, models, and implementation techniques.",
    },
    {
      id: 5,
      title: "Unit 5",
      topics: 7,
      description:
        "Modern trends, applications, and future developments.",
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
            <BookOpen className="h-4 w-4" />
            Subject Syllabus
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
            {subject.toUpperCase()}
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">
            {branch.toUpperCase()} • {semester.toUpperCase()}
          </p>

          <p className="mt-6 max-w-3xl text-muted-foreground">
            Explore all units and topics. Every topic can later be connected
            with AI Notes, Hyper AI explanations, PYQs, and revision resources.
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-3xl font-bold text-foreground">5</h3>
              <p className="mt-2 text-muted-foreground">
                Units
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-3xl font-bold text-foreground">37+</h3>
              <p className="mt-2 text-muted-foreground">
                Topics
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-3xl font-bold text-foreground">
                Hyper AI
              </h3>
              <p className="mt-2 text-muted-foreground">
                Topic Assistance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Units */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Course Units
            </h2>

            <p className="mt-3 text-muted-foreground">
              Select a unit to start learning.
            </p>
          </div>

          <div className="space-y-6">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="rounded-3xl border border-border bg-card p-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                        <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>

                      <h3 className="text-2xl font-bold text-foreground">
                        {unit.title}
                      </h3>
                    </div>

                    <p className="mt-4 text-muted-foreground">
                      {unit.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {unit.topics} Topics Available
                    </div>
                  </div>

                  <Link
                    href={`/rgpv/${branch}/${semester}/${subject}/ai`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3 font-medium text-white transition hover:bg-[#1E40AF]"
                  >
                    Learn with Hyper AI
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hyper AI Banner */}
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
                  Need help understanding a topic?
                </h3>

                <p className="mt-3 text-muted-foreground">
                  Ask Hyper AI for explanations, summaries,
                  notes, examples, and exam-focused answers.
                </p>
              </div>

              <Link
                href={`/rgpv/${branch}/${semester}/${subject}/ai`}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 font-medium text-foreground transition hover:border-blue-500/30"
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