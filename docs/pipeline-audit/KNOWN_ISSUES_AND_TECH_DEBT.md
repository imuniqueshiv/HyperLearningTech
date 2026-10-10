# Known Issues and Technical Debt

**Audit date:** 2026-10-10  
**Related:** [FAILURE_ANALYSIS.md](./FAILURE_ANALYSIS.md) · [COMPLETION_STATUS.md](./COMPLETION_STATUS.md) · [HANDOVER.md](./HANDOVER.md)

Development is **paused**. This list is a risk inventory, not an implementation backlog commitment.

## Priority definitions

| Priority | Meaning                                                             |
| -------- | ------------------------------------------------------------------- |
| **P0**   | Data corruption, unauthorized access, or unsafe production exposure |
| **P1**   | Critical extraction correctness / reliability                       |
| **P2**   | Recovery, observability, testing, operations                        |
| **P3**   | Maintainability / docs / non-critical polish                        |

---

## P0

| ID   | Issue                                                                                      | Evidence                | Impact                                            | Prior attempts                                           | Dependencies                              |
| ---- | ------------------------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------- |
| P0-1 | Authoritative content write if `CMS_ALLOW_CONTENT_WRITE=true` + human approves bad package | `local-save-service.ts` | Can publish wrong PYQs                            | Gates added (eligibility, quality) but indicators flawed | Fix indicators + human process            |
| P0-2 | Local CMS grants ADMIN without user auth on trusted machine                                | `cms-auth.ts`           | Anyone with localhost access can operate CMS      | By design for local tool                                 | OS/firewall hygiene                       |
| P0-3 | Uncommitted large pipeline/UI changes on `main` working tree                               | `git status`            | Risk of loss/confusion; unclear what’s “released” | Ongoing feature work                                     | Preserve branch/stash; do not force-clean |

Mitigation today: keep `CMS_ALLOW_CONTENT_WRITE` unset/false unless intentionally saving; never enable CMS on Vercel.

---

## P1

| ID   | Issue                                                           | Evidence                                   | Impact                               | Prior attempts                                 | Workaround                        |
| ---- | --------------------------------------------------------------- | ------------------------------------------ | ------------------------------------ | ---------------------------------------------- | --------------------------------- |
| P1-1 | Nondeterministic / divergent AL-405 extractions question counts | `.cms` history 4/6/8/10                    | Cannot trust import                  | Repeated OCR/layout/Gemini fixes               | Manual compare to PDF + golden    |
| P1-2 | AI diagram captions / page-as-diagram attachments               | academic + production JSON                 | Invented media metadata              | diagram-metadata “no AI” vs diagram-ai-context | Ignore attachments until verified |
| P1-3 | Bilingual two-column OCR/segmentation errors                    | evidence candidate text; prior Q.5(b) loss | Wrong English / missing parts        | english-text, column OCR, question-detector    | Human transcription               |
| P1-4 | Review pageCount always 0 from evidence summary                 | `review-service.ts`                        | False diagnostics                    | import-diagnostics added but fed bad pageCount | Read `raw-document.json`          |
| P1-5 | OCR confidence ~50% placeholder                                 | `confidence: 0.5` fallback                 | Misleading READY/NEEDS_REVIEW inputs | quality gates                                  | Distrust %                        |
| P1-6 | `QQ.1` UI labeling                                              | `approval-panel.tsx`                       | Reviewer confusion                   | —                                              | Read `questionNumber` field raw   |
| P1-7 | Schema PASS ≠ semantic correctness                              | design of validators                       | False confidence                     | extraction-quality layer                       | Always ground-truth check         |

---

## P2

| ID   | Issue                                       | Evidence                            | Impact                          | Notes                                  |
| ---- | ------------------------------------------- | ----------------------------------- | ------------------------------- | -------------------------------------- |
| P2-1 | Duplicate import history noise              | multiple AL-405 rows                | Operator overload               | Do not auto-delete without policy      |
| P2-2 | Resume may skip stages across code versions | supervisor skip logic               | Stale artifacts                 | Stamp pipeline version if work resumes |
| P2-3 | Windows npm Anaconda shim breakage          | historical sharp/npm failures       | Dev friction                    | Use Program Files Node + `tsx`         |
| P2-4 | Sparse real-fixture corpus                  | `phase3-coverage.ts` notes          | Blind spots                     |                                        |
| P2-5 | No UI E2E tests for indicators              | test audit                          | Regressions undetected          |                                        |
| P2-6 | Older docs stale vs eligibility stage       | `CMS_PIPELINE_RELIABILITY_AUDIT.md` | Onboarding confusion            | Prefer this audit pack                 |
| P2-7 | `.tmp-ocr` / probe artifacts untracked      | `scripts/cms-reliability/.tmp-ocr/` | Disk clutter; not authoritative | Do not treat as source of truth        |

---

## P3

| ID   | Issue                                                                  | Notes                           |
| ---- | ---------------------------------------------------------------------- | ------------------------------- |
| P3-1 | Prettier drift across many files                                       | format:check historically dirty |
| P3-2 | Naming: “reconstruction” UI vs diagram stage IDs                       | `diagram-service` comments      |
| P3-3 | Parallel quality concepts (`qualityIndicators` vs `extractionQuality`) | Easy to conflate in UI          |
| P3-4 | Large monolithic admin components                                      | `content-upload.tsx` etc.       |

---

## Previously attempted themes (do not rediscover blindly)

1. Supervisor timeouts/checkpoints for hang recovery
2. Extracted vs merged preview separation
3. Syllabus isolation for PYQ-only imports
4. English/Hindi filtering and column OCR for AL-405
5. Extraction-quality READY/NEEDS_REVIEW/BLOCKED gates
6. Golden AL-405 fixture + failure-class tests

These improved **mechanics** and **some** fidelity paths; they did **not** establish reliable CMS extraction across repeated real imports (see history counts).

## Dangerous “cleanups” to avoid

- Deleting `.cms/history` wholesale
- Re-running imports to “overwrite” authoritative content
- Force-resetting git uncommitted work
- Enabling content write to “test save” on production data without backup hashes
