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
    ? `Your **${topicTitle}** explanation is ready below. Ask up to 3 follow-up questions.`
    : "Select a topic from the syllabus to get a cached explanation and follow-up chat.";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col px-4 sm:px-4 lg:px-6">
        <div className="min-h-0 flex-1">
          <WorkspaceChatLoader
            key={topicId ?? "general"}
            subjectCode={subject.toUpperCase()}
            branch={branch}
            semester={semester}
            topicId={topicId}
            topicTitle={topicTitle || undefined}
            moduleTitle={moduleTitle || undefined}
            contextLabel={`${subject.toUpperCase()} • ${branch.toUpperCase()} • ${semester.toUpperCase()}`}
            cachedExplanation={cachedExplanation}
            explanationCached={explanationCached}
            initialPrompts={isTopicMode ? followupPrompts : generalPrompts}
            welcomeMessage={welcomeMessage}
            apiEndpoint="/api/ai/workspace"
          />
        </div>
      </div>
    </div>
  );
}
