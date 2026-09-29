/**
 * Phase 2: Detect likely OCR digit/character confusion without auto-correcting.
 * Ambiguous tokens → REVIEW_REQUIRED only.
 */

const CONFUSION_GROUPS: string[][] = [
  ["0", "O", "o"],
  ["1", "I", "l", "|"],
  ["5", "S", "s"],
  ["8", "B"],
  ["x", "×", "X"],
  ["-", "−", "—", "–"],
  ["2", "²"],
  [".", ","],
];

export interface OcrConfusionHit {
  token: string;
  peers: string[];
  reason: string;
}

/**
 * Returns confusion hits when a token could plausibly be misread as another
 * high-risk academic token present in the same evidence set.
 */
export function detectOcrConfusion(
  tokens: string[],
  evidenceTokens: string[]
): OcrConfusionHit[] {
  const hits: OcrConfusionHit[] = [];
  const evidence = new Set(evidenceTokens.map((t) => t.trim()).filter(Boolean));

  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) continue;
    const variants = generateConfusionVariants(token);
    const peers = variants.filter((v) => v !== token && evidence.has(v));
    if (peers.length > 0) {
      hits.push({
        token,
        peers,
        reason: "OCR_CONFUSION_AMBIGUOUS",
      });
    }
  }

  return hits;
}

/**
 * Flags AI tokens that differ from evidence only by known OCR confusion pairs
 * (e.g. evidence "16", AI "l6" or "18" with digit swap against similar forms).
 * Does NOT rewrite content.
 */
export function findSuspiciousNumericEdits(
  evidenceTokens: string[],
  aiTokens: string[]
): string[] {
  const warnings: string[] = [];
  const evidenceNorm = new Set(
    evidenceTokens.map((t) => t.replace(/\s+/g, "").toLowerCase())
  );
  const aiNorm = aiTokens.map((t) => t.replace(/\s+/g, "").toLowerCase());

  for (const ai of aiNorm) {
    if (!ai || evidenceNorm.has(ai)) continue;
    // Exact digit replacement of a single confusing character against evidence
    for (const ev of evidenceNorm) {
      if (editDistanceOneConfusion(ev, ai)) {
        warnings.push(`OCR_CONFUSION_SUSPECT:${ev}->${ai}`);
      }
    }
  }

  return warnings;
}

function generateConfusionVariants(token: string): string[] {
  const variants = new Set<string>([token]);
  for (let i = 0; i < token.length; i += 1) {
    const ch = token[i];
    const group = CONFUSION_GROUPS.find((g) => g.includes(ch));
    if (!group) continue;
    for (const alt of group) {
      if (alt === ch) continue;
      variants.add(token.slice(0, i) + alt + token.slice(i + 1));
    }
  }
  return [...variants];
}

function editDistanceOneConfusion(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diffs = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === b[i]) continue;
    diffs += 1;
    if (diffs > 1) return false;
    const group = CONFUSION_GROUPS.find(
      (g) =>
        g.map((x) => x.toLowerCase()).includes(a[i].toLowerCase()) &&
        g.map((x) => x.toLowerCase()).includes(b[i].toLowerCase())
    );
    if (!group) return false;
  }
  return diffs === 1;
}
