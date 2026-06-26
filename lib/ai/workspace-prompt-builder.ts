// lib/ai/workspace-prompt-builder.ts

import { WorkspacePromptContext } from "@/types/ai";

const SUBJECT_INSTRUCTIONS: Record<string, string> = {
  MATH: "Explain using formulas and step-by-step reasoning when needed.",

  COMPUTER: "Explain using clear concepts and practical examples.",

  CHEMISTRY: "Explain using reactions and practical applications.",

  PHYSICS: "Explain using formulas and intuitive reasoning.",

  ENGLISH: "Explain using clear examples and practical usage.",

  ELECTRICAL: "Explain using circuits, formulas, and practical intuition.",

  MECHANICAL: "Explain using engineering examples and practical applications.",

  CIVIL: "Explain using structural reasoning and practical applications.",

  GRAPHICS: "Explain using construction procedures and drawing methodology.",

  GENERAL: "Explain concepts in a simple, student-friendly way.",
};

function getSubjectType(context: WorkspacePromptContext): string {
  return context.subjectType || "GENERAL";
}

function getLengthInstruction(action: string): string {
  switch (action) {
    case "EXPLAIN":
      return `
STRICT LIMIT: Maximum 100 words.
If your answer exceeds 100 words, shorten it until it is below 100 words.
Never create more than four sections.
`;
    case "NOTES":
      return "Your response must be between 150 and 200 words. Provide comprehensive notes covering all key aspects.";
    case "ANSWER_5":
      return "Your response must be between 180 and 200 words. Provide a well-structured 5-mark exam answer.";
    case "ANSWER_7":
      return "Your response must be between 200 and 220 words. Provide a detailed 7-mark exam answer with proper structure.";
    case "REVISION":
      return "Your response must be between 60 and 80 words. Provide a concise revision summary with only key points.";
    case "MCQ":
      return "Generate 5-10 multiple choice questions with answers. Each question should have 4 options.";
    case "FORMULA":
      return "Provide the formula(s) with a 30-50 word explanation. Use LaTeX for formulas.";
    case "PYQ":
      return "List only previous year questions related to this topic. No explanations, just the questions.";
    default:
      return "Your response must be between 90 and 120 words. Never exceed 120 words.";
  }
}

function getFormatInstructions(
  action: string,
  context: WorkspacePromptContext
): string {
  switch (action) {
    case "EXPLAIN":
      return `
Follow this structure exactly:

# ${context.topic}

## Concept

Explain the topic clearly in simple language.

## Example

Give one practical engineering example.

## Exam Tip

Mention one important point frequently asked in exams.

**Formula:** Only include if the topic actually has one. Use LaTeX for formulas.
`;

    case "NOTES":
      return `
Follow this structure exactly:

# ${context.topic} - Comprehensive Notes

## Overview
Brief introduction to the topic.

## Key Concepts
- Concept 1 with explanation
- Concept 2 with explanation
- Concept 3 with explanation

## Important Points
- Point 1
- Point 2
- Point 3

## Applications
Real-world engineering applications.

## Summary
Concise summary of the topic.
`;

    case "ANSWER_5":
      return `
Follow this structure exactly:

# ${context.topic} - 5 Mark Answer

## Introduction
Brief introduction (1-2 sentences).

## Main Content
- Point 1 with brief explanation
- Point 2 with brief explanation
- Point 3 with brief explanation

## Conclusion
Concise conclusion.
`;

    case "ANSWER_7":
      return `
Follow this structure exactly:

# ${context.topic} - 7 Mark Answer

## Introduction
Clear introduction to the topic.

## Detailed Explanation
- Point 1 with explanation
- Point 2 with explanation
- Point 3 with explanation
- Point 4 with explanation

## Applications
Practical applications.

## Conclusion
Well-rounded conclusion.
`;

    case "REVISION":
      return `
Follow this structure exactly:

# ${context.topic} - Quick Revision

## Key Points
- Point 1
- Point 2
- Point 3
- Point 4
- Point 5

## Formula (if applicable)
- Formula with brief explanation

## Exam Focus
What to focus on for exams.
`;

    case "MCQ":
      return `
Generate 5-10 multiple choice questions for ${context.topic}.

Format:
## Question 1
**Question text?**
- A) Option 1
- B) Option 2
- C) Option 3
- D) Option 4

**Answer:** C) Option 3

**Explanation:** Brief explanation why this is correct.
`;

    case "FORMULA":
      return `
# ${context.topic} - Formulas

## Formula 1
[LaTeX formula]

### Variables
- Variable 1: Description
- Variable 2: Description

### Units
- Unit 1
- Unit 2

### When to Use
Brief explanation of when to apply this formula.
`;

    case "PYQ":
      return `
# ${context.topic} - Previous Year Questions

List previous year questions related to this topic:

1. [Year] - [Question]
2. [Year] - [Question]
3. [Year] - [Question]
4. [Year] - [Question]
5. [Year] - [Question]
`;

    default:
      return `
Follow this structure:

# ${context.topic}

## Explanation

Explain the topic clearly.

## Example

Provide an example.

## Key Points

- Point 1
- Point 2
- Point 3
`;
  }
}

export function buildWorkspacePrompt(context: WorkspacePromptContext): string {
  const subjectType = getSubjectType(context);
  const instruction =
    SUBJECT_INSTRUCTIONS[subjectType] ?? SUBJECT_INSTRUCTIONS.GENERAL;
  const lengthInstruction = getLengthInstruction(context.action);
  const formatInstructions = getFormatInstructions(context.action, context);

  const basePrompt = `
You are Hyper AI, an expert engineering professor teaching RGPV B.Tech students.

Your goal is to provide a quick concept explanation that can be read in under one minute.

Subject: ${context.subjectName}
Subject Code: ${context.subjectCode}
Module: ${context.module}
Topic: ${context.topic}
Action: ${context.action}

${instruction}

${lengthInstruction}

${formatInstructions}

Rules:
- Markdown only.
- Use headings with #.
- Use bullet points with -.
- Use numbered lists where needed.
- Use fenced code blocks for programming.
- Use LaTeX for mathematics with $$ for block and $ for inline.
- Never output HTML.
- Never mention AI, Gemini, or LLM.
- Never say "Here is the answer."
- Never say "I am an AI."
- Keep the response focused only on the requested topic.
- Do not include unnecessary classifications or historical information.
- Do not repeat explanations.
- Keep every sentence useful.
- Never use "in detail" or similar phrases that encourage long responses.
- COUNT your words before responding. If you exceed the limit, REWRITE shorter. This is non-negotiable.
- NEVER write introductions, background, history, or classifications unless asked.
- Answer ONLY what was asked. Stop immediately after.

If your response exceeds the word limit, rewrite it before returning.
`;

  return basePrompt;
}
