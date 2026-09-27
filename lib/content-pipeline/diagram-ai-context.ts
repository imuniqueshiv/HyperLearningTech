import type { AcademicDiagram } from "./academic-types";
import type { DiagramAsset } from "./diagram-metadata";
import { firstNonEmpty, safeTrim } from "./string-normalize";

export interface DiagramAiContextResult {
  title: string;
  alt: string;
  caption: string;
  aiContext: string;
  category: string | null;
  relatedQuestionId: string | null;
  relatedSubQuestionId: string | null;
}

/**
 * Applies vision enrichment onto an AcademicDiagram, preserving source path.
 */
export function applyDiagramAiContext(
  diagram: AcademicDiagram,
  enrichment: DiagramAiContextResult
): AcademicDiagram {
  return {
    ...diagram,
    title: firstNonEmpty(enrichment.title, diagram.title),
    alt: firstNonEmpty(enrichment.alt, diagram.alt),
    caption: firstNonEmpty(enrichment.caption, diagram.caption),
    aiContext: firstNonEmpty(enrichment.aiContext, diagram.aiContext),
    category: firstNonEmpty(enrichment.category, diagram.category) || null,
    relatedQuestionId:
      firstNonEmpty(enrichment.relatedQuestionId, diagram.relatedQuestionId) ||
      null,
    relatedSubQuestionId:
      firstNonEmpty(
        enrichment.relatedSubQuestionId,
        diagram.relatedSubQuestionId
      ) || null,
  };
}

/**
 * Whether a diagram still needs Gemini vision enrichment.
 */
export function needsDiagramAiContext(diagram: AcademicDiagram): boolean {
  return (
    !safeTrim(diagram.aiContext) ||
    !safeTrim(diagram.title) ||
    safeTrim(diagram.title) === "Diagram"
  );
}

export function findDiagramAsset(
  assets: DiagramAsset[],
  sourcePath: string
): DiagramAsset | null {
  const normalized = safeTrim(sourcePath).replace(/\\/g, "/");
  return (
    assets.find(
      (asset) => safeTrim(asset.path).replace(/\\/g, "/") === normalized
    ) ?? null
  );
}
