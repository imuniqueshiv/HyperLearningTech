import { notFound } from "next/navigation";
import { FileText, Calendar, Clock, ChevronDown, Sparkles } from "lucide-react";
import { getPYQs } from "@/lib/content";
import GenerateAnswerButton from "@/components/ai/generate-answer-button";
import QuestionAttachments from "@/components/pyqs/question-attachments";
import { buildQuestionWithAttachments } from "@/lib/ai/prompt-builder";
import type { SubQuestion } from "@/types/pyq";
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {selectedPaper.questions.map(
              (
                question: {
                  id: string;
                  questionNumber: string;
                  subQuestions?: SubQuestion[];
                },
                index: number
              ) => (
                <article
                  key={question.id || index}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md dark:hover:border-blue-700"
                >
                  <header className="border-b border-border bg-muted/20 px-5 py-4 sm:px-6 sm:py-5">
                    <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-3 py-1 text-base font-bold text-blue-600 dark:text-blue-400 sm:text-lg">
                      {question.questionNumber}
                    </span>
                  </header>

                  {question.subQuestions?.length ? (
                    <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
                      {question.subQuestions.map((subQuestion) => (
                        <details
                          key={subQuestion.id}
                          className="group/sub overflow-hidden rounded-xl border border-border bg-background transition-all duration-300 hover:border-blue-300 hover:shadow-md open:border-blue-300 open:shadow-md dark:hover:border-blue-700 dark:open:border-blue-700"
                        >
                          <summary className="cursor-pointer list-none outline-none transition-all duration-300 [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                            <div className="space-y-4 px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
                              <div className="flex flex-wrap items-center gap-2.5">
                                {subQuestion.label && (
                                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-blue-500/10 px-2.5 text-sm font-bold text-blue-600 dark:text-blue-400">
                                    {subQuestion.label}
                                  </span>
                                )}

                                <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                  {subQuestion.unit}
                                </span>
                              </div>

                              <div className="space-y-3">
                                {splitQuestionText(subQuestion.text).map(
                                  (line, lineIndex) => (
                                    <p
                                      key={lineIndex}
                                      className="text-base leading-7 text-foreground sm:text-lg sm:leading-8"
                                    >
                                      {line}
                                    </p>
                                  )
                                )}
                              </div>

                              <QuestionAttachments
                                attachments={subQuestion.attachments}
                                branch={branch}
                                semester={semester}
                                subject={subject}
                              />
                            </div>

                            <div
                              aria-hidden="true"
                              className="flex items-center justify-between gap-3 border-t border-blue-500/10 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-blue-500/10 px-4 py-3 transition-all duration-300 group-open/sub:border-blue-500/25 group-open/sub:from-blue-500/10 group-open/sub:via-blue-500/15 group-open/sub:to-indigo-500/10 sm:px-5 sm:py-3.5"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <Sparkles className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
                                <span className="truncate text-sm font-medium text-blue-600 dark:text-blue-400">
                                  AI Answer Available
                                </span>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors duration-300 group-open/sub:text-blue-600 dark:group-open/sub:text-blue-400">
                                <span className="group-open/sub:hidden">
                                  Click to expand
                                </span>
                                <span className="hidden group-open/sub:inline">
                                  Expanded
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 group-open/sub:rotate-180" />
                              </div>
                            </div>
                          </summary>

                          <div className="border-t border-blue-500/15 bg-blue-500/[0.03] px-0 pb-3 pt-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300 sm:px-5 sm:pb-5 sm:pt-4 dark:bg-blue-500/[0.06]">
                            <GenerateAnswerButton
                              question={buildQuestionWithAttachments(
                                subQuestion.text,
                                subQuestion.attachments
                              )}
                              subjectCode={subject.toUpperCase()}
                              label={subQuestion.label}
                              compactMobile
                            />
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : (
                    <div className="border-t border-border px-5 py-5 sm:px-6">
                      <p className="text-sm text-muted-foreground">
                        No sub-questions available.
                      </p>
                    </div>
                  )}
                </article>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
