/**
 * Light normalization for PYQ question text before Markdown + KaTeX rendering.
 * Does not rewrite authentic wording — only delimiter/escaping artifacts that
 * prevent math from typesetting.
 */

export function normalizePyqMathText(text: string): string {
  let result = text.replace(/\r\n/g, "\n");

  // Common alternate delimiters → remark-math delimiters.
  // Use a replacer function: in string replacements "$$" means a single "$".
  result = result.replace(/\\\[/g, () => "$$").replace(/\\\]/g, () => "$$");
  result = result.replace(/\\\(/g, "$").replace(/\\\)/g, "$");

  // Extraction artifact: `${q0, q1}$` instead of `$\{q0, q1\}$`
  result = result.replace(/\$\{([^{}$\\]+)\}\$/g, "$\\{$1\\}$");

  // Assignment to a set of identifiers: ={q0, q1} → =\{q0, q1\}
  // Avoid touching already-escaped \{ or LaTeX command arguments.
  result = result.replace(
    /(^|[^\\])=\s*\{([A-Za-z]\w*(?:\s*,\s*[A-Za-z]\w*)*)\}/g,
    "$1=\\{$2\\}"
  );

  // Keep display math on its own block for reliable KaTeX rendering
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, expr: string) => {
    return `\n\n$$${expr.trim()}$$\n\n`;
  });

  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

/**
 * Compose the markdown source for a sub-question.
 * Appends the optional `latex` field only when it carries display math / environments
 * that are not already present in `text` (e.g. Banker's algorithm tables).
 */
export function composePyqQuestionMarkdown(
  text: string,
  latex?: string | null
): string {
  const body = normalizePyqMathText(text);
  const latexTrim = (latex ?? "").trim();
  if (!latexTrim) return body;

  const hasDisplayOrEnv = /\$\$/.test(latexTrim) || /\\begin\{/.test(latexTrim);
  if (!hasDisplayOrEnv) return body;

  if (/\\begin\{/.test(body) && /\\begin\{/.test(latexTrim)) {
    return body;
  }

  const block = latexTrim.startsWith("$$") ? latexTrim : `$$\n${latexTrim}\n$$`;

  return `${body}\n\n${block}`;
}

/**
 * Split long question bodies on roman-numeral subparts (i) ii) …), same as the
 * previous paper-page helper, so layout stays consistent.
 */
export function splitQuestionText(text: string): string[] {
  const romanPattern = "(?:viii|vii|vi|iv|ix|iii|ii|i|v|x)";
  const regex = new RegExp(`\\s(${romanPattern})\\)\\s`, "g");

  const matchIndices: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matchIndices.push(match.index + 1);
  }

  if (matchIndices.length === 0) {
    return [text];
  }

  const lines: string[] = [];
  const intro = text.slice(0, matchIndices[0]).trim();
  if (intro) lines.push(intro);

  for (let i = 0; i < matchIndices.length; i++) {
    const start = matchIndices[i];
    const end = i + 1 < matchIndices.length ? matchIndices[i + 1] : text.length;
    lines.push(text.slice(start, end).trim());
  }

  return lines;
}
