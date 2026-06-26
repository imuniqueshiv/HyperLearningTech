// components/ai/workspace-message.tsx

"use client";

import { User, Sparkles } from "lucide-react";
import AnswerViewer from "@/components/ai/answer-viewer";

interface WorkspaceMessageProps {
  answer: string;
  role: "user" | "assistant";
  timestamp?: Date;
}

export default function WorkspaceMessage({
  answer,
  role,
  timestamp,
}: WorkspaceMessageProps) {
  const isUser = role === "user";
  const safeAnswer = answer || "No content available.";

  return (
    <div
      className={`flex items-start gap-4 px-4 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-muted/80" : "bg-blue-500/10"
        }`}
      >
        {isUser ? (
          <User className="h-4.5 w-4.5 text-foreground/60" />
        ) : (
          <Sparkles className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl ${
          isUser
            ? "bg-muted/60 px-5 py-3.5"
            : "border border-border bg-card/30 px-5 py-3.5"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed text-foreground">
            {safeAnswer}
          </p>
        ) : (
          <AnswerViewer answer={safeAnswer} />
        )}
        {timestamp && (
          <p className="mt-1.5 text-right text-[10px] text-muted-foreground/70">
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
