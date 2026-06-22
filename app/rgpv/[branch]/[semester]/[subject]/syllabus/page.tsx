import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react";
import { getSyllabus } from "@/lib/content/syllabus";

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

  const syllabus = await getSyllabus(subject);

  if (!syllabus) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            Syllabus Not Found
          </h1>

          <p className="mt-4 text-muted-foreground">
            No syllabus available for {subject.toUpperCase()}
          </p>
        </div>
      </main>
    );
  }

  interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  hours: number;
  questionIds?: string[];
  predictedQuestionIds?: string[];
}

const modules: Module[] = syllabus.modules || [];

  interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  hours: number;
  questionIds?: string[];
  predictedQuestionIds?: string[];
}

const totalQuestions = (modules as Module[]).reduce(
  (total, module) =>
    total + (module.questionIds?.length || 0),
  0
);

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
            {syllabus.subject?.title || subject.toUpperCase()}
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">
            {branch.toUpperCase()} • {semester.toUpperCase()}
          </p>

          <p className="mt-6 max-w-3xl text-muted-foreground">
            {syllabus.subject?.university}
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-3xl font-bold text-foreground">
                {modules.length}
              </h3>

              <p className="mt-2 text-muted-foreground">
                Modules
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-3xl font-bold text-foreground">
                {totalQuestions}
              </h3>

              <p className="mt-2 text-muted-foreground">
                Linked PYQs
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-3xl font-bold text-foreground">
                {syllabus.subject?.credits || "-"}
              </h3>

              <p className="mt-2 text-muted-foreground">
                Credits
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Course Modules
            </h2>

            <p className="mt-3 text-muted-foreground">
              Explore module-wise syllabus topics and question mappings.
            </p>
          </div>

          <div className="space-y-6">
            {modules.map(
  (
    module: {
      id: string;
      number: number;
      title: string;
      description: string;
      hours: number;
      questionIds?: string[];
      predictedQuestionIds?: string[];
    }
  ) => (
              <div
                key={module.id}
                className="rounded-3xl border border-border bg-card p-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                        <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-foreground">
                          Module {module.number}
                        </h3>

                        <p className="text-blue-600 dark:text-blue-400">
                          {module.title}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-muted-foreground leading-7">
                      {module.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <span className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
                        {module.hours} Hours
                      </span>

                      <span className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
                        {module.questionIds?.length || 0} PYQs
                      </span>

                      <span className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
                        {module.predictedQuestionIds?.length || 0} Predicted
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Question Mapping Available
                    </div>
                  </div>
<Link
  href={`/rgpv/${branch}/${semester}/${subject}/syllabus/module-${module.number}`}
  className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3 font-medium text-white transition hover:bg-[#1E40AF]"
>
  View Module
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
                  notes, examples, derivations, and exam-focused answers.
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