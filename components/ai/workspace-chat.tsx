"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  X,
  Home,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import WorkspaceMessage from "@/components/ai/workspace-message";
import ContinueExternalAI from "@/components/ai/continue-external-ai";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import {
  formatLastStudied,
  fromStoredMessages,
  loadSession,
  saveSession,
  sessionMatchesContext,
  toStoredMessages,
} from "@/lib/ai/session-service";
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
  contextLabel?: string;
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

function buildInitialExplanationMessage(content: string): Message {
  return {
    id: "initial-cached-explanation",
    role: "assistant",
    content,
    timestamp: new Date(),
  };
}

interface WorkspaceInitialState {
  topicExplanation: string;
  messages: Message[];
  lastStudiedAt: string | null;
  sessionSaved: boolean;
  skipPersist: boolean;
  explanationRequested: boolean;
}

function getWorkspaceInitialState(params: {
  topicId?: string;
  branch?: string;
  semester?: string;
  subjectCode: string;
  cachedExplanation?: string;
}): WorkspaceInitialState {
  const empty: WorkspaceInitialState = {
    topicExplanation: "",
    messages: [],
    lastStudiedAt: null,
    sessionSaved: false,
    skipPersist: false,
    explanationRequested: false,
  };

  const { topicId, branch, semester, subjectCode, cachedExplanation } = params;

  if (!topicId || !branch || !semester) {
    return empty;
  }

  const session = loadSession(topicId);

  if (
    session &&
    sessionMatchesContext(session, { branch, semester, subjectCode })
  ) {
    return {
      topicExplanation: session.cachedExplanation,
      messages: fromStoredMessages(session.messages),
      lastStudiedAt: session.updatedAt,
      sessionSaved: true,
      skipPersist: true,
      explanationRequested: true,
    };
  }

  if (cachedExplanation) {
    return {
      ...empty,
      topicExplanation: cachedExplanation,
      messages: [buildInitialExplanationMessage(cachedExplanation)],
      explanationRequested: true,
    };
  }

  return empty;
}

