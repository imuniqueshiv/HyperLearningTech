// components/ai/workspace-message.tsx

"use client";

import { useSyncExternalStore } from "react";
import { User, Sparkles } from "lucide-react";
import AnswerViewer from "@/components/ai/answer-viewer";

interface WorkspaceMessageProps {
  answer: string;
  role: "user" | "assistant";
  timestamp?: Date;
}

function formatTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function useClientTimeLabel(timestamp: Date): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => formatTime(timestamp),
    () => null
  );
}

function MessageTimestamp({ timestamp }: { timestamp: Date }) {
  const timeLabel = useClientTimeLabel(timestamp);

  if (!timeLabel) {
    return null;
  }

  return (
    <p className="mt-1 text-right text-[10px] text-muted-foreground">
      {timeLabel}
    </p>
  );
}

export default function WorkspaceMessage({
  answer,
  role,
  timestamp,
}: WorkspaceMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-muted" : "bg-blue-500/10"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-foreground/70" />
        ) : (
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
      </div>

      <div
        className={`max-w-[94%] sm:max-w-[92%] rounded-2xl px-3 py-3 sm:px-4 ${
          isUser
            ? "bg-muted/50 text-foreground"
            : "border border-border bg-card/50"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{answer}</p>
        ) : (
          <AnswerViewer answer={answer} />
        )}
        {timestamp ? <MessageTimestamp timestamp={timestamp} /> : null}
      </div>
    </div>
  );
}
