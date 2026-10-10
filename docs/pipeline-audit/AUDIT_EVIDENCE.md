# Audit Evidence Index

**Audit date:** 2026-10-10  
**Git branch:** `main`  
**Confidence labels:** Verified · Historical · Hypothesis · UNKNOWN

This index maps important claims to concrete evidence so another engineer can re-check without trusting narrative alone.

## 1. Audit execution log

| Action | Performed? | Notes |
|---|---|---|
| `git status` / `git log` / `git rev-parse` | Yes | Read-only |
| Read `package.json`, pipeline/UI/auth sources | Yes | |
| List/read `.cms/history` + selected job JSON | Yes | Read-only |
| Inspect AL-405 fixture + golden JSON | Yes | |
| Read prior `full-suite.log` | Yes | Historical result |
| Run `npm test` / build / typecheck | **No** | Avoided per audit rules |
| Run CMS import / OCR job / save | **No** | |
| Modify `content/rgpv/**` | **No** | |
| Commit / push / deploy | **No** | |
| Create `docs/pipeline-audit/*` | Yes | Documentation only |

## 2. Git state at audit (start)

- Branch: `main`  
- Recent commits observed: `38efcf8 feat(cms): complete Phase 2 PYQ extraction pipeline (#119)` and prior CMS pipeline merges  
- Working tree: **dirty** — ~37 modified tracked files + many untracked pipeline/test/UI/docs artifacts (count ~62 short-status lines at start)  
- `.cms/` gitignored but present locally with history/uploads  

After documentation: expect additional untracked `docs/pipeline-audit/` files. Re-run `git status` to confirm.

## 3. Claim → evidence table

| Claim | Evidence | Confidence |
|---|---|---|
| CMS is local-only / fail-closed on Vercel | `lib/cms-auth.ts` `isLocalCmsMode`, `assertLocalCmsMode`, `requireCmsAuth` | Verified |
| Optional service token auth | `CMS_SERVICE_TOKEN` Bearer path in `cms-auth.ts`; `.env.example` names | Verified |
| Content writes gated | `local-save-service.ts` `isCmsContentWriteEnabled` / `CMS_ALLOW_CONTENT_WRITE` | Verified |
| Git mutations blocked in CMS | `app/api/cms/git/route.ts` POST → `GIT_MUTATION_BLOCKED`; `git-review.ts` allowlist | Verified |
| Stage sequence includes eligibility | `pipeline-supervisor.ts` `STAGE_SEQUENCE` | Verified |
| Stage timeouts | `stage-runtime.ts` `STAGE_TIMEOUT_MS` | Verified |
| Upload creates `.cms/uploads/<jobId>` | `upload-service.ts`, `temp-storage.ts`, `constants.ts` `CMS_UPLOADS_DIR` | Verified |
| Import limits ≤5 pages / one paper | `import-limits.ts` | Verified |
| ExtractionEvidence has no `pages[]` | `extraction-evidence.ts` interface | Verified |
| Review pageCount uses missing `pages` | `review-service.ts` ≈ line assigning `pageCount: evidenceFile?.pages?.length ?? 0` | Verified |
| Diagnostics pageCount 0 on AL-405 jobs | `.cms/uploads/job_15b303ce…/import-diagnostics.json` `pageCount: 0` vs `raw-document` 2 pages | Verified |
| OCR confidence fallback 0.5 | `review-service.ts` candidate map `confidence: 0.5`; `confToNum` default 0.5; indicators ×100 | Verified |
| UI renders `QQ.1` | `approval-panel.tsx` `` Q{q.questionNumber} `` with `questionNumber` already `Q.1`; no `QQ.` in stored JSON scan | Verified |
| AI diagram captions on AL-405 | `job_15b303ce…` / `job_5949fb0c…` `academic-document.json` + production attachments | Verified |
| diagram-metadata claims no AI captions | `diagram-metadata.ts` header comment | Verified |
| Gemini still enriches diagrams | `diagram-ai-context.ts`, `gemini-structuring.ts` imports | Verified |
| Duplicate AL-405 history counts 4/6/8/10 | `.cms/history/job_*.json` `questionsImported` for listed job IDs | Verified |
| Malformed 10-question numbering | `job_46a65c55…/production-pyqs.json` numbers include `"3","1","4",…` | Verified |
| Authoritative AL-405 has 6 papers, no 2026 | `content/rgpv/aiml/semester-4/al-405/pyqs.json` | Verified |
| Golden fixture 8×16 English | `scripts/cms-reliability/fixtures/al405-jun-2026/golden-english.json` | Verified |
| Golden live test file exists | `scripts/cms-reliability/al405-jun-2026-golden.test.ts` | Verified |
| Historical suite 230 pass | `scripts/cms-reliability/.tmp-ocr/full-suite.log` | Historical |
| Extracted vs merged separation in review types | `review-types.ts` comments + `review-service.ts` | Verified |
| Prompt forbids inventing question text | `prompt-builder.ts` Rules section | Verified |
| Sharp / tesseract / pdfjs dependencies | `package.json` | Verified |
| `.cms` gitignored | `.gitignore` `.cms/` | Verified |
| Full UI E2E suite exists | Search found no Playwright/Cypress CMS suite | UNKNOWN / likely absent |
| Fresh test pass today | Not run | UNKNOWN |
| Every CMS route uses `requireCmsAuth` | Sampled yes; not exhaustive | Partially verified |
| Prisma used for CMS jobs | Not observed in job persistence path | UNKNOWN (likely unused for jobs) |

