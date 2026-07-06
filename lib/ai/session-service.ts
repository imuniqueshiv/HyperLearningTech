import type {
  ChatMessage,
  LearningSession,
  StoredChatMessage,
} from "@/types/ai";

export const SESSION_KEY_PREFIX = "hyper-ai:";
export const SESSION_INDEX_KEY = "hyper-ai:__index__";
export const SESSION_MAX_COUNT = 100;
export const SESSION_EXPIRY_DAYS = 30;

interface SessionIndexEntry {
  topicId: string;
  updatedAt: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function buildSessionKey(topicId: string): string {
  return `${SESSION_KEY_PREFIX}${topicId}`;
}

function readIndex(): SessionIndexEntry[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(SESSION_INDEX_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SessionIndexEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: SessionIndexEntry[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(entries));
}

function removeSessionKey(topicId: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(buildSessionKey(topicId));
}

function enforceMaxSessions(index: SessionIndexEntry[]): SessionIndexEntry[] {
  const sorted = [...index].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );

  while (sorted.length > SESSION_MAX_COUNT) {
    const oldest = sorted.shift();
    if (oldest) {
      removeSessionKey(oldest.topicId);
    }
  }

  return sorted;
}

export function cleanupExpiredSessions(): void {
  if (!isBrowser()) return;

  const cutoff = Date.now() - SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const index = readIndex();
  const kept: SessionIndexEntry[] = [];

  for (const entry of index) {
    if (new Date(entry.updatedAt).getTime() < cutoff) {
      removeSessionKey(entry.topicId);
    } else {
      kept.push(entry);
    }
  }

  writeIndex(kept);
}

export function loadSession(topicId: string): LearningSession | null {
  if (!isBrowser() || !topicId) return null;

  cleanupExpiredSessions();

  try {
    const raw = localStorage.getItem(buildSessionKey(topicId));
    if (!raw) return null;

    const session = JSON.parse(raw) as LearningSession;

    if (
      !session?.topicId ||
      !session.cachedExplanation ||
      !Array.isArray(session.messages)
    ) {
      return null;
    }

    const cutoff = Date.now() - SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (new Date(session.updatedAt).getTime() < cutoff) {
      deleteSession(topicId);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: LearningSession): void {
  if (!isBrowser() || !session.topicId) return;

  cleanupExpiredSessions();

  const updatedAt = session.updatedAt || new Date().toISOString();
  const payload: LearningSession = {
    ...session,
    updatedAt,
    questionCount: session.messages.filter((m) => m.role === "user").length,
  };

  localStorage.setItem(
    buildSessionKey(session.topicId),
    JSON.stringify(payload)
  );

  const index = readIndex().filter(
    (entry) => entry.topicId !== session.topicId
  );
  index.push({ topicId: session.topicId, updatedAt });
  writeIndex(enforceMaxSessions(index));
}

export function deleteSession(topicId: string): void {
  if (!isBrowser() || !topicId) return;

  removeSessionKey(topicId);
  writeIndex(readIndex().filter((entry) => entry.topicId !== topicId));
}

export function sessionMatchesContext(
  session: LearningSession,
  context: {
    branch: string;
    semester: string;
    subjectCode: string;
  }
): boolean {
  return (
    session.branch === context.branch &&
    session.semester === context.semester &&
    session.subjectCode === context.subjectCode
  );
}

export function toStoredMessages(
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>
): StoredChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.toISOString(),
  }));
}

export function fromStoredMessages(messages: StoredChatMessage[]): Array<{
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}> {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: new Date(message.timestamp),
  }));
}

export function toChatMessages(messages: StoredChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export interface LastStudiedLabel {
  prefix: string;
  detail: string;
}

export function formatLastStudied(updatedAt: string): LastStudiedLabel {
  const date = new Date(updatedAt);
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const timeDetail = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (dayDiff === 0) {
    return { prefix: "Today", detail: timeDetail };
  }

  if (dayDiff === 1) {
    return { prefix: "Yesterday", detail: timeDetail };
  }

  if (dayDiff < 14) {
    return { prefix: `${dayDiff} days ago`, detail: "" };
  }

  const weeks = Math.floor(dayDiff / 7);
  if (weeks < 8) {
    return {
      prefix: `${weeks} week${weeks === 1 ? "" : "s"} ago`,
      detail: "",
    };
  }

  return {
    prefix: date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    detail: "",
  };
}

export function formatContinueLearningLabel(updatedAt: string): string {
  const { prefix } = formatLastStudied(updatedAt);

  if (prefix === "Today") return "earlier today";
  if (prefix === "Yesterday") return "yesterday";

  return prefix.toLowerCase();
}
