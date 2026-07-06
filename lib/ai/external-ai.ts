export type ExternalAIProvider =
  | "chatgpt"
  | "gemini"
  | "claude"
  | "deepseek"
  | "grok";

export const EXTERNAL_AI_URLS: Record<ExternalAIProvider, string> = {
  chatgpt: "https://chatgpt.com/",
  gemini: "https://gemini.google.com/app",
  claude: "https://claude.ai/new",
  deepseek: "https://chat.deepseek.com/",
  grok: "https://grok.com/",
};

export const EXTERNAL_AI_LABELS: Record<ExternalAIProvider, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
  grok: "Grok",
};

export const EXTERNAL_AI_SHORT_LABELS: Record<ExternalAIProvider, string> = {
  chatgpt: "GPT",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
  grok: "Grok",
};

export const EXTERNAL_AI_OPEN_DELAY_MS = 400;

export function getExternalAISuccessToast(provider: ExternalAIProvider) {
  const label = EXTERNAL_AI_LABELS[provider];

  return {
    title: "Conversation copied",
    description: `A new ${label} tab is opening.\nPaste with Ctrl + V to continue.`,
  };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function openExternalAI(
  provider: ExternalAIProvider,
  delayMs = 0
): void {
  const url = EXTERNAL_AI_URLS[provider];

  if (delayMs <= 0) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  window.setTimeout(() => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, delayMs);
}

export async function continueWithExternalAI(
  provider: ExternalAIProvider,
  prompt: string
): Promise<{ copied: boolean }> {
  const copied = await copyToClipboard(prompt);
  openExternalAI(provider);
  return { copied };
}