## 4. AL-405 job ID index (local artifacts)

| Job ID | questionsImported | Notable |
|---|---|---|
| `job_0dfd28383d3747e4a8a2646993e22b74` | 4 | Incomplete |
| `job_5161b4219a0341218b92c58005002a55` | 4 | |
| `job_a485dab1550046fabd584102180b9223` | 6 | |
| `job_15b303ce13f74691b105a53cc159dd4d` | 8 | AI diagram captions |
| `job_3ae056591630409984077de5df6b99ef` | 8 | Attachments |
| `job_5949fb0c104f48a99f912d2ee05ba603` | 8 | Page-level Gemini captions |
| `job_46a65c55c2c24f2686b76cb6d3e934a1` | 10 | Malformed numbers |

All were `awaiting_review` / `UNDER_REVIEW` when inspected.

## 5. Symbol quick-reference

| Symbol | File |
|---|---|
| `superviseJobPipeline` | `lib/content-pipeline/pipeline-supervisor.ts` |
| `LocalOcrEngine` | `lib/content-pipeline/local-ocr-engine.ts` |
| `buildStructuredDocument` | `lib/content-pipeline/structure-builder.ts` |
| `detectQuestionGroups` | `lib/content-pipeline/question-detector.ts` |
| `buildExtractionEvidence` | `lib/content-pipeline/extraction-evidence.ts` |
| `GeminiStructuringEngine` | `lib/content-pipeline/gemini-structuring.ts` |
| `validateAgainstEvidence` | `lib/content-pipeline/evidence-validator.ts` |
| `assessExtractionQuality` | `lib/content-pipeline/extraction-quality.ts` |
| `buildContentQualityIndicators` | `lib/content-pipeline/content-quality-indicators.ts` |
| `getReviewPackage` | `lib/content-pipeline/review-service.ts` |
| `runLocalSaveForJob` | `lib/content-pipeline/local-save-service.ts` |
| `requireCmsAuth` | `lib/cms-auth.ts` |
| `captureGitReview` | `lib/content-pipeline/git-review.ts` |

## 6. Environment variable names (no values)

From `.env.example` / code references (non-exhaustive):  
`CMS_LOCAL_MODE`, `CMS_ALLOW_CONTENT_WRITE`, `CMS_SERVICE_TOKEN`, `CMS_MAX_CONCURRENT_JOBS`, `CMS_OCR_PAGE_CONCURRENCY`, `NODE_ENV`, `VERCEL`, `VERCEL_ENV`, Clerk publishable/secret key names, Upstash URL/token names, Gemini keys via AI key manager.

**Do not copy secrets into documentation or commits.**

## 7. How to independently re-verify top failures

1. **Page count 0:** Open any AL-405 `import-diagnostics.json` and `raw-document.json`; read `buildExtractionEvidenceSummary` pageCount line.  
2. **50% OCR:** Trace `qualityIndicators.ocrConfidencePercent` construction in `getReviewPackage`.  
3. **QQ.1:** View `approval-panel.tsx` mapping label template.  
4. **Diagram captions:** Open `academic-document.json` `diagrams[0].caption` on `job_5949fb0c…`.  
5. **History divergence:** Print `questionsImported` for all AL-405 history files.  

## 8. Document set checklist

| File | Purpose |
|---|---|
| `README.md` | Entry + warnings |
| `SYSTEM_ARCHITECTURE.md` | Architecture + Mermaid |
| `END_TO_END_WORKFLOW.md` | Stage workflow |
| `FAILURE_ANALYSIS.md` | RCA + AL-405 |
| `COMPLETION_STATUS.md` | Status matrix |
| `TESTING_AND_VERIFICATION.md` | Tests |
| `KNOWN_ISSUES_AND_TECH_DEBT.md` | P0–P3 debt |
| `DATA_AND_RECOVERY.md` | Persistence |
| `HANDOVER.md` | Maintainer guide |
| `AUDIT_EVIDENCE.md` | This index |
