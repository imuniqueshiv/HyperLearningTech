# Failure Analysis

**Audit date:** 2026-10-10  
**Related:** [COMPLETION_STATUS.md](./COMPLETION_STATUS.md) · [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md) · [AUDIT_EVIDENCE.md](./AUDIT_EVIDENCE.md)

## 1. Method

This analysis uses:

1. Current TypeScript sources under `lib/content-pipeline/**` and CMS UI components
2. On-disk AL-405 job artifacts under `.cms/uploads/` and `.cms/history/`
3. Golden fixture `scripts/cms-reliability/fixtures/al405-jun-2026/`
4. Prior session log artifact `scripts/cms-reliability/.tmp-ocr/full-suite.log` (**historical**, not re-run)

No import was re-executed for this audit.

## 2. Why the pipeline still fails (systemic)

The system is a **multi-stage probabilistic pipeline** (OCR → geometry → heuristics → LLM) with **structural validators** that largely check shapes, counts, and token presence—not semantic fidelity to the printed English paper.

Repeated AL-405 imports of the **same PDF** produced conflicting `production-pyqs.json` question counts (**4, 6, 8, 10**) while all remain `awaiting_review`. That alone proves **extraction is not deterministic/reliable** on this real document class, regardless of unit-test greenness.

Additionally, the Review Center surfaces **indicators computed from incomplete or defaulted fields**, which can make a bad extraction look “measured” when numbers are placeholders.

## 3. Issue register

### Issue A — Page-count diagnostic shows 0 while OCR has 2 pages

| Field              | Content                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue              | Review / diagnostics report `pageCount: 0` despite `raw-document.json` having 2 pages                                                                                                                                                                                                                         |
| Evidence           | `review-service.ts` `buildExtractionEvidenceSummary`: `pageCount: evidenceFile?.pages?.length ?? 0` — but `ExtractionEvidence` has **no `pages` array** (`extraction-evidence.ts`). Jobs e.g. `job_15b303ce…`, `job_5949fb0c…`: `import-diagnostics.json` `pageCount: 0`, `raw-document` `pageCount/pages: 2` |
| Status             | **Confirmed**                                                                                                                                                                                                                                                                                                 |
| Root cause         | Summary maps a non-existent `evidenceFile.pages` field; null/undefined length becomes 0; diagnostics inherit that when written from review                                                                                                                                                                    |
| Impact             | Operators cannot trust page coverage metrics; “zero pages” contradicts source evidence                                                                                                                                                                                                                        |
| Current mitigation | Raw document still stores real pages; sourcePages on questions may still list 1/2                                                                                                                                                                                                                             |
| Remaining gap      | Indicator pipeline not wired to `raw.pages.length` / metadata.pageCount consistently                                                                                                                                                                                                                          |
| Reproduction       | Open Review for any AL-405 job above; compare diagnostics pageCount vs `raw-document.json`                                                                                                                                                                                                                    |

### Issue B — OCR confidence reported ~50% as placeholder

| Field              | Content                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue              | UI shows ~50% OCR confidence even when per-block OCR confidence exists elsewhere                                                                                                                                          |
| Evidence           | `review-service.ts` candidate fallback sets `confidence: 0.5`; `confToNum` defaults unknown → `0.5`; `content-quality-indicators.ts` multiplies avg by 100 → **50%**. Candidate path used when academic confidence absent |
| Status             | **Confirmed** (mechanism); observed “50%” reports match this path                                                                                                                                                         |
| Root cause         | Review summary does not average real Tesseract block confidences from `raw-document`; uses defaults / coarse HIGH/MEDIUM/LOW maps                                                                                         |
| Impact             | Readiness (`ocrConfidencePercent < 70` → `NEEDS_REVIEW`) and human trust are driven by a **synthetic** score                                                                                                              |
| Current mitigation | Low confidence forces `NEEDS_REVIEW` / blocks READY save — conservative but based on wrong measurement                                                                                                                    |
| Remaining gap      | No verified end-to-end wiring from OCR block confidence → review indicator                                                                                                                                                |
| Reproduction       | Inspect `approval-panel` OCR % on jobs whose evidence summary used candidate fallback                                                                                                                                     |

