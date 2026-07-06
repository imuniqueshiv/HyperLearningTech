import { Loader2, Sparkles } from "lucide-react";

interface WorkspaceChatSkeletonProps {
  topicTitle?: string;
}

export default function WorkspaceChatSkeleton({
  topicTitle,
}: WorkspaceChatSkeletonProps) {
  return (
    <div className="flex h-full min-h-[28rem] flex-col rounded-2xl border border-border bg-card/50 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Hyper AI Workspace</h3>
          <p className="text-xs text-muted-foreground">
            {topicTitle ?? "Loading workspace..."}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-muted-foreground">Loading AI workspace...</p>
      </div>
    </div>
  );
}
