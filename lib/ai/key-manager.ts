const PYQ_KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
].filter(Boolean) as string[];

const WORKSPACE_KEYS = [
  process.env.GEMINI_WORKSPACE_KEY_1,
  process.env.GEMINI_WORKSPACE_KEY_2,
  process.env.GEMINI_WORKSPACE_KEY_3,
  process.env.GEMINI_WORKSPACE_KEY_4,
  process.env.GEMINI_WORKSPACE_KEY_5,
].filter(Boolean) as string[];

export function getGeminiKeys(): string[] {
  return PYQ_KEYS;
}

export function getWorkspaceKeys(): string[] {
  return WORKSPACE_KEYS;
}

export function getPrimaryKey(): string {
  if (PYQ_KEYS.length === 0) {
    throw new Error("No PYQ Gemini API keys configured");
  }

  return PYQ_KEYS[0];
}

export function getWorkspaceKey(): string {
  if (WORKSPACE_KEYS.length === 0) {
    throw new Error("No Workspace Gemini API keys configured");
  }

  return WORKSPACE_KEYS[0];
}