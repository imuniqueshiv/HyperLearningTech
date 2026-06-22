import { notFound } from "next/navigation";
import { FileText, Calendar, BookOpen } from "lucide-react";
import { getPYQs } from "@/lib/content/pyqs";

interface PaperPageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
    paper: string;
  }>;
}

export default async function PaperPage({
  params,
}: PaperPageProps) {
  const { branch, semester, subject, paper } = await params;

  const pyqs = await getPYQs(subject);

  if (!pyqs) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            Subject Not Found
          </h1>

          <p className="mt-4 text-muted-foreground">
            Unable to load PYQ data for {subject.toUpperCase()}.
          </p>
        </div>
      </main>
    );
  }

  const selectedPaper = pyqs.papers.find(
    (p: { exam: string }) =>
      p.exam.toLowerCase().replace(/\s+/g, "-") === paper
  );

  if (!selectedPaper) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <FileText className="h-5 w-5" />
            <span className="font-medium">
              Previous Year Question Paper
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            {pyqs.subject.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
            <span>{selectedPaper.exam}</span>
            <span>•</span>
            <span>{branch.toUpperCase()}</span>
            <span>•</span>
            <span>{semester.toUpperCase()}</span>
          </div>
        </div>
      </section>

      {/* Paper Details */}
      <section className="border-b border-border py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-6">
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />

              <h3 className="mt-4 text-lg font-bold text-foreground">
                Examination
              </h3>

              <p className="mt-2 text-muted-foreground">
                {selectedPaper.exam}
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />

              <h3 className="mt-4 text-lg font-bold text-foreground">
                Maximum Marks
              </h3>

              <p className="mt-2 text-muted-foreground">
                {pyqs.subject.maxMarks}
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />

              <h3 className="mt-4 text-lg font-bold text-foreground">
                Duration
              </h3>

              <p className="mt-2 text-muted-foreground">
                {pyqs.subject.time}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions */}
      {pyqs.subject.commonInstructions?.length > 0 && (
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="rounded-3xl border border-border bg-card p-8">
              <h2 className="text-2xl font-bold text-foreground">
                Instructions
              </h2>

              <ul className="mt-6 space-y-3">
                {pyqs.subject.commonInstructions.map(
                  (instruction: string, index: number) => (
                    <li
                      key={index}
                      className="text-muted-foreground"
                    >
                      • {instruction}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Questions */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Question Paper
            </h2>

            <p className="mt-3 text-muted-foreground">
              Total Questions: {selectedPaper.questions.length}
            </p>
          </div>

          <div className="space-y-8">
            {selectedPaper.questions.map(
              (
                question: {
                  id: string;
                  questionNumber: string;
                  subQuestions?: {
                    id: string;
                    label: string;
                    text: string;
                    unit: string;
                  }[];
                },
                index: number
              ) => (
                <div
                  key={question.id || index}
                  className="rounded-3xl border border-border bg-card p-8"
                >
                  <h3 className="text-2xl font-bold text-foreground">
                    {question.questionNumber}
                  </h3>

                  {question.subQuestions?.length ? (
                    <div className="mt-6 space-y-6">
                      {question.subQuestions.map((subQuestion) => (
                        <div
                          key={subQuestion.id}
                          className="rounded-2xl border border-border bg-background p-6"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            {subQuestion.label && (
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {subQuestion.label}
                              </span>
                            )}

                            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                              {subQuestion.unit}
                            </span>
                          </div>

                          <p className="mt-4 leading-8 text-foreground">
                            {subQuestion.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-muted-foreground">
                      No sub-questions available.
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}