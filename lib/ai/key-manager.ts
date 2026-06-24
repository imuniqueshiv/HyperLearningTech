const GEMINI_KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
].filter(Boolean) as string[];

export function getGeminiKeys(): string[] {
  return GEMINI_KEYS;
}

export function getPrimaryKey(): string {
  if (GEMINI_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  return GEMINI_KEYS[0];
}
