import { BrainCircuit, ArrowRight } from "lucide-react";

interface AIPageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
  }>;

  searchParams: Promise<{
    topic?: string;
    module?: string;
  }>;
}

export default async function AIPage({ params, searchParams }: AIPageProps) {
  const { branch, semester, subject } = await params;

  const { topic, module } = await searchParams;

  const isTopicMode = Boolean(topic) && Boolean(module);

  const prompts = isTopicMode
    ? [
        `Explain ${topic}`,
        `Generate Notes for ${topic}`,
        `Generate 5 Mark Answer on ${topic}`,
        `Generate 10 Mark Answer on ${topic}`,
        `Generate PYQs on ${topic}`,
        `Create Revision Sheet for ${topic}`,
      ]
    : [
        "Generate Unit Revision Notes",
        "Predict Important Exam Questions",
        "Generate 10 Mark Answer",
        "Create Last Minute Revision Sheet",
        "Explain Important Concepts",
        "Generate Practice Questions",
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
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <BrainCircuit className="h-4 w-4" />
              Hyper AI
            </span>

            {isTopicMode ? (
              <>
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
                  {topic}
                </h1>

                <p className="mt-4 text-lg font-medium text-blue-600 dark:text-blue-400">
                  {module}
                </p>

                <p className="mt-3 text-muted-foreground">
                  {subject.toUpperCase()} • {branch.toUpperCase()} •{" "}
                  {semester.toUpperCase()}
                </p>

                <p className="mt-6 max-w-3xl text-muted-foreground">
                  Learn this topic with AI-generated explanations, notes, PYQ
                  analysis, revision sheets, and exam-focused answers.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
                  Learn With Hyper AI
                </h1>

                <p className="mt-4 text-lg text-muted-foreground">
                  {subject.toUpperCase()} • {branch.toUpperCase()} •{" "}
                  {semester.toUpperCase()}
                </p>

                <p className="mt-6 max-w-3xl text-muted-foreground">
                  Ask questions, generate notes, create exam answers, understand
                  concepts, and prepare smarter with AI-powered academic
                  assistance.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* AI Workspace */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* Main Area */}
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                  <BrainCircuit className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                  <h2 className="font-bold text-foreground">Hyper AI</h2>

                  <p className="text-sm text-muted-foreground">
                    Online • Ready To Help
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Hyper AI
                  </span>
                </div>

                {isTopicMode ? (
                  <div className="space-y-4">
                    <p className="text-foreground">
                      You are currently studying:
                    </p>

                    <div>
                      <h3 className="text-2xl font-bold text-foreground">
                        {topic}
                      </h3>

                      <p className="mt-1 text-muted-foreground">{module}</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-sm text-muted-foreground">Subject</p>

                      <p className="font-medium text-foreground">
                        {subject.toUpperCase()}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Explain the concept</p>

                      <p>• Generate notes</p>

                      <p>• Generate PYQs</p>

                      <p>• Generate 5 mark answers</p>

                      <p>• Generate 10 mark answers</p>

                      <p>• Create revision sheet</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="leading-8 text-muted-foreground">
                      Select a syllabus topic or ask any academic question to
                      begin learning with Hyper AI.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Ask Hyper AI anything...
                  </span>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="rounded-3xl border border-border bg-card p-6">
                <h3 className="font-bold text-foreground">Suggested Prompts</h3>

                <div className="mt-5 space-y-3">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-blue-500/20"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
