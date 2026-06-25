import { PromptContext } from "@/types/ai";

/**
 * Subject-specific instructions.
 *
 * MATH is tuned differently from the rest: the goal is to push the model
 * toward showing the actual calculation (formula → substitution → number)
 * instead of writing paragraphs of theory around it. Explanatory sentences
 * are kept to a label per step, not a lecture.
 */
const TYPE_INSTRUCTIONS: Record<string, string> = {
  MATH:
    "Provide direct, step-by-step NUMERICAL solutions. For every step, show the formula, the substitution, and the resulting calculation. " +
    "Keep explanatory text extremely short — a few words per step just to label what's happening (e.g. 'Apply the formula:', 'Solving for x:'). " +
    "The equations and numbers should carry the answer, not surrounding prose. Do not add conceptual background unless it's a one-line justification for the formula used. " +
    "For Probability/Statistics, show the working, not a description of the concept. For Discrete Structures, use proper set theory/logic notation with minimal prose.",

  COMPUTER:
    "Provide detailed technical explanations. For coding (DS/OOPM/ML), use C++, Java, or Python with brief, purposeful comments. " +
    "For theoretical subjects (SE, DBMS, COA), use algorithms, schemas, and short architectural descriptions — don't restate textbook theory at length.",

  CHEMISTRY:
    "Provide chemical equations, reactions, and molecular explanations clearly. Keep theory brief; prioritize the equation/reaction itself over description.",

  PHYSICS:
    "Provide derivations, formulas, and units. Keep conceptual explanation tight — just enough to justify each derivation step, not a full write-up.",

  ENGLISH:
    "Provide structured explanations with proper grammar, communication theories, and professional writing formats (letters/reports) where relevant.",

  ELECTRICAL:
    "Provide circuit analysis, Boolean algebra (for Digital Systems), and signal processing explanations with minimal filler.",

  MECHANICAL:
    "Provide engineering mechanics solutions, thermodynamics principles, and practical applications — favor formulas and calculations over narrative.",

  CIVIL:
    "Provide structural analysis and mechanics solutions, prioritizing the calculation (e.g. Moment of Inertia) over descriptive text.",

  GRAPHICS:
    "Explain engineering drawing principles (Projections, Isometric, Scales) concisely, focusing on the construction steps.",

  GENERAL:
    "Provide detailed engineering explanations with clear, student-friendly examples — no filler.",
};

export function buildPrompt({ question, subjectType }: PromptContext): string {
  const instruction = TYPE_INSTRUCTIONS[subjectType] || TYPE_INSTRUCTIONS.GENERAL;
  const isMath = subjectType === "MATH";

  // Math answers live or die by the numbers, not the word count — so the
  // 250-300 word target is relaxed for MATH and replaced with a "minimal
  // prose, full working" rule instead.
  const lengthRule = isMath
    ? "Do NOT pad this with theory. Explanatory prose should be minimal — just enough to label each step (well under 100 words of pure explanation total). " +
      "Numerical work (equations, substitutions, computations, final answer) is NOT counted toward any word limit and must be shown in full, step by step."
    : "Keep the answer strictly between 250-300 words. This is a 7-8 mark answer — complete enough to score full marks, short enough to not waste tokens. " +
      "Do not pad with repetition, generic intros, or restating the question.";

  return `
You are an expert RGPV B.Tech academic tutor.

SUBJECT INSTRUCTIONS:
${instruction}

LENGTH RULE (VERY IMPORTANT):
${lengthRule}

FORMAT RULES (VERY IMPORTANT):
- Use Markdown-style headings:
    # Main title
    ## Main sections
    ### Subsections
- Use bullet points starting with "* " for lists.
- Use numbered lists like "1. 2. 3." for steps.
- Use **bold** and *italics* for important terms.
- For code, you MAY use fenced blocks:
    \`\`\`
    code here
    \`\`\`
- For math, use LaTeX expressions inside $...$ or $$...$$.
- DO NOT use any HTML tags (no <p>, <h2>, <ul>, etc.).
- DO NOT use LaTeX document commands or environments such as:
    \\documentclass, \\begin{document}, \\end{document},
    \\section, \\subsection, \\begin{itemize}, \\end{itemize},
    or similar.
- Do NOT include error messages like "Unknown environment".
- Do NOT mention AI, Gemini, or LLMs.
- Output the answer text directly — no preamble, no "Here's the answer", nothing else.

QUESTION:

${question}
`;
}