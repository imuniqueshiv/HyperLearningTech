import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Calendar, Clock } from "lucide-react";
import { getPYQs } from "@/lib/content/pyqs";

interface PaperPageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
    paper: string;
  }>;
}

function splitQuestionText(text: string): string[] {
  const romanPattern = "(?:viii|vii|vi|iv|ix|iii|ii|i|v|x)";
  const regex = new RegExp(`\\s(${romanPattern})\\)\\s`, "g");

  const matchIndices: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matchIndices.push(match.index + 1);
  }

  if (matchIndices.length === 0) {
    return [text];
  }

  const lines: string[] = [];
  const intro = text.slice(0, matchIndices[0]).trim();
  if (intro) lines.push(intro);

  for (let i = 0; i < matchIndices.length; i++) {
    const start = matchIndices[i];
    const end = i + 1 < matchIndices.length ? matchIndices[i + 1] : text.length;
    lines.push(text.slice(start, end).trim());
  }

  return lines;
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { branch, semester, subject, paper } = await params;

  const pyqs = await getPYQs(branch, semester, subject);

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
    (p: { year: number; month: string }) =>
      `${p.month.toLowerCase()}-${p.year}` === paper
  );

  if (!selectedPaper) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <FileText className="h-5 w-5" />
            <span className="font-medium">Previous Year Question Paper</span>
          </div>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            {pyqs.subject.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="font-medium text-foreground">
              {selectedPaper.exam}
            </span>
            <span>•</span>
            <span>{branch.toUpperCase()}</span>
            <span>•</span>
            <span>{semester.toUpperCase()}</span>
          </div>

          {/* Compact Paper Details */}
          <div className="mt-6 flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-card/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-foreground">
                {selectedPaper.exam}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-foreground">
                Max Marks: {pyqs.subject.maxMarks}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-foreground">
                Duration: {pyqs.subject.time}
              </span>
            </div>
          </div>

          {/* Instructions */}
          {pyqs.subject.commonInstructions?.length > 0 && (
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Instructions:</span>
              {pyqs.subject.commonInstructions.map(
                (instruction: string, index: number) => (
                  <p key={index} className="ml-4">
                    • {instruction.replace(/^[•\s]+/, "")}
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* Questions */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="space-y-4">
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
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="px-6 py-5">
                    <span className="text-lg font-semibold text-foreground md:text-xl">
                      {question.questionNumber}
                    </span>
                  </div>

                  {question.subQuestions?.length ? (
                    <div className="border-t border-border px-6 py-5">
                      {question.subQuestions.map((subQuestion, subIndex) => (
                        <details
                          key={subQuestion.id}
                          className={`group/sub ${subIndex > 0 ? "mt-6 pt-6 border-t border-border" : ""}`}
                        >
                          <summary className="cursor-pointer list-none">
                            <div className="flex flex-wrap items-center gap-2">
                              {subQuestion.label && (
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {subQuestion.label}
                                </span>
                              )}

                              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                                {subQuestion.unit}
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              {splitQuestionText(subQuestion.text).map(
                                (line, lineIndex) => (
                                  <p
                                    key={lineIndex}
                                    className="text-lg leading-8 text-foreground md:text-xl md:leading-9"
                                  >
                                    {line}
                                  </p>
                                )
                              )}
                            </div>
                          </summary>

                          {/* AI Answer Button - only shows for this sub-question when opened */}
                          <div className="mt-4">
                            <Link
                              href={`/rgpv/${branch}/${semester}/${subject}/ai?question=${encodeURIComponent(
                                subQuestion.text
                              )}`}
                              className="inline-flex items-center rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-500/20 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Check Answer {subQuestion.label} with AI
                            </Link>
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : (
                    <div className="border-t border-border px-6 py-5">
                      <p className="text-muted-foreground">
                        No sub-questions available.
                      </p>
                    </div>
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