export default function WorkspaceChat({
  subjectCode,
  branch,
  semester,
  topicId,
  topicTitle,
  moduleTitle,
  contextLabel,
  cachedExplanation,
  initialPrompts = [],
  welcomeMessage = "Ask me anything about your subject. I can help with explanations, examples, and exam preparation.",
  inputPlaceholder = "Type your question here...",
  apiEndpoint = API_ENDPOINTS.AI_WORKSPACE,
  followupLimit = FOLLOWUP_QUESTION_LIMIT,
}: WorkspaceChatProps) {
  const isTopicContextReady = Boolean(
    topicId && branch && semester && topicTitle && moduleTitle
  );

  const [initialWorkspace] = useState(() =>
    getWorkspaceInitialState({
      topicId,
      branch,
      semester,
      subjectCode,
      cachedExplanation,
    })
  );

  const [topicExplanation, setTopicExplanation] = useState(
    initialWorkspace.topicExplanation
  );
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(
    initialWorkspace.messages
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastStudiedAt, setLastStudiedAt] = useState<string | null>(
    initialWorkspace.lastStudiedAt
  );
  const [sessionSaved, setSessionSaved] = useState(
    initialWorkspace.sessionSaved
  );
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const explanationRequestedRef = useRef(initialWorkspace.explanationRequested);
  const skipPersistRef = useRef(initialWorkspace.skipPersist);

  const isFollowupMode = isTopicContextReady && Boolean(topicExplanation);

  const activeExplanation =
    topicExplanation ||
    messages.find((m) => m.id === "initial-cached-explanation")?.content ||
    "";

  const followUpCount = messages.filter((m) => m.role === "user").length;
  const limitReached =
    isTopicContextReady &&
    followUpCount >= followupLimit &&
    !explanationLoading;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (
      !isTopicContextReady ||
      topicExplanation ||
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
        setMessages([buildInitialExplanationMessage(data.answer)]);
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
    isTopicContextReady,
    semester,
    subjectCode,
    topicExplanation,
    topicId,
  ]);

  useEffect(() => {
    if (
      !isTopicContextReady ||
      !topicId ||
      !branch ||
      !semester ||
      !activeExplanation
    ) {
      return;
    }

    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    const now = new Date().toISOString();

    saveSession({
      topicId,
      branch,
      semester,
      subjectCode,
      cachedExplanation: activeExplanation,
      messages: toStoredMessages(messages),
      questionCount: followUpCount,
      updatedAt: now,
    });

    setLastStudiedAt(now);
    setSessionSaved(true);
  }, [
    activeExplanation,
    branch,
    followUpCount,
    isTopicContextReady,
    messages,
    semester,
    subjectCode,
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

  const lastStudied = lastStudiedAt ? formatLastStudied(lastStudiedAt) : null;
  const explanationMessage =
    messages.find((message) => message.id === "initial-cached-explanation") ??
    null;
  const conversationMessages = messages.filter(
    (message) => message.id !== "initial-cached-explanation"
  );
  const breadcrumbSegments = [
    { label: "RGPV", href: "/rgpv" },
    ...(branch
      ? [{ label: branch.replace(/-/g, " "), href: `/rgpv/${branch}` }]
      : []),
    ...(branch && semester
      ? [
          {
            label: semester.replace(/-/g, " "),
            href: `/rgpv/${branch}/${semester}`,
          },
        ]
      : []),
    ...(branch && semester && subjectCode
      ? [
          {
            label: subjectCode,
            href: `/rgpv/${branch}/${semester}/${subjectCode.toLowerCase()}`,
          },
        ]
      : []),
    { label: "AI", href: "#" },
  ];

  return (
    <div
      className={`grid h-full min-h-0 grid-cols-1 transition-[grid-template-columns] duration-300 ease-out ${
        sidebarCollapsed
          ? "md:grid-cols-[52px_minmax(0,1fr)]"
          : "md:grid-cols-[280px_minmax(0,1fr)]"
      }`}
    >
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40 md:hidden"
              aria-label="Close sidebar overlay"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-40 w-[85vw] max-w-[320px] border-r border-border bg-card p-4 md:hidden"
            >
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
                aria-label="Close workspace sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
              <SidebarDetails />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden min-h-0 border-r border-border bg-card/40 md:block">
        <div className="flex h-full min-h-0 flex-col overflow-hidden p-2">
          {!sidebarCollapsed && (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-1">
              <h3 className="text-sm font-semibold text-foreground">
                Hyper AI Workspace
              </h3>
              <SidebarDetails />
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 flex-col overflow-hidden">
        <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-2.5 py-2 backdrop-blur sm:px-4">
          <nav aria-label="workspace breadcrumb" className="min-w-0">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="inline-flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Home"
                >
                  <Home className="h-3.5 w-3.5" />
                </Link>
              </li>
              {breadcrumbSegments.map((segment, index) => {
                const isLast = index === breadcrumbSegments.length - 1;
                return (
                  <li
                    key={`${segment.label}-${index}`}
                    className="inline-flex items-center gap-1"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    {isLast || segment.href === "#" ? (
                      <span className="font-medium text-foreground">
                        {segment.label.toUpperCase()}
                      </span>
                    ) : (
                      <Link
                        href={segment.href}
                        className="hover:text-foreground"
                      >
                        {segment.label.toUpperCase()}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <div className="sticky top-[33px] z-20 border-b border-border bg-background/95 px-2.5 py-1.5 backdrop-blur sm:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground md:hidden"
            aria-label="Open workspace sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground md:inline-flex"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2 sm:px-4">
          {!isTopicContextReady && messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 rounded-full bg-blue-500/10 p-4">
                <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Welcome to Hyper AI Workspace
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {welcomeMessage}
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {explanationLoading && !explanationMessage && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              )}

              {explanationMessage && (
                <WorkspaceMessage
                  answer={explanationMessage.content}
                  role={explanationMessage.role}
                  timestamp={explanationMessage.timestamp}
                />
              )}

              <AnimatePresence initial={false}>
                {conversationMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay:
                        index === conversationMessages.length - 1 ? 0 : 0.05,
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

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-background/95 p-2.5 backdrop-blur sm:p-3">
          {isFollowupMode &&
            !limitReached &&
            !explanationLoading &&
            initialPrompts.length > 0 && (
              <div className="mb-2 border-b border-border pb-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Suggested Follow-ups
                  </p>
                  <button
                    type="button"
                    onClick={() => setSuggestionsCollapsed((prev) => !prev)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:border-blue-500/30 hover:text-foreground"
                    aria-label={
                      suggestionsCollapsed
                        ? "Expand suggested follow-ups"
                        : "Collapse suggested follow-ups"
                    }
                  >
                    {suggestionsCollapsed ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {!suggestionsCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2">
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

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
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
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
        </div>
      </div>
    </div>
  );

  function SidebarDetails() {
    return (
      <div className="space-y-4">
        {sessionSaved && isTopicContextReady && (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Saved locally
          </span>
        )}

        <div className="space-y-1.5 border-t border-border pt-3">
          {topicTitle ? (
            <p className="line-clamp-3 text-sm font-medium text-foreground">
              {topicTitle}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No topic selected</p>
          )}
          {moduleTitle ? (
            <p className="line-clamp-2 text-xs text-blue-600 dark:text-blue-400">
              {moduleTitle}
            </p>
          ) : null}
          {contextLabel ? (
            <p className="text-[11px] text-muted-foreground">{contextLabel}</p>
          ) : null}
        </div>

        {isTopicContextReady && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-[11px] text-muted-foreground">
              Progress{" "}
              <span className="font-medium text-foreground">
                {followupStatusLabel}
              </span>
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            {lastStudied && (
              <p className="text-[11px] text-muted-foreground">
                Last studied{" "}
                <span className="font-medium text-foreground">
                  {lastStudied.prefix}
                  {lastStudied.detail ? ` · ${lastStudied.detail}` : ""}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
}
