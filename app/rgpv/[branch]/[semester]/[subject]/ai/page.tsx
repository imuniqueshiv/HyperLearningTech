import { BrainCircuit } from "lucide-react";
import WorkspaceChatLoader from "@/components/ai/workspace-chat-loader";
import { getTopicById } from "@/lib/content";
import { generateTopicAnswer } from "@/lib/ai/topic-service";

interface AIPageProps {
  params: Promise<{
    branch: string;
    semester: string;
    subject: string;
  }>;

  searchParams: Promise<{
    topicId?: string;
  }>;
}

function getFollowupPrompts(topicTitle: string) {
  return [
    `Why is ${topicTitle} important?`,
    "Give one practical example.",
    `What are the disadvantages of ${topicTitle}?`,
  ];
}

export default async function AIPage({ params, searchParams }: AIPageProps) {
  const { branch, semester, subject } = await params;
  const { topicId } = await searchParams;

  const topicData = topicId
    ? await getTopicById(branch, semester, subject, topicId)
    : null;

  const topicTitle = topicData?.topic.title ?? "";
  const moduleTitle = topicData?.module.title ?? "";
  const isTopicMode = topicData !== null;

  let cachedExplanation: string | undefined;
  let explanationCached: boolean | undefined;

  if (isTopicMode && topicId) {
    try {
      const result = await generateTopicAnswer({
        branch,
        semester,
        topicId,
        subjectCode: subject.toUpperCase(),
        action: "EXPLAIN",
      });
      cachedExplanation = result.answer;
      explanationCached = result.cached;
    } catch (error) {
      console.error("Failed to load topic explanation:", error);
    }
  }

  const followupPrompts = isTopicMode
    ? getFollowupPrompts(topicTitle).map((prompt) => ({ prompt }))
    : [];

  const generalPrompts = [
    { prompt: "Explain the concept", action: "explain" },
    { prompt: "Generate notes", action: "generate" },
    { prompt: "Create revision sheet", action: "summarize" },
  ];

  const welcomeMessage = isTopicMode
    ? `Your **${topicTitle}** explanation is ready below. Ask up to 3 follow-up questions — examples, comparisons, exam tips, and clarifications.`
    : "Select a topic from the syllabus to get a cached explanation and follow-up chat.";

  return (
    <main className="min-h-screen bg-background">
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
                  {topicTitle}
                </h1>

                <p className="mt-4 text-base font-medium text-blue-600 dark:text-blue-400 md:text-lg">
                  {moduleTitle}
                </p>

                <p className="mt-3 text-sm text-muted-foreground md:text-base">
                  {subject.toUpperCase()} • {branch.toUpperCase()} •{" "}
                  {semester.toUpperCase()}
                </p>

                <p className="mt-6 max-w-3xl text-sm text-muted-foreground md:text-base">
                  One cached explanation for every student. Ask follow-up
                  questions live — only your chat uses Gemini, not the topic
                  itself.
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
                  Pick a topic from the syllabus to open its AI workspace with
                  cached explanations and live follow-up chat.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="min-h-125 rounded-[2rem] border border-border bg-card p-4 shadow-sm md:p-6">
              <WorkspaceChatLoader
                key={topicId ?? "general"}
                subjectCode={subject.toUpperCase()}
                branch={branch}
                semester={semester}
                topicId={topicId}
                topicTitle={topicTitle || undefined}
                moduleTitle={moduleTitle || undefined}
                cachedExplanation={cachedExplanation}
                explanationCached={explanationCached}
                initialPrompts={isTopicMode ? followupPrompts : generalPrompts}
                welcomeMessage={welcomeMessage}
                apiEndpoint="/api/ai/workspace"
              />
            </div>

            {isTopicMode && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
                  <h3 className="text-sm font-bold text-foreground md:text-base">
                    Follow-up Ideas
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    The explanation above is cached once. Each question below
                    uses a live Gemini call.
                  </p>
                  <div className="mt-4 space-y-2.5">
                    {getFollowupPrompts(topicTitle).map((prompt) => (
                      <p
                        key={prompt}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-muted-foreground md:text-sm"
                      >
                        {prompt}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
