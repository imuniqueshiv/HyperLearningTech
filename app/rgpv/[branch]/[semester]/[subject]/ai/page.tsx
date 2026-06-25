import { BrainCircuit } from "lucide-react";
import WorkspaceChat from "@/components/ai/workspace-chat";

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

  // Suggested prompts based on topic
  const getSuggestedPrompts = (mainTopic: string) => {
    if (!mainTopic)
      return [
        "Explain the concept",
        "Generate notes",
        "Create revision sheet",
        "Generate exam questions",
        "Explain with examples",
      ];

    return [
      `Explain ${mainTopic} in detail`,
      `Generate 5 mark answer on ${mainTopic}`,
      `Generate 10 mark answer on ${mainTopic}`,
      `Generate PYQs on ${mainTopic}`,
      `Create revision sheet for ${mainTopic}`,
    ];
  };

  const suggestedPrompts =
    isTopicMode && topic
      ? getSuggestedPrompts(topic)
      : [
          "Explain the concept",
          "Generate notes",
          "Create revision sheet",
          "Generate exam questions",
          "Explain with examples",
        ];

  // Initial prompts for WorkspaceChat
  const initialPrompts =
    isTopicMode && topic && module
      ? [
          {
            prompt: `Explain ${topic} in detail`,
            action: "explain",
            topic: topic,
            module: module,
          },
          {
            prompt: `Generate 5 mark answer on ${topic}`,
            action: "generate",
            topic: topic,
            module: module,
          },
          {
            prompt: `Create revision sheet for ${topic}`,
            action: "summarize",
            topic: topic,
            module: module,
          },
        ]
      : [
          { prompt: "Explain the concept", action: "explain" },
          { prompt: "Generate notes", action: "generate" },
          { prompt: "Create revision sheet", action: "summarize" },
        ];

  // Build welcome message with topic context
  const welcomeMessage =
    isTopicMode && topic
      ? `Ask me anything about **${topic}**. I can help with explanations, examples, exam preparation, and suggest related topics based on your learning needs.`
      : "Ask me anything about your subject. I can help with explanations, examples, and exam preparation.";

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20 lg:px-8">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <BrainCircuit className="h-4 w-4" />
              Hyper AI
            </span>

            {isTopicMode ? (
              <>
                <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                  {topic}
                </h1>

                <p className="mt-4 text-base font-medium text-blue-600 dark:text-blue-400 md:text-lg">
                  {module}
                </p>

                <p className="mt-3 text-sm text-muted-foreground md:text-base">
                  {subject.toUpperCase()} • {branch.toUpperCase()} •{" "}
                  {semester.toUpperCase()}
                </p>

                <p className="mt-6 max-w-3xl text-sm text-muted-foreground md:text-base">
                  Learn this topic with AI-generated explanations, notes, PYQ
                  analysis, revision sheets, and exam-focused answers.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                  Learn With Hyper AI
                </h1>

                <p className="mt-4 text-base text-muted-foreground md:text-lg">
                  {subject.toUpperCase()} • {branch.toUpperCase()} •{" "}
                  {semester.toUpperCase()}
                </p>

                <p className="mt-6 max-w-3xl text-sm text-muted-foreground md:text-base">
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
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Main Chat Area */}
            <div className="min-h-[500px] rounded-[2rem] border border-border bg-card p-4 shadow-sm md:p-6">
              <WorkspaceChat
                subjectCode={subject.toUpperCase()}
                initialPrompts={initialPrompts}
                welcomeMessage={welcomeMessage}
                apiEndpoint="/api/ai/workspace"
                topic={topic}
                module={module}
              />
            </div>

            {/* Sidebar - Suggested Prompts */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
                <h3 className="text-sm font-bold text-foreground md:text-base">
                  Suggested Prompts
                </h3>

                <div className="mt-4 space-y-2.5">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-left text-xs text-muted-foreground transition hover:border-blue-500/20 hover:bg-blue-500/5 hover:text-foreground md:text-sm"
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
