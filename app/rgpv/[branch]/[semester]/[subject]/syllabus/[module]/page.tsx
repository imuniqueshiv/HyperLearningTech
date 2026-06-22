import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Clock3,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { getSyllabus } from "@/lib/content/syllabus";
import { getPYQs } from "@/lib/content/pyqs";
import { getQuestionsForModule } from "@/lib/content/question-mapper";

interface ModulePageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
    module: string;
  }>;
}

export default async function ModulePage({
  params,
}: ModulePageProps) {
  const { branch, semester, subject, module } =
    await params;

  const syllabus = await getSyllabus(subject);

  if (!syllabus) {
    notFound();
  }

  const modules = syllabus.modules || [];

  const moduleNumber = Number(
    module.replace("module-", "")
  );

  const currentModule = modules.find(
    (item: { number: number }) =>
      item.number === moduleNumber
  );

  if (!currentModule) {
    notFound();
  }

  const pyqs = await getPYQs(subject);

  const mappedQuestions =
    getQuestionsForModule(
      currentModule,
      pyqs
    );

  const recentQuestions = mappedQuestions.slice(
    0,
    10
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
          <Link
            href={`/rgpv/${branch}/${semester}/${subject}/syllabus`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Syllabus
          </Link>

          <div className="mt-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <BookOpen className="h-4 w-4" />
              Module Details
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
              Module {currentModule.number}
            </h1>

            <p className="mt-3 text-xl font-medium text-blue-600 dark:text-blue-400">
              {currentModule.title}
            </p>

            <p className="mt-6 max-w-4xl text-lg leading-8 text-muted-foreground">
              {currentModule.description}
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-3xl border border-border bg-card p-6">
              <Clock3 className="h-8 w-8 text-blue-600" />

              <h3 className="mt-4 text-3xl font-bold text-foreground">
                {currentModule.hours}
              </h3>

              <p className="text-muted-foreground">
                Teaching Hours
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <FileText className="h-8 w-8 text-blue-600" />

              <h3 className="mt-4 text-3xl font-bold text-foreground">
                {
                  currentModule.questionIds
                    ?.length
                }
              </h3>

              <p className="text-muted-foreground">
                Linked PYQs
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <TrendingUp className="h-8 w-8 text-blue-600" />

              <h3 className="mt-4 text-3xl font-bold text-foreground">
                {
                  currentModule
                    .predictedQuestionIds
                    ?.length
                }
              </h3>

              <p className="text-muted-foreground">
                Predicted Questions
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <BrainCircuit className="h-8 w-8 text-blue-600" />

              <h3 className="mt-4 text-3xl font-bold text-foreground">
                AI
              </h3>

              <p className="text-muted-foreground">
                Learning Assistant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Module Content */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8">
            <h2 className="text-3xl font-bold text-foreground">
              Module Coverage
            </h2>

            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {currentModule.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                {currentModule.hours} Hours
              </span>

              <span className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                {
                  currentModule.questionIds
                    ?.length
                }{" "}
                PYQs
              </span>

              <span className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                {
                  currentModule
                    .predictedQuestionIds
                    ?.length
                }{" "}
                Predicted
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Mapped PYQs */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Linked Previous Year Questions
            </h2>

            <p className="mt-3 text-muted-foreground">
              Questions automatically mapped
              from all available examination
              papers.
            </p>
          </div>

          {recentQuestions.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">
                No mapped questions found for
                this module yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {recentQuestions.map(
                (
                  question: {
                    id: string;
                    text: string;
                    exam: string;
                    unit: string;
                  },
                  index: number
                ) => (
                  <div
                    key={`${question.id}-${index}`}
                    className="rounded-3xl border border-border bg-card p-8"
                  >
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">
                        {question.exam}
                      </span>

                      <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                        {question.unit}
                      </span>
                    </div>

                    <p className="text-lg leading-8 text-foreground">
                      {question.text}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* Hyper AI */}
      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />

                  <span className="font-semibold text-blue-600">
                    Hyper AI
                  </span>
                </div>

                <h3 className="mt-3 text-2xl font-bold text-foreground">
                  Learn This Module With AI
                </h3>

                <p className="mt-3 text-muted-foreground">
                  Generate notes, explanations,
                  derivations, important
                  questions, and exam-focused
                  answers.
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