"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import WorkspaceMessage from "@/components/ai/workspace-message";
import ContinueExternalAI from "@/components/ai/continue-external-ai";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { FOLLOWUP_QUESTION_LIMIT, type WorkspaceResponse } from "@/types/ai";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface WorkspaceChatProps {
  subjectCode: string;
  branch?: string;
  semester?: string;
  topicId?: string;
  topicTitle?: string;
  moduleTitle?: string;
  cachedExplanation?: string;
  explanationCached?: boolean;
  initialPrompts?: Array<{
    prompt: string;
    topicId?: string;
    action?: string;
  }>;
  welcomeMessage?: string;
  inputPlaceholder?: string;
  apiEndpoint?: string;
  followupLimit?: number;
}

export default function WorkspaceChat({
  subjectCode,
  branch,
  semester,
  topicId,
  topicTitle,
  moduleTitle,
  cachedExplanation,
  explanationCached: initialExplanationCached,
  initialPrompts = [],
  welcomeMessage = "Ask me anything about your subject. I can help with explanations, examples, and exam preparation.",
  inputPlaceholder = "Type your question here...",
  apiEndpoint = API_ENDPOINTS.AI_WORKSPACE,
  followupLimit = FOLLOWUP_QUESTION_LIMIT,
}: WorkspaceChatProps) {
  const isTopicContextReady = Boolean(
    topicId && branch && semester && topicTitle && moduleTitle
  );

  const [topicExplanation, setTopicExplanation] = useState(
    cachedExplanation ?? ""
  );
  const [explanationCached, setExplanationCached] = useState(
    initialExplanationCached
  );
  const [explanationLoading, setExplanationLoading] = useState(false);

  const isFollowupMode = isTopicContextReady && Boolean(topicExplanation);

  const [messages, setMessages] = useState<Message[]>(() => {
    if (!cachedExplanation) return [];

    return [
      {
        id: "initial-cached-explanation",
        role: "assistant",
        content: cachedExplanation,
        timestamp: new Date(),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeExplanation =
    topicExplanation ||
    messages.find((m) => m.id === "initial-cached-explanation")?.content ||
    "";

  const followUpCount = messages.filter((m) => m.role === "user").length;
  const limitReached =
    isTopicContextReady &&
    followUpCount >= followupLimit &&
    !explanationLoading;
  const messageCount = messages.length;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageCount, limitReached, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const explanationRequestedRef = useRef(false);

  useEffect(() => {
    if (
      !isTopicContextReady ||
      topicExplanation ||
      cachedExplanation ||
      explanationRequestedRef.current
    ) {
      return;
    }

    explanationRequestedRef.current = true;
    let cancelled = false;

    const loadExplanation = async () => {
      setExplanationLoading(true);
      setError(null);

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch,
            semester,
            topicId,
            subjectCode,
            action: "EXPLAIN",
          }),
        });

        const data = (await response.json()) as WorkspaceResponse;

        if (cancelled) return;

        if (!response.ok || !data.answer) {
          throw new Error(data.error || "Failed to load topic explanation.");
        }

        setTopicExplanation(data.answer);
        setExplanationCached(data.cached);
        setMessages([
          {
            id: "initial-cached-explanation",
            role: "assistant",
            content: data.answer,
            timestamp: new Date(),
          },
        ]);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load topic explanation."
          );
        }
      } finally {
        if (!cancelled) {
          setExplanationLoading(false);
        }
      }
    };

    void loadExplanation();

    return () => {
      cancelled = true;
    };
  }, [
    apiEndpoint,
    branch,
    cachedExplanation,
    isTopicContextReady,
    semester,
    subjectCode,
    topicExplanation,
    topicId,
  ]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || limitReached) return;

    if (isTopicContextReady && !activeExplanation) {
      setError("Topic explanation is still loading. Please wait.");
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const priorMessages = messages;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    if (loading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const conversationHistory = priorMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isTopicContextReady
            ? {
                question: content.trim(),
                subjectCode,
                branch,
                semester,
                topicId,
                topic: topicTitle,
                module: moduleTitle,
                messages: conversationHistory,
              }
            : {
                question: content.trim(),
                subjectCode,
                topicId,
                messages: conversationHistory,
              }
        ),
        signal: abortController.signal,
      });

      const data = (await response.json()) as WorkspaceResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          data.answer || "I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      const isDemoMode =
        err instanceof Error && err.message.includes("Failed to fetch");

      if (isDemoMode && !isFollowupMode) {
        const demoMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `**Demo Mode Fallback Answer:**\n\nI see you're asking about **${content}**. Since the backend API is currently unavailable (missing environment variables), I am providing a simulated response.\n\nIn a production environment, I would analyze your question against the ${subjectCode.toUpperCase()} syllabus and provide a detailed, accurate explanation with examples.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, demoMessage]);
        setError(null);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading && !limitReached) {
      sendMessage(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const followupPlaceholder = isFollowupMode
    ? `Ask a follow-up about ${topicTitle}...`
    : inputPlaceholder;

  const conversationForExport = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const progressPercent = Math.min((followUpCount / followupLimit) * 100, 100);

  const followupStatusLabel = limitReached
    ? `${followupLimit} / ${followupLimit} Completed`
    : `${followUpCount} / ${followupLimit}`;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card/50 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Hyper AI Workspace</h3>
          <p className="text-xs text-muted-foreground">
            {isFollowupMode
              ? topicTitle
              : `Ask questions about ${subjectCode.toUpperCase()}`}
          </p>
        </div>
      </div>

      {isTopicContextReady && (
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-foreground">
              Follow-up Questions
            </p>
            <p
              className={`shrink-0 text-xs font-medium ${
                limitReached
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground"
              }`}
            >
              {followupStatusLabel}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted sm:h-2">
            <motion.div
              className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4">
        {!isTopicContextReady && messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-blue-500/10 p-4">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Welcome to Hyper AI Workspace
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {welcomeMessage}
            </p>

            {initialPrompts.length > 0 && (
              <div className="mt-6 w-full max-w-xl space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Suggested Questions:
                </p>
                {initialPrompts.map((item, index) => {
                  const promptText =
                    item.prompt || `Ask about ${item.topicId || "this topic"}`;

                  return (
                    <button
                      key={index}
                      onClick={() => sendMessage(promptText)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-blue-500/20 hover:bg-blue-500/5 hover:text-foreground"
                    >
                      <Sparkles className="h-4 w-4 flex-shrink-0 text-blue-500/60" />
                      {promptText}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {isTopicContextReady && explanationCached !== undefined && (
              <p className="text-center text-[10px] text-muted-foreground">
                {explanationLoading
                  ? "Loading topic explanation..."
                  : explanationCached
                    ? "Topic explanation loaded from cache"
                    : "Topic explanation freshly generated"}
              </p>
            )}

            {explanationLoading && messages.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index === messages.length - 1 ? 0 : 0.05,
                  }}
                >
                  <WorkspaceMessage
                    answer={message.content}
                    role={message.role}
                    timestamp={message.timestamp}
                  />
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md border border-border bg-muted/30 px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isFollowupMode &&
              !limitReached &&
              !explanationLoading &&
              initialPrompts.length > 0 && (
                <div className="rounded-2xl border border-border bg-muted/20 p-3 sm:p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Suggested follow-ups:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {initialPrompts.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => sendMessage(item.prompt)}
                        disabled={loading || limitReached}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition hover:border-blue-500/30 hover:bg-blue-500/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {item.prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-3 sm:p-4 md:p-6">
        {limitReached && activeExplanation ? (
          <ContinueExternalAI
            subjectCode={subjectCode}
            topic={topicTitle!}
            module={moduleTitle!}
            cachedExplanation={activeExplanation}
            messages={conversationForExport}
          />
        ) : !isTopicContextReady ? (
          <p className="text-center text-sm text-muted-foreground">
            Select a topic from the syllabus to start follow-up chat.
          </p>
        ) : explanationLoading ? (
          <p className="text-center text-sm text-muted-foreground">
            Loading topic explanation...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <label htmlFor="chat-input" className="sr-only">
                Type your question here
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={followupPlaceholder}
                rows={1}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 sm:px-4"
                disabled={loading || explanationLoading || !activeExplanation}
              />
              <button
                type="submit"
                disabled={
                  !input.trim() ||
                  loading ||
                  explanationLoading ||
                  !activeExplanation
                }
                className="absolute bottom-2 right-2 rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        )}

        {!limitReached && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {isFollowupMode
              ? "Follow-up answers are live and not cached."
              : "Hyper AI may generate educational content. Please verify important information."}
          </p>
        )}
      </div>
    </div>
  );
}
