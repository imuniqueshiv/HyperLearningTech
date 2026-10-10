# Handover Guide

**Audit date:** 2026-10-10  
**Owner decision:** **Pipeline development is paused.** Do not resume extraction “fixes” without a new explicit mandate and a frozen evaluation corpus.

**Related:** [README.md](./README.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [FAILURE_ANALYSIS.md](./FAILURE_ANALYSIS.md) · [DATA_AND_RECOVERY.md](./DATA_AND_RECOVERY.md)

## 1. How to understand the repository

Read in this order:

1. [README.md](./README.md) — scope and warnings
2. This handover
3. [FAILURE_ANALYSIS.md](./FAILURE_ANALYSIS.md) — why results stay unreliable
4. [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) + [END_TO_END_WORKFLOW.md](./END_TO_END_WORKFLOW.md)
5. [AUDIT_EVIDENCE.md](./AUDIT_EVIDENCE.md) — verify claims yourself

Code entry points:

| Concern             | Start here                                                           |
| ------------------- | -------------------------------------------------------------------- |
| Auth / local-only   | `lib/cms-auth.ts`                                                    |
| Upload              | `lib/content-pipeline/upload-service.ts`                             |
| Stage orchestration | `lib/content-pipeline/pipeline-supervisor.ts`                        |
| OCR                 | `lib/content-pipeline/local-ocr-engine.ts`                           |
| Layout / questions  | `structure-builder.ts`, `question-detector.ts`, `question-number.ts` |
| Gemini              | `gemini-structuring.ts`, `prompt-builder.ts`                         |
| Review package      | `review-service.ts`, `components/admin/approval-panel.tsx`           |
| Save                | `local-save-service.ts`                                              |
| Git read-only       | `git-review.ts`, `app/api/cms/git/route.ts`                          |

## 2. Prerequisites and environment

- Node.js (repo uses modern Node; prior work used **v26.7.0** on Windows — treat version matrix as **REQUIRES MANUAL VERIFICATION** on your machine)
- Dependencies via `npm install` (prefer **Program Files Node/npm** on Windows if Anaconda shims break CLI)
- Env vars (names only; configure via `.env.example` / local secrets — **never commit secrets**):
  - `CMS_LOCAL_MODE=true` for CMS
  - `CMS_ALLOW_CONTENT_WRITE` — leave unset/false unless intentionally saving
  - `CMS_SERVICE_TOKEN` — optional automation
  - Gemini keys via existing `lib/ai/key-manager` mechanism
  - Clerk keys for **public** app (not required for local CMS admin path)

Start CMS:

```bash
npm run cms
# → CMS_LOCAL_MODE=true next dev -H 127.0.0.1 -p 3000
```

## 3. Safe local development boundaries

| Allowed                   | Avoid                                          |
| ------------------------- | ---------------------------------------------- |
| Read `.cms` artifacts     | Saving to `content/rgpv` “to try”              |
| Run selected unit tests   | Mass-deleting history/jobs                     |
| Inspect Review UI         | Enabling CMS on Vercel                         |
| Compare preview to PDF    | Trusting pageCount/OCR% badges blindly         |
| Preserve uncommitted work | `git reset --hard`, force push, secret commits |

## 4. Relevant scripts

See `package.json`: `cms`, `test`/`cms:verify`, `cms:sharp`, `cms:report`, `typecheck`, `lint`, `build`.

## 5. Inspect existing artifacts without mutating data

1. List history: `.cms/history/*.json`
2. Open matching `.cms/uploads/<jobId>/production-pyqs.json`
3. Confirm real pages in `raw-document.json` (`metadata.pageCount` / `pages.length`)
4. Treat `import-diagnostics.json` pageCount as **suspect** if 0
5. Compare English text to `scripts/cms-reliability/fixtures/al405-jun-2026/golden-english.json` when auditing AL-405
6. Do **not** call save/approve APIs during inspection

## 6. Known dangerous operations

- `CMS_ALLOW_CONTENT_WRITE=true` + Approve/Save on a bad extraction
- History delete APIs/services without backup
- Resuming ancient jobs after large code drift
- Committing `.env.local` or API keys
- Assuming `diagram-metadata` “no AI captions” means captions are empty (Gemini enrichment still runs)

## 7. What must not be trusted without verification

- Review **page count** badge
- Review **OCR %** badge
- `QQ.*` labels in source mapping UI
- Diagram **captions/alt/aiContext**
- “Schema PASS” as correctness
- “8 questions extracted” as fidelity to the paper
- Any single history row as the canonical attempt
- Prior Cursor acceptance reports without re-checking artifacts

## 8. Evidence required before any production-readiness claim

A defensible claim needs **all** of:

1. Frozen real-PDF corpus with golden English (and negative docs)
2. Repeatable extraction metrics (same commit hash, N≥3 runs) with variance bounds
3. Review indicators proven equal to raw evidence fields
4. Diagram path that cannot invent captions or attach full pages as figures without review flags
5. Save path blocking non-READY packages (automated + manual attempt)
6. Confirmation CMS remains fail-closed on Vercel
7. Explicit human sign-off — automated suite alone is insufficient

## 9. Current uncommitted work — preserve it

At audit start, `git status` on `main` showed **dozens of modified and untracked files** spanning:

- `lib/content-pipeline/**` (OCR, detectors, quality gates, eligibility, …)
- CMS admin components and API routes
- New reliability tests and AL-405 fixtures
- Prior docs (`PHASE3_FINAL_ACCEPTANCE_REPORT.md`, etc.)
- Local `.tmp-ocr` scratch

**Do not discard this work.** Preferred preservation options (choose deliberately later):

- Commit to a dedicated branch (when owner authorizes commits)
- `git stash push -u` with a clear message
- Zip/copy the working tree

This audit **adds** `docs/pipeline-audit/**` as further untracked documentation.

## 10. Pause statement

> The project owner has stopped CMS/PYQ pipeline development.  
> This handover documents the system **as found**, including unresolved extraction unreliability.  
> Future work requires a new decision, a clear success metric (semantic accuracy on real papers), and protection of authoritative `content/rgpv/**`.

## 11. Contacts / ownership

Not recorded in-repo beyond code authorship history. Use GitHub/`git log` for recent CMS commits (`feat(cms): complete Phase 2…` etc.).
