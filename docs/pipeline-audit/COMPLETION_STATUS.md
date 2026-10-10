# Completion Status

**Audit date:** 2026-10-10  
**Related:** [FAILURE_ANALYSIS.md](./FAILURE_ANALYSIS.md) · [TESTING_AND_VERIFICATION.md](./TESTING_AND_VERIFICATION.md) · [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md)

## 1. Status vocabulary

| Status                            | Meaning                                                    |
| --------------------------------- | ---------------------------------------------------------- |
| `IMPLEMENTED AND VERIFIED`        | Code exists; behavior confirmed via source + safe evidence |
| `IMPLEMENTED, PARTIALLY VERIFIED` | Code exists; only partially confirmed                      |
| `IMPLEMENTED BUT UNRELIABLE`      | Code exists; real outputs show correctness failures        |
| `PARTIALLY IMPLEMENTED`           | Incomplete relative to stated goals                        |
| `NOT IMPLEMENTED`                 | Missing                                                    |
| `UNKNOWN / NOT VERIFIED`          | Insufficient evidence in this audit                        |

## 2. Dimension matrix

| Dimension                    | Status                            | Evidence-based justification                                                                                   |
| ---------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Architecture / modules       | `IMPLEMENTED, PARTIALLY VERIFIED` | Large `lib/content-pipeline` + CMS routes exist; stage supervisor verified; not every file path exercised live |
| Upload / normalization       | `IMPLEMENTED, PARTIALLY VERIFIED` | `upload-service`, MIME/size limits, import-limits; live upload not re-run                                      |
| OCR / reading order          | `IMPLEMENTED BUT UNRELIABLE`      | Engine + heuristics present; AL-405 artifacts show OCR damage / variance                                       |
| Question segmentation        | `IMPLEMENTED BUT UNRELIABLE`      | Detector/numbering code present; jobs show 4–10 question outcomes                                              |
| AI normalization             | `IMPLEMENTED BUT UNRELIABLE`      | Gemini structuring + prompts; invents diagram captions; question fidelity job-dependent                        |
| Numeric / table preservation | `PARTIALLY IMPLEMENTED`           | Token extraction + validators exist; table-heavy real coverage sparse                                          |
| Diagram handling             | `IMPLEMENTED BUT UNRELIABLE`      | Extraction + AI context; attaches page scans with generated captions                                           |
| Validation / quality gates   | `IMPLEMENTED, PARTIALLY VERIFIED` | Schema + eligibility + extractionQuality gates in save path; indicators buggy                                  |
| Human review                 | `IMPLEMENTED, PARTIALLY VERIFIED` | Review package + UI; misleading metrics confirmed                                                              |
| Import history / recovery    | `IMPLEMENTED BUT UNRELIABLE`      | History/checkpoints exist; duplicates + inconsistent counts                                                    |
| Persistence / storage        | `IMPLEMENTED AND VERIFIED`        | `.cms` vs `content/rgpv` boundary clear; content write gated                                                   |
| AuthZ / local isolation      | `IMPLEMENTED AND VERIFIED`        | `CMS_LOCAL_MODE` fail-closed; Git mutation blocked                                                             |
| Testing                      | `IMPLEMENTED, PARTIALLY VERIFIED` | Broad suite files; historical 230 pass log; semantic gaps remain                                               |
| Production readiness         | `NOT IMPLEMENTED` (as a claim)    | Explicitly **not** production-ready for unattended extraction                                                  |

## 3. Explicit answers

### 1. What is actually completed?

- Local-only CMS shell (upload, queue, stage APIs, review UI, history)
- Filesystem job workspace model under `.cms/`
- Supervisor with timeouts/checkpoints/resume skips
- OCR/layout/structuring/validation/writer pipeline wiring
- Eligibility, duplicate detection, extraction-quality save gate (code)
- Read-only Git review helpers
- Substantial automated reliability tests (structural + some real-fixture)
- Golden AL-405 English fixture + live OCR golden test file (working tree)

### 2. What works only in limited / controlled scenarios?

- Synthetic geometry unit tests (known bboxes, clean English)
- Some committed native-text / JBIG2 fixtures when present
- Evidence-only reconstruction paths without Gemini (test harnesses)
- Sharp preprocess when Node/npm toolchain is healthy

### 3. What remains broken or unreliable?

- Real bilingual scanned multi-column extraction consistency
- Diagram attachment semantics / AI captions
- Review pageCount and OCR% indicators
- `QQ.1` display labeling
- Duplicate noisy import history
- Trustworthy “READY” as synonym for “matches the paper”

### 4. What is incomplete or missing?

- End-to-end CMS import→review API package golden assertion (not verified here)
- Pipeline-version stamping for resume safety (**NOT VERIFIED** as present)
- Comprehensive real corpus for tables/rotation/poor scans (coverage matrix admits gaps)
- Automatic collapse/dedup of failed historical attempts

### 5. What was attempted repeatedly without a reliable solution?

- AL-405 June 2026 full-fidelity extraction via CMS imports (many jobs, divergent counts)
- Making review metrics accurately reflect OCR/page reality
- Preventing Gemini from inventing diagram semantics while still “enriching” figures

### 6. Which reported test results are verified in the current repository?

| Result                               | Verification in this audit                |
| ------------------------------------ | ----------------------------------------- |
| `full-suite.log` → 230 pass / 0 fail | **Historical artifact only** — not re-run |
| AL-405 golden fixture files present  | **Verified** on disk                      |
| Suite file list in `package.json`    | **Verified**                              |
| Fresh typecheck/lint/build today     | **NOT VERIFIED** (not executed)           |

### 7. Why do passing tests not guarantee correct extraction?

- Many assertions check structure, parsing, gates, or synthetic OCR geometry.
- Live CMS path adds Gemini + diagram AI + UI mapping layers not fully locked to golden wording.
- Real jobs in `.cms` contradict each other on the same PDF.
- Indicators under test may not be the same fields the UI displays incorrectly.

### 8. Is the pipeline safe for production use today?

**No.**

Evidence:

- CMS is correctly **local-only** (good for not exposing writes on Vercel).
- Extraction outputs are **not** reliable enough to publish without expert verification.
- Review UI can **mis-report** page count and OCR confidence.
- Diagram path can attach **invented** captions.
- Multiple incompatible AL-405 packages exist awaiting review.

“Safe” here means: do not treat automated extraction as authoritative public content. Local authoring with human verification remains the only tenable use—and even then, indicators must be treated with suspicion.

## 4. Completion percentage

**No single percentage is published.**

Reasons:

- Implementation completeness ≠ extraction accuracy ≠ operational readiness.
- Large uncommitted working tree means “repo HEAD” and “working tree” differ.
- Historical suite pass rate does not measure semantic PYQ fidelity.

If a future score is required, use **three separate scores** with explicit rubrics:

1. **Module presence** (files/stages wired)
2. **Semantic accuracy** on a frozen real-PDF corpus vs golden text
3. **Operational safety** (auth, content gates, no auto-publish)

Do not average them into one vanity number.