### Issue C — `QQ.1`-style labels in question→source mapping

| Field              | Content                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue              | UI shows labels like `QQ.1`                                                                                                                                                            |
| Evidence           | `approval-panel.tsx`: `{q.paperId} Q{q.questionNumber}` while `questionNumber` is already `"Q.1"` → renders `… QQ.1`. No `QQ.` strings found in stored JSON (scan of `.cms/**/*.json`) |
| Status             | **Confirmed** (display bug); not a stored canonical number of `QQ.1`                                                                                                                   |
| Root cause         | Double prefix in UI                                                                                                                                                                    |
| Impact             | Confuses reviewers; looks like numbering corruption                                                                                                                                    |
| Current mitigation | None in UI                                                                                                                                                                             |
| Remaining gap      | Display formatting not normalized                                                                                                                                                      |
| Reproduction       | Review Center → Question → source mapping list                                                                                                                                         |

### Issue D — Unsupported / hallucinated diagram attachments and AI captions

| Field              | Content                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue              | Full exam page images attached as question diagrams with Gemini-written captions/alt/aiContext                                                                                                                                                                                                                                  |
| Evidence           | `job_15b303ce…` production attachments: `diagrams/page-1/Q.2.webp` caption _“Diagram showing the architecture of Multilayer Perceptron…”_; `job_5949fb0c…` captions describe **entire exam pages**. `diagram-metadata.ts` claims no AI captions; `diagram-ai-context.ts` + Gemini apply enrichment when `needsDiagramAiContext` |
| Status             | **Confirmed** in artifacts                                                                                                                                                                                                                                                                                                      |
| Root cause         | Diagram stage crops/page-exports images; structuring/vision enrichment invents semantic captions; attachment path treats them as figures                                                                                                                                                                                        |
| Impact             | False figures in preview/save candidates; policy conflict with “do not invent”                                                                                                                                                                                                                                                  |
| Current mitigation | Prompt rules discourage invention for question text; **diagram path still enriches**                                                                                                                                                                                                                                            |
| Remaining gap      | No strong “figure vs full-page scan” gate before attach                                                                                                                                                                                                                                                                         |
| Reproduction       | Inspect `academic-document.json` `diagrams[]` and `production-pyqs.json` attachments on AL-405 jobs                                                                                                                                                                                                                             |

### Issue E — Duplicate import history with inconsistent question counts

| Field              | Content                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue              | Multiple AL-405 June 2026 history rows; `questionsImported` differs                                                                         |
| Evidence           | History: `job_0dfd…`/`job_5161…` → 4; `job_a485…` → 6; several → 8; `job_46a65c…` → **10** with malformed numbers `["Q.1","3","Q.3","1",…]` |
| Status             | **Confirmed**                                                                                                                               |
| Root cause         | Each upload creates a new job; extraction nondeterminism / pipeline version drift across attempts; no automatic collapse of duplicates      |
| Impact             | Operators cannot tell which attempt is “correct”; risk of saving wrong candidate                                                            |
| Current mitigation | Duplicate-paper detector on save/review (code exists); history delete service exists but was not audited as used                            |
| Remaining gap      | No single “best extraction” selection; history remains noisy                                                                                |
| Reproduction       | Compare `.cms/history/job_*.json` for `al-405-machine-learning-jun-2026.pdf`                                                                |

### Issue F — Numeric / table checks show REVIEW

| Field              | Content                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------- |
| Issue              | Review flags numeric/table checks as REVIEW                                                             |
| Evidence           | `inferCheckStatuses` in `content-quality-indicators.ts` marks REVIEW when warning codes match `/NUMERIC | NUMBER_FIDELITY | TABLE/i`. Evidence validator emits `AI*NUMBER*\*`, table warnings, etc. |
| Status             | **Confirmed mechanism**; specific warning lists per job **PARTIALLY VERIFIED**                          |
| Root cause         | Mixed: genuine OCR digit risk + aggressive warning categorization + AI number drift checks              |
| Impact             | Correctly signals uncertainty, but can also fire on bilingual/ocr noise without tables                  |
| Current mitigation | REVIEW status visible; save still gated by broader extractionQuality                                    |
| Remaining gap      | Distinguishing real tables from false warnings                                                          |
| Reproduction       | Open review quality panel on AL-405 jobs with evidence warnings                                         |

