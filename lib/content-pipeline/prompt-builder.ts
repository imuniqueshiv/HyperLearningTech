import type { DiagramAsset } from "./diagram-metadata";
import type { JobType } from "./types";

export interface StructuringPromptContext {
  jobId: string;
  jobType: JobType;
  branch: string | null;
  semester: string | null;
  subjectCode: string | null;
  sourceFilename: string;
  layoutSnapshot: unknown;
  diagrams: Array<{
    id: string;
    path: string;
    filename: string;
    pageNumber: number;
    width: number;
    height: number;
  }>;
}

export interface DiagramAiPromptContext {
  diagram: DiagramAsset;
  relatedQuestionHint: string | null;
  relatedSubQuestionHint: string | null;
  surroundingText: string[];
}

/**
 * Builds the main academic structuring prompt from a layout snapshot.
 * Output must be JSON only — never final pyqs.json / syllabus.json.
 */
export function buildStructuringPrompt(
  context: StructuringPromptContext
): string {
  return [
    "You are an academic document structuring engine for RGPV engineering exams.",
    "Convert the given document layout snapshot into a single JSON object.",
    "",
    "Return ONLY valid JSON. No markdown fences. No commentary.",
    "",
    "JSON shape:",
    "{",
    '  "exam": {',
    '    "exam": string|null,',
    '    "year": number|null,',
    '    "month": string|null,',
    '    "maxMarks": number|null,',
    '    "time": string|null,',
    '    "commonInstructions": string[],',
    '    "isPredicted": boolean|null,',
    '    "gradingSystem": string|null',
    "  } | null,",
    '  "subject": {',
    '    "code": string|null,',
    '    "name": string|null,',
    '    "title": string|null,',
    '    "university": string|null',
    "  } | null,",
    '  "units": [{ "id": string, "number": number|null, "title": string, "hours": number|null, "topicIds": string[] }],',
    '  "topics": [{ "id": string, "unitId": string|null, "slug": string, "title": string, "displayOrder": number }],',
    '  "questions": [{',
    '    "id": string,',
    '    "questionNumber": string,',
    '    "marks": number|null,',
    '    "subQuestions": [{',
    '      "id": string,',
    '      "label": string,',
    '      "text": string,',
    '      "latex": string|null,',
    '      "unit": string|null,',
    '      "type": string|null,',
    '      "marks": number|null,',
    '      "difficulty": "easy"|"medium"|"hard"|"unknown"|null,',
    '      "questionType": "numerical"|"theory"|"diagram"|"mixed"|"unknown"|null,',
    '      "attachmentSourcePaths": string[]',
    "    }]",
    "  }],",
    '  "diagrams": [{',
    '    "id": string,',
    '    "sourcePath": string,',
    '    "relatedQuestionId": string|null,',
    '    "relatedSubQuestionId": string|null,',
    '    "title": string,',
    '    "alt": string,',
    '    "caption": string,',
    '    "aiContext": string,',
    '    "category": string|null',
    "  }]",
    "}",
    "",
    "Rules:",
    "- Infer academic meaning (units, marks, topics, question types, exam metadata).",
    "- questionNumber must look like Q.1, Q.2, etc.",
    "- subQuestion labels like a), b), or empty string when none.",
    "- unit should be like Unit 1 when known.",
    "- type should be a short kebab-case topic slug when known.",
    "- Use provided diagram sourcePath values exactly; do not invent paths.",
    "- attachmentSourcePaths on sub-questions must reference those diagram paths.",
    "- aiContext must describe the figure factually for later AI tutoring; never include the solution.",
    "- Do NOT emit pyqs.json or syllabus.json root wrappers.",
    "- Do NOT invent content/ repository paths.",
    "",
    `Job type: ${context.jobType}`,
    `Job id: ${context.jobId}`,
    `Source file: ${context.sourceFilename}`,
    `Branch: ${context.branch ?? "unknown"}`,
    `Semester: ${context.semester ?? "unknown"}`,
    `Subject code hint: ${context.subjectCode ?? "unknown"}`,
    "",
    "Known diagram assets:",
    JSON.stringify(context.diagrams, null, 2),
    "",
    "Layout snapshot:",
    JSON.stringify(context.layoutSnapshot, null, 2),
  ].join("\n");
}

/**
 * Builds a vision prompt for one diagram's title/alt/caption/aiContext.
 */
export function buildDiagramAiContextPrompt(
  context: DiagramAiPromptContext
): string {
  return [
    "You analyze one exam diagram image for metadata only.",
    "Return ONLY valid JSON. No markdown fences.",
    "",
    "JSON shape:",
    "{",
    '  "title": string,',
    '  "alt": string,',
    '  "caption": string,',
    '  "aiContext": string,',
    '  "category": string|null,',
    '  "relatedQuestionId": string|null,',
    '  "relatedSubQuestionId": string|null',
    "}",
    "",
    "Rules:",
    "- title: short human label (e.g. Circuit Diagram).",
    "- alt: concise accessible description.",
    "- caption: short figure caption.",
    "- aiContext: detailed factual description of what is drawn (components, labels, topology).",
    "- Never include the numerical/theoretical solution.",
    "- category: e.g. circuit, graph, flowchart, mechanical, other.",
    "",
    `Diagram id: ${context.diagram.id}`,
    `Filename: ${context.diagram.filename}`,
    `Page: ${context.diagram.pageNumber}`,
    `Source path: ${context.diagram.path}`,
    `Related question hint: ${context.relatedQuestionHint ?? "unknown"}`,
    `Related sub-question hint: ${context.relatedSubQuestionHint ?? "unknown"}`,
    "",
    "Nearby text:",
    context.surroundingText.length > 0
      ? context.surroundingText.join("\n")
      : "(none)",
  ].join("\n");
}
