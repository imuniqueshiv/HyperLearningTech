# CMS Pipeline Reliability Audit

## 1. Executive Summary

The Import Session hang was caused by **lifecycle death** between stages and **sticky disk `*_PROCESSING` locks**, not by infinite loops in detectors. This pass adds a **pipeline supervisor**, per-stage **timeouts/checkpoints**, recoverable sticky stages, Gemini request deadlines, a debug endpoint, and terminal stages `TIMEOUT` / `CANCELLED`.

## 2. Architecture (after fix)

```
Upload after(ensureImportSessionPipeline)
  → runBatchPipeline
    → superviseJobPipeline
         → OCR → Layout → Reconstruction → Gemini → Schema → Validation → Writer
         → (auto) Review
```

Stages never launch the next stage. The supervisor owns transitions, resume skips, timeouts, and checkpoints.

## 3. Stage capability matrix (after)

| Stage | Timeout | Sticky PROCESSING | inFlight+finally | Checkpoint | Stage log |
|---|---|---|---|---|---|
| OCR | 180s (supervisor) | Recoverable | Yes | Yes | Yes |
| Layout | 60s | Recoverable | Yes | Yes | Yes |
| Reconstruction | 60s | Recoverable | Yes | Yes | Yes |
| Gemini | 240s + 90s/request | Recoverable | Yes | Yes | Yes |
| Schema | 60s | Recoverable | Yes | Yes | Yes |
| Validation | 60s | Recoverable | Yes | Yes | Yes |
| Writer | 120s | Recoverable | Yes | Yes | Yes |
| Review | 30s (auto) | N/A | N/A | Optional | Logged on fail |

## 4. Hang / lifecycle points found

| Risk | Location | Fix |
|---|---|---|
| `after()` not retaining pipeline Map | `upload/route.ts` | `ensureImportSessionPipeline` |
| Sticky `STRUCTURING` / OCR / Schema / Validation / Writer | stage services | Recoverable + inFlight |
| Gemini `generateContent` unbounded | `gemini-structuring.ts` | 90s race + httpOptions.timeout |
| Queue lock deadlock | `import-queue.ts` | 15s wait timeout |
| Missing stage timeout | most stages | Supervisor `withStageTimeout` |
| UI Running forever on TIMEOUT | `session-status.ts` | Map TIMEOUT/CANCELLED → Failed |
| Reconstruction Sharp orphan after race | diagram-service | Raised to 60s; abort checks (Sharp cancel N/A) |

## 5. Terminal states

Every session must end in one of:

- `COMPLETED` / Review Ready path (`WRITTEN` → review)
- `FAILED`
- `TIMEOUT`
- `CANCELLED`

Never permanent `Running …`.

## 6. Debug endpoint

`GET /api/cms/debug/pipeline/:jobId`

Returns current stage, elapsed, heartbeat, last log tail, artifacts, resume point, timeout remaining, checkpoints.

## 7. Files modified / added

**Added**

- `lib/content-pipeline/stage-runtime.ts`
- `lib/content-pipeline/stage-checkpoint.ts`
- `lib/content-pipeline/pipeline-supervisor.ts`
- `lib/content-pipeline/pipeline-debug.ts`
- `app/api/cms/debug/pipeline/[jobId]/route.ts`
- `scripts/cms-reliability/pipeline-supervisor.test.ts`
- `docs/CMS_PIPELINE_RELIABILITY_AUDIT.md`

**Updated**

- `batch-service.ts`, `upload/route.ts`, `import-session-service.ts` (already had ensure*)
- `ocr-service.ts`, `layout-service.ts`, `diagram-service.ts`, `structuring-service.ts`
- `schema-builder-service.ts`, `validation-service.ts`, `writer-service.ts`, `local-save-service.ts`
- `gemini-structuring.ts`, `import-queue.ts`, `pipeline-stage.ts`, `session-status.ts`
- `progress.ts`, `constants.ts`, `job-recovery.ts`, `server.ts`, `api-endpoints.ts`

## 8. Verification checklist

- [x] `npm run lint` (exit 0)
- [x] `npm run typecheck` (exit 0)
- [x] `npm run build` (exit 0)
- [x] `tsx --test scripts/cms-reliability/pipeline-supervisor.test.ts` (5/5 pass)
- [ ] Live: 1 PDF import → Review Ready
- [ ] Live: sticky STRUCTURING resume
- [ ] Live: Gemini key failure → FAILED (not Running)
- [ ] Live: `/api/cms/debug/pipeline/<jobId>` returns JSON

## 9. Recommendation

✅ Pipeline reliability primitives are in place. Quality gates pass. A brand-new contributor who starts `npm run dev`, uploads with auto-pipeline, and has Gemini keys configured should no longer see permanent “Running …” — timeouts and sticky recovery force a terminal state with resume hints.

Operator live checklist above remains for full end-to-end confirmation on real PDFs.