### Issue G — Readiness / quality indicators miscommunicate extraction quality

| Field              | Content                                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue              | Schema PASS + 8 questions can still be wrong English / wrong attachments; indicators may look “objective” while backed by defaults                                                 |
| Evidence           | Issues A–D; `extraction-quality.ts` separates schema vs quality but still consumes possibly synthetic OCR %; historical jobs with 8 questions still have invented diagram captions |
| Status             | **Confirmed** for indicator defects; broader “misleading readiness” **likely**                                                                                                     |
| Root cause         | Metrics ≠ semantic fidelity; placeholder math                                                                                                                                      |
| Impact             | Humans may approve based on wrong signals                                                                                                                                          |
| Current mitigation | `canSave` only when `READY`; low/placeholder OCR forces `NEEDS_REVIEW`                                                                                                             |
| Remaining gap      | No ground-truth comparison in review UI                                                                                                                                            |
| Reproduction       | Compare preview text to PDF / `golden-english.json`                                                                                                                                |

### Issue H — OCR accuracy on bilingual two-column scans

| Field              | Content                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Issue              | OCR recovers wrong order, Hindi bleed, damaged markers (`I.` for `1.`, `Leaning`, packed markers)                                                                                                |
| Evidence           | `extraction-evidence` sample text on `job_15b303ce…` still shows OCR damage and Indic fragments in candidate text; prior engineering notes + `english-text.ts` / column OCR exist as mitigations |
| Status             | **Confirmed** residual OCR damage in artifacts; mitigations **partially present** in code                                                                                                        |
| Root cause         | Tesseract on landscape bilingual scans + layout heuristics                                                                                                                                       |
| Impact             | Downstream segmentation/AI inherit errors                                                                                                                                                        |
| Current mitigation | English filter, marker split, column OCR (current tree)                                                                                                                                          |
| Remaining gap      | Not consistently producing clean English-only evidence across jobs                                                                                                                               |
| Reproduction       | Diff candidate text vs `golden-english.json`                                                                                                                                                     |

### Issue I — AI normalization inventing or rewriting content

| Field              | Content                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Issue              | Gemini may invent diagram semantics and can alter wording; prompts forbid it but enforcement is incomplete                |
| Evidence           | Diagram captions (Issue D); `prompt-builder.ts` rules; `evidence-validator` number/text grounding (added in working tree) |
| Status             | **Confirmed** for diagrams; question-text invention **likely / job-dependent**                                            |
| Root cause         | LLM used for normalization + vision captions; validators don’t block all semantic inventions                              |
| Impact             | Preview not equal to paper                                                                                                |
| Current mitigation | Evidence prompts + validator errors for some cases                                                                        |
| Remaining gap      | No mandatory “evidence-only verbatim” writer path without Gemini for PYQ text                                             |
| Reproduction       | Compare academic captions to actual page pixels                                                                           |

### Issue J — Unit tests pass while real extraction fails

| Field              | Content                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Issue              | Reliability suite green ≠ production extraction trust                                                                                   |
| Evidence           | Historical `full-suite.log`: 230 pass / 0 fail; simultaneous AL-405 artifact divergence (Issue E)                                       |
| Status             | **Confirmed** as a process failure mode                                                                                                 |
| Root cause         | Many tests are synthetic/structural; live golden exists but real CMS path still includes Gemini/diagrams/UI mapping                     |
| Impact             | False confidence                                                                                                                        |
| Current mitigation | AL-405 golden live OCR test in suite (working tree) — asserts structure+wording through local OCR path **without claiming CMS UI path** |
| Remaining gap      | Full CMS import→review→save E2E against golden not proven in this audit                                                                 |
| Reproduction       | Contrast suite log with `.cms` AL-405 production-pyqs variance                                                                          |

### Issue K — Checkpoint / resume reuse of stale stage outputs

