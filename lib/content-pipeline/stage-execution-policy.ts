/**
 * Client-facing stage execution is forbidden in Phase 1.
 * Only PipelineSupervisor (via start/resume/retry recovery) may run stages.
 */

export class StageExecutionForbiddenError extends Error {
  readonly code = "STAGE_EXECUTION_FORBIDDEN";

  constructor() {
    super(
      "Direct stage execution is disabled. Use Import Session start / resume / retry via the recovery API. The PipelineSupervisor is the sole orchestrator."
    );
    this.name = "StageExecutionForbiddenError";
  }
}

export function assertClientStageExecutionForbidden(): never {
  throw new StageExecutionForbiddenError();
}
