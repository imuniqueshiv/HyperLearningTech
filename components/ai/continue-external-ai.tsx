"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";

import {
  EXTERNAL_AI_BRAND_COLORS,
  EXTERNAL_AI_LOGOS,
} from "@/components/ai/external-ai-logos";
import { buildExternalAIPrompt } from "@/lib/ai/external-ai-prompt-builder";
import {
  copyToClipboard,
  EXTERNAL_AI_OPEN_DELAY_MS,
  EXTERNAL_AI_SHORT_LABELS,
  getExternalAISuccessToast,
  openExternalAI,
  type ExternalAIProvider,
} from "@/lib/ai/external-ai";
import { getSubjectInfo } from "@/lib/ai/subject-map";
import type { ChatMessage } from "@/types/ai";

interface ContinueExternalAIProps {
  subjectCode: string;
  topic: string;
  module: string;
  cachedExplanation: string;
  messages: ChatMessage[];
}

const PROVIDERS: ExternalAIProvider[] = [
  "chatgpt",
  "gemini",
  "claude",
  "deepseek",
  "grok",
];

export default function ContinueExternalAI({
  subjectCode,
  topic,
  module,
  cachedExplanation,
  messages,
}: ContinueExternalAIProps) {
  const subject = getSubjectInfo(subjectCode);

  const prompt = buildExternalAIPrompt({
    subjectName: subject.name,
    subjectCode,
    module,
    topic,
    cachedExplanation,
    messages,
  });

  const handleContinue = async (provider: ExternalAIProvider) => {
    const copied = await copyToClipboard(prompt);

    if (copied) {
      const { title, description } = getExternalAISuccessToast(provider);

      toast.success(title, {
        description,
        duration: 5000,
      });

      openExternalAI(provider, EXTERNAL_AI_OPEN_DELAY_MS);
    } else {
      toast.error("Could not copy conversation", {
        description: "Please copy the conversation manually.",
        duration: 5000,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">
          You&apos;ve reached the free follow-up limit.
        </p>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Continue in another AI.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-center gap-4 sm:gap-5">
        {PROVIDERS.map((provider) => {
          const Logo = EXTERNAL_AI_LOGOS[provider];
          const brandColor = EXTERNAL_AI_BRAND_COLORS[provider];
          const shortLabel = EXTERNAL_AI_SHORT_LABELS[provider];

          return (
            <button
              key={provider}
              type="button"
              onClick={() => handleContinue(provider)}
              aria-label={`Continue in ${shortLabel}`}
              className="group flex w-14 flex-col items-center gap-1.5 sm:w-12"
            >
              <span
                className="
                  flex h-12 w-12 items-center justify-center
                  rounded-full border border-border bg-background
                  transition-all duration-200
                  hover:scale-110 hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-sm
                  active:scale-95
                "
              >
                <Logo
                  size={22}
                  className={`transition-transform group-hover:scale-105 ${brandColor}`}
                />
              </span>
              <span className="max-w-14 truncate text-[10px] font-medium text-muted-foreground group-hover:text-foreground sm:text-[11px]">
                {shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
