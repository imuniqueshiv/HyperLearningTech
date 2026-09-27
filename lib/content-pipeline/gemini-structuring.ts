import fs from "fs/promises";
import path from "path";

import { GoogleGenAI } from "@google/genai";

import { getGeminiKeys } from "@/lib/ai/key-manager";
import { trackMetric } from "@/lib/ai/metrics";

import type { AcademicDocument } from "./academic-document";
import type { AcademicMetadata, AcademicTokenUsage } from "./academic-types";
import {
  applyDiagramAiContext,
  needsDiagramAiContext,
  type DiagramAiContextResult,
} from "./diagram-ai-context";
import { parseAcademicDocument } from "./academic-parser";
import type { DiagramAsset } from "./diagram-metadata";
import {
  buildDiagramAiContextPrompt,
  buildStructuringPrompt,
} from "./prompt-builder";
import { buildLayoutSnapshot, collectSurroundingText } from "./schema-mapper";
import type { StructuredDocument } from "./structured-document";
import { safeTrim, safeTrimOrNull } from "./string-normalize";
import type { JobType } from "./types";
import { getJobDirectory } from "./temp-storage";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const MAX_ATTEMPTS = 3;
/** Per-request deadline for a single generateContent call. */
const GEMINI_REQUEST_TIMEOUT_MS = 90_000;

export interface StructureDocumentInput {
  jobId: string;
  jobType: JobType;
  branch: string | null;
  semester: string | null;
  subjectCode: string | null;
  sourceFilename: string;
  document: StructuredDocument;
}

export interface StructureDocumentResult {
  academicDocument: AcademicDocument;
  model: string;
  usage: AcademicTokenUsage | null;
}

/**
 * Swappable structuring engine contract.
 * Downstream code depends on this interface, not Gemini specifics.
 */
export interface StructuringEngine {
  readonly name: string;
  structure(input: StructureDocumentInput): Promise<StructureDocumentResult>;
}

export class GeminiStructuringEngine implements StructuringEngine {
  readonly name = "gemini-structuring-v1";
  private readonly model: string;

  constructor(model: string = DEFAULT_MODEL) {
    this.model = model;
  }

