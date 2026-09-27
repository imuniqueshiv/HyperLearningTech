/**
 * Progress percent mapping for pipeline stages.
 */

import { PipelineStage } from "./pipeline-stage";

const STAGE_PROGRESS: Partial<Record<PipelineStage, number>> = {
  [PipelineStage.UPLOADED]: 0,
  [PipelineStage.QUEUED]: 5,
  [PipelineStage.OCR_PROCESSING]: 10,
  [PipelineStage.OCR_COMPLETED]: 20,
  [PipelineStage.LAYOUT_PROCESSING]: 25,
  [PipelineStage.LAYOUT_COMPLETED]: 35,
  [PipelineStage.DIAGRAM_EXTRACTION]: 40,
  [PipelineStage.DIAGRAMS_READY]: 50,
  [PipelineStage.STRUCTURING]: 55,
  [PipelineStage.STRUCTURED]: 65,
  [PipelineStage.SCHEMA_BUILDING]: 70,
  [PipelineStage.SCHEMA_READY]: 75,
  [PipelineStage.VALIDATING]: 80,
  [PipelineStage.VALIDATED]: 85,
  [PipelineStage.WRITING]: 90,
  [PipelineStage.DIAGRAMS_WRITING]: 92,
  [PipelineStage.DIAGRAMS_WRITTEN]: 93,
  [PipelineStage.WRITTEN]: 94,
  [PipelineStage.UNDER_REVIEW]: 95,
  [PipelineStage.APPROVED]: 96,
  [PipelineStage.LOCAL_SAVED]: 100,
  [PipelineStage.REBUILDING]: 60,
  [PipelineStage.REBUILT]: 94,
  [PipelineStage.COMPLETED]: 100,
  [PipelineStage.FAILED]: 0,
  [PipelineStage.TIMEOUT]: 0,
  [PipelineStage.CANCELLED]: 0,
};

export function progressPercentForStage(stage: PipelineStage): number {
  return STAGE_PROGRESS[stage] ?? 0;
}