| Field              | Content                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Issue              | Resume skips completed stages; risk of mixing pipeline versions or stale OCR with new code |
| Evidence           | `superviseJobPipeline` skip logic; multiple AL-405 jobs across days                        |
| Status             | **Likely** contributor to divergent counts; not proven per job                             |
| Root cause         | Checkpoint completeness ≠ semantic validity for current code version                       |
| Impact             | Confusing “same PDF, different results”                                                    |
| Current mitigation | New upload = new jobId (isolates somewhat)                                                 |
| Remaining gap      | No pipeline-version hash gate on resume                                                    |
| Reproduction       | REQUIRES MANUAL VERIFICATION with controlled resume experiments                            |

## 4. AL-405 June 2026 case study

### 4.1 Source document (verifiable)

| Item                  | Value                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Fixture PDF           | `scripts/cms-reliability/fixtures/al405-jun-2026/al-405-machine-learning-jun-2026.pdf`                                |
| Golden English        | `…/golden-english.json` — subject AL-405, June 2026, **8 questions / 16 sub-parts**                                   |
| Characteristics       | Scanned, bilingual English/Hindi, landscape two-column layout (**verified** by prior OCR artifacts + fixture purpose) |
| Authoritative content | `content/rgpv/aiml/semester-4/al-405/pyqs.json` currently has **6 papers (2022–2025)** — **no June 2026** saved       |

### 4.2 Recorded extraction attempts (local `.cms`, gitignored)

| Job ID (prefix) | questionsImported / prod_qs | Notes                     |
| --------------- | --------------------------- | ------------------------- |
| `job_0dfd2838…` | 4                           | Incomplete set Q.1,5,6,7  |
| `job_5161b421…` | 4                           | Historical                |
| `job_a485dab1…` | 6                           | Historical                |
| `job_15b303ce…` | 8                           | Attachments + AI captions |
| `job_3ae05659…` | 8                           | Attachments               |
| `job_5949fb0c…` | 8                           | Page-as-diagram captions  |
| `job_46a65c55…` | **10**                      | Malformed numbering       |

All listed status: `awaiting_review` / stage `UNDER_REVIEW` at inspection time.

### 4.3 Mapping reported symptoms → current classification

| Reported symptom                      | Classification                                                        |
| ------------------------------------- | --------------------------------------------------------------------- |
| 8-question preview with subquestions  | **Confirmed** on several jobs; **not** universal (4/6/10 also exist)  |
| Unsupported diagram captions          | **Confirmed**                                                         |
| OCR confidence ~50%                   | **Confirmed mechanism** (placeholder 0.5); may not equal true OCR avg |
| Page count zero vs pages 1–2 evidence | **Confirmed**                                                         |
| `QQ.1` labels                         | **Confirmed UI bug**                                                  |
| Numeric/table REVIEW                  | **Confirmed mechanism**; per-job warnings partially inspected         |
| Duplicate history                     | **Confirmed**                                                         |
| Misleading readiness                  | **Confirmed** for indicators; approve/save gates still exist in code  |

### 4.4 What this case proves / suggests / does not prove

**Proves**

- Same source PDF can yield incompatible extraction packages.
- Review diagnostics can contradict raw OCR artifacts.
- Gemini diagram enrichment invents captions for non-figure images.
- Authoritative AL-405 content was not updated with June 2026 in the inspected tree.

**Suggests**

- Pipeline version / OCR nondeterminism / AI variance drive history noise.
- Humans cannot rely on a single “latest” history row without opening artifacts.

**Does not prove**

- That the newest working-tree code would always produce 16/16 golden wording inside the **full CMS+Gemini** path (golden test targets local OCR→layout→evidence; CMS jobs include more stages).
- That production site content is corrupted (June 2026 not present).
- That every RGPV paper fails the same way.

## 5. Additional evidence required (if work resumes)

1. Side-by-side: PDF page image ↔ `production-pyqs` text ↔ golden English for one frozen jobId
2. Trace one review package JSON from API response (pageCount, ocrConfidencePercent, question mapping strings)
3. Pipeline version / commit hash stamped into `metadata.json` at job start
4. Disable diagram AI enrichment and re-compare attachments
5. Controlled A/B of Gemini on vs evidence-only fallback for question text

Until then, treat CMS extraction output as **draft requiring expert review**, not as ground truth.
