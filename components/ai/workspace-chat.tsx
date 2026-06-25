"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import WorkspaceMessage from "@/components/ai/workspace-message";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface WorkspaceChatProps {
  subjectCode: string;
  initialPrompts?: Array<{
    prompt: string;
    topic?: string;
    module?: string;
    action?: string;
  }>;
  welcomeMessage?: string;
  inputPlaceholder?: string;
  apiEndpoint?: string;
  topic?: string;
  module?: string;
}

export default function WorkspaceChat({
  subjectCode,
  initialPrompts = [],
  welcomeMessage = "Ask me anything about your subject. I can help with explanations, examples, and exam preparation.",
  inputPlaceholder = "Type your question here...",
  apiEndpoint = "/api/ai/workspace",
  topic,
  module,
}: WorkspaceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send message to API
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: content.trim(),
          subjectCode,
          topic,
          module,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

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

      // Set related topics from AI
      if (data.relatedTopics && data.relatedTopics.length > 0) {
        setRelatedTopics(data.relatedTopics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  //   const handlePromptClick = (prompt: string, topic?: string, module?: string, action?: string) => {
  //     // Build the full prompt based on action
  //     let fullPrompt = prompt;

  //     if (action === "explain" && topic) {
  //       fullPrompt = `Explain ${topic} in detail`;
  //     } else if (action === "generate" && topic) {
  //       fullPrompt = `Generate 5 mark answer on ${topic}`;
  //     } else if (action === "summarize" && topic) {
  //       fullPrompt = `Create revision sheet for ${topic}`;
  //     } else if (prompt) {
  //       fullPrompt = prompt;
  //     }

  //     sendMessage(fullPrompt);
  //   };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendMessage(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card/50 backdrop-blur-xl">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Hyper AI Workspace</h3>
          <p className="text-xs text-muted-foreground">
            Ask questions about {subjectCode.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
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
                    item.prompt || `Ask about ${item.topic || "this topic"}`;

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
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
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
        )}

        {/* Related Topics - Display when available */}
        {relatedTopics.length > 0 && messages.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Related Topics to Explore:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedTopics.map((topicName, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(`Explain ${topicName} in detail`)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition hover:border-blue-500/30 hover:bg-blue-500/5"
                >
                  {topicName}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 md:p-6">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              rows={1}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute bottom-2 right-2 rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Hyper AI may generate educational content. Please verify important
          information.
        </p>
      </div>
    </div>
  );
}