  async structure(
    input: StructureDocumentInput
  ): Promise<StructureDocumentResult> {
    const keys = getGeminiKeys();
    if (keys.length === 0) {
      throw new Error("No PYQ Gemini API keys configured");
    }

    const diagrams = input.document.diagrams ?? [];
    const layoutSnapshot = buildLayoutSnapshot(input.document);
    const prompt = buildStructuringPrompt({
      jobId: input.jobId,
      jobType: input.jobType,
      branch: input.branch,
      semester: input.semester,
      subjectCode: input.subjectCode,
      sourceFilename: input.sourceFilename,
      layoutSnapshot,
      diagrams: diagrams.map((diagram) => ({
        id: diagram.id,
        path: diagram.path,
        filename: diagram.filename,
        pageNumber: diagram.pageNumber,
        width: diagram.width,
        height: diagram.height,
      })),
    });

    const structured = await generateJsonWithRetry({
      keys,
      model: this.model,
      subjectCode: input.subjectCode ?? "cms-structuring",
      contents: prompt,
    });

    const metadata: AcademicMetadata = {
      jobId: input.jobId,
      jobType: input.jobType,
      sourceFilename: input.sourceFilename,
      subjectCode: input.subjectCode,
      subjectName: null,
      subjectTitle: null,
      branch: input.branch,
      semester: input.semester,
      university: null,
      structuredAt: new Date().toISOString(),
      model: this.model,
      detector: this.name,
    };

    let academicDocument: AcademicDocument;

    try {
      academicDocument = parseAcademicDocument({
        rawText: structured.text,
        metadata,
        diagrams,
        usage: structured.usage,
      });
    } catch (error) {
      console.error("[CMS_STRUCTURING_PARSE_FALLBACK]", error);
      throw new Error(
        `GEMINI_MALFORMED_JSON: Gemini response was not valid academic JSON. ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    academicDocument = await enrichDiagramsWithVision({
      keys,
      model: this.model,
      subjectCode: input.subjectCode ?? "cms-structuring",
      jobId: input.jobId,
      document: input.document,
      academicDocument,
      diagrams,
    });

    return {
      academicDocument,
      model: this.model,
      usage: academicDocument.usage,
    };
  }
}

export function createDefaultStructuringEngine(): StructuringEngine {
  return new GeminiStructuringEngine();
}

async function enrichDiagramsWithVision(input: {
  keys: string[];
  model: string;
  subjectCode: string;
  jobId: string;
  document: StructuredDocument;
  academicDocument: AcademicDocument;
  diagrams: DiagramAsset[];
}): Promise<AcademicDocument> {
  if (input.diagrams.length === 0) {
    return input.academicDocument;
  }

  const jobDir = getJobDirectory(input.jobId);
  const diagrams = [...input.academicDocument.diagrams];
  let usage = input.academicDocument.usage;

  for (let index = 0; index < diagrams.length; index++) {
    const diagram = diagrams[index];
    if (!needsDiagramAiContext(diagram)) {
      continue;
    }

    const asset =
      input.diagrams.find((item) => item.path === diagram.sourcePath) ?? null;
    if (!asset) {
      continue;
    }

    const absolutePath = path.join(jobDir, asset.path);
    let imageBuffer: Buffer;

    try {
      imageBuffer = await fs.readFile(absolutePath);
    } catch {
      continue;
    }

    const prompt = buildDiagramAiContextPrompt({
      diagram: asset,
      relatedQuestionHint: diagram.relatedQuestionId,
      relatedSubQuestionHint: diagram.relatedSubQuestionId,
      surroundingText: collectSurroundingText(input.document, asset),
    });

    try {
      const result = await generateJsonWithRetry({
        keys: input.keys,
        model: input.model,
        subjectCode: input.subjectCode,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/webp",
                  data: imageBuffer.toString("base64"),
                },
              },
            ],
          },
        ],
      });

      usage = mergeUsage(usage, result.usage);
      const enrichment = parseDiagramAiContext(result.text);
      diagrams[index] = applyDiagramAiContext(diagram, enrichment);
    } catch (error) {
      console.error("[CMS_DIAGRAM_AI_CONTEXT_FAILED]", asset.path, error);
    }
  }

  const nextDocument: AcademicDocument = {
    ...input.academicDocument,
    diagrams,
    usage,
  };

  // Keep attachment AI fields in sync with enriched diagrams.
  for (const question of nextDocument.questions) {
    for (const sub of question.subQuestions) {
      sub.attachments = sub.attachments.map((attachment) => {
        const match = diagrams.find(
          (diagram) => diagram.sourcePath === attachment.sourcePath
        );
        if (!match) {
          return attachment;
        }
        return {
          ...attachment,
          title: match.title,
          alt: match.alt,
          caption: match.caption,
          aiContext: match.aiContext,
          category: match.category,
        };
      });
    }
  }

  return nextDocument;
}

function parseDiagramAiContext(rawText: unknown): DiagramAiContextResult {
  const trimmed = safeTrim(rawText);
  if (!trimmed) {
    throw new Error("Diagram AI context response was empty or not a string.");
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = safeTrim(fenced?.[1]) || trimmed;
  const parsed = JSON.parse(candidate) as Partial<DiagramAiContextResult>;

  return {
    title: safeTrim(parsed.title) || "Diagram",
    alt: safeTrim(parsed.alt) || "Exam diagram",
    caption: safeTrim(parsed.caption),
    aiContext: safeTrim(parsed.aiContext),
    category: safeTrimOrNull(parsed.category),
    relatedQuestionId: safeTrimOrNull(parsed.relatedQuestionId),
    relatedSubQuestionId: safeTrimOrNull(parsed.relatedSubQuestionId),
  };
}

async function generateJsonWithRetry(input: {
  keys: string[];
  model: string;
  subjectCode: string;
  contents: unknown;
}): Promise<{ text: string; usage: AcademicTokenUsage | null }> {
  let lastError: unknown;
  let keyIndex = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const apiKey = input.keys[keyIndex % input.keys.length];
    const ai = new GoogleGenAI({ apiKey });

    try {
      const started = Date.now();
      console.log("[Gemini] generateContent START", {
        attempt,
        model: input.model,
      });
      const response = await Promise.race([
        ai.models.generateContent({
          model: input.model,
          contents: input.contents as never,
          config: {
            responseMimeType: "application/json",
            httpOptions: {
              timeout: GEMINI_REQUEST_TIMEOUT_MS,
            },
          },
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Gemini generateContent exceeded ${GEMINI_REQUEST_TIMEOUT_MS}ms.`
              )
            );
          }, GEMINI_REQUEST_TIMEOUT_MS);
        }),
      ]);

      const text = safeTrim(response.text);
      const usage = extractUsage(response);
      console.log("[Gemini] generateContent DONE", {
        attempt,
        ms: Date.now() - started,
        chars: text.length,
      });

      void trackMetric("GENERATION_SUCCESS", {
        subjectCode: input.subjectCode,
        durationMs: Date.now() - started,
      });

      return { text, usage };
    } catch (error) {
      lastError = error;
      const retryable = isRetryableGeminiError(error);
      console.log("[Gemini] generateContent FAIL", {
        attempt,
        retryable,
        message: error instanceof Error ? error.message : String(error),
      });
      keyIndex += 1;

      void trackMetric("GENERATION_RETRY", {
        subjectCode: input.subjectCode,
        message: `Structuring attempt ${attempt} failed`,
      });

      if (!retryable) {
        break;
      }

      if (attempt < MAX_ATTEMPTS) {
        await sleep(1500 * attempt);
      }
    }
  }

  void trackMetric("GENERATION_FAILED", {
    subjectCode: input.subjectCode,
    message: String(lastError),
  });

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini structuring failed.");
}

function extractUsage(response: {
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}): AcademicTokenUsage | null {
  const usage = response.usageMetadata;
  if (!usage) {
    return null;
  }

  return {
    promptTokens: usage.promptTokenCount ?? null,
    completionTokens: usage.candidatesTokenCount ?? null,
    totalTokens: usage.totalTokenCount ?? null,
  };
}

function mergeUsage(
  current: AcademicTokenUsage | null,
  next: AcademicTokenUsage | null
): AcademicTokenUsage | null {
  if (!current && !next) {
    return null;
  }

  return {
    promptTokens: sumNullable(current?.promptTokens, next?.promptTokens),
    completionTokens: sumNullable(
      current?.completionTokens,
      next?.completionTokens
    ),
    totalTokens: sumNullable(current?.totalTokens, next?.totalTokens),
  };
}

function sumNullable(
  left: number | null | undefined,
  right: number | null | undefined
): number | null {
  if (left == null && right == null) {
    return null;
  }
  return (left ?? 0) + (right ?? 0);
}

function isRetryableGeminiError(error: unknown): boolean {
  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  if (
    message.includes("api key") ||
    message.includes("invalid api") ||
    message.includes("permission_denied") ||
    message.includes("unauthenticated")
  ) {
    return false;
  }
  return (
    message.includes("timeout") ||
    message.includes("exceeded") ||
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("unavailable") ||
    message.includes("503") ||
    message.includes("500") ||
    message.includes("econnreset") ||
    message.includes("fetch failed") ||
    message.includes("network")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
