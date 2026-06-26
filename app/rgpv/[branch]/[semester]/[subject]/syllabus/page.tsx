import { BookOpen } from "lucide-react";

import { getSyllabus, getPYQs } from "@/lib/content";
import { getQuestionsForModule } from "@/lib/content/question-mapper";
import ModuleCard from "@/components/syllabus/module-card";

interface Module {
  id: string;
  number: number;
  title: string;
  hours: number;
  topics?: string[];
  questionIds?: string[];
  predictedQuestionIds?: string[];
}

interface SyllabusPageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
  }>;
}

interface MappedQuestion {
  id: string;
  text: string;
  exam: string;
  unit: string;
}

export default async function SyllabusPage({ params }: SyllabusPageProps) {
  const { branch, semester, subject } = await params;

  const syllabus = await getSyllabus(branch, semester, subject);

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

  const modules: Module[] = syllabus.modules || [];

  const pyqs = await getPYQs(branch, semester, subject);

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

          {syllabus.subject?.university && (
            <p className="mt-6 max-w-3xl text-muted-foreground">
              {syllabus.subject.university}
            </p>
          )}
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
              Learn topic-wise with Hyper AI and revise using mapped PYQs.
            </p>
          </div>

          <div className="space-y-8">
            {modules.map((module) => {
              const questions = getQuestionsForModule(module, pyqs).slice(
                0,
                5
              ) as MappedQuestion[];

              return (
                <ModuleCard
                  key={module.id}
                  module={module}
                  questions={questions}
                  branch={branch}
                  semester={semester}
                  subject={subject}
                />
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
