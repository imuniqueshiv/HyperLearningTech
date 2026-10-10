# Testing and Verification Audit

**Audit date:** 2026-10-10  
**Related:** [COMPLETION_STATUS.md](./COMPLETION_STATUS.md) · [FAILURE_ANALYSIS.md](./FAILURE_ANALYSIS.md) · [AUDIT_EVIDENCE.md](./AUDIT_EVIDENCE.md)

## 1. Test inventory (repository)

### Commands (from `package.json`)

| Command | What it runs | Side effects |
|---|---|---|
| `npm run test` / `cms:verify` | `tsx --test` on an explicit list of `scripts/cms-reliability/*.test.ts` | Should be mostly local/temp; **may create tmp OCR dirs** for live tests; does **not** write `content/rgpv` by design of those tests — still avoid running if disk/CPU constraints matter |
| `cms:sharp` | Sharp smoke | Local only |
| `typecheck` / `lint` / `format:check` / `build` | Static/build | Build writes `.next`; not content |

**This audit did not execute the full suite.** A prior artifact `scripts/cms-reliability/.tmp-ocr/full-suite.log` records:

```text
ℹ tests 230
ℹ suites 68
ℹ pass 230
ℹ fail 0
```

Treat as **historical**, environment-specific, not re-validated today.

### Test files listed in `package.json` `test` script

Includes (non-exhaustive naming): phase-1 atomic writer, phase-2/3 merge-duplicate, phase-4 resume, phase-5 load, logging-contract, pipeline-supervisor, ocr-quality, metadata-extractor, jbig2-raster, merge-trim-crash, nov-2023-validation-uimap, phase1-foundation, phase2-extraction, phase2-hardening, phase2-real-document-acceptance, phase3-acceptance, document-eligibility, history-delete, content-upload-selection, review-data-integrity, **al405-jun-2026-golden**, **pipeline-failure-classes**.

Approximate: **22** `*.test.ts` files under `scripts/cms-reliability/` (~5.5k lines total including non-listed helpers).

## 2. Coverage by pipeline stage (assertion-oriented)

| Stage | Unit / synthetic | Integration | Real PDF / live OCR | Notes |
|---|---|---|---|---|
| Upload constraints / selection | Yes (`content-upload-selection`) | Limited | No | |
| Atomic writer / merge / resume | Yes (phase-1/2/3/4) | Yes | No | Persistence mechanics |
| Supervisor / timeouts | Yes (`pipeline-supervisor.test`) | Partial | No | |
| Question numbering / markers | Yes (`phase2-extraction`, failure-classes, review-data-integrity) | — | — | Strong structural |
| Reading order / two-column | Yes | — | Limited | Synthetic geometry |
| Cross-page continuation | Yes (`phase2-hardening`) | — | Limited | |
| Evidence vs AI hallucination (numbers/text) | Yes | — | — | Does not prove Gemini live behavior |
| Eligibility | Yes (`document-eligibility.test`) | — | Synthetic reject cases | |
| Extraction quality gates | Yes | — | — | |
| Review extracted vs merged / syllabus isolation | Yes (`review-data-integrity`) | — | — | |
| Real document acceptance | Partial registry | Replay when raw JSON present | Live OCR when fixture on disk | Missing fixtures skipped honestly |
| AL-405 golden | Synthetic exact wording + **live PDF OCR** test | — | Yes (fixture PDF) | Asserts evidence path, not full Gemini/CMS UI |
| Sharp | `verify-sharp.ts` | — | — | Smoke |
| Full CMS UI E2E | **No verified Playwright/Cypress suite found** | — | — | **NOT VERIFIED / likely absent** |

## 3. AL-405 / golden fixtures

| Fixture | Present? | What it tests |
|---|---|---|
| AL-405 June **2026** PDF + `golden-english.json` | **Yes** | Exact English Q1–Q8 / 16 parts; live OCR→structure→evidence; quality gate low-OCR → NEEDS_REVIEW |
| June **2022** “golden” | **Not found as a golden extraction fixture** | June 2022 exists as **authoritative historical paper** inside `content/rgpv/aiml/semester-4/al-405/pyqs.json` — not a pipeline golden |
| Phase3 coverage matrix | `fixtures/phase3-coverage.ts` | Documents intended corpus dimensions; many entries note limited real fixtures |

## 4. Semantic vs structural assertions

**Structural (common):** parse markers, sort reading order, schema shape, gate codes, merge counts, eligibility codes, supervisor resume inference.

**Semantic / ground-truth (limited):**

- AL-405 golden live test asserts **exact English substrings** after `preferEnglishExamText` normalization against golden JSON.
- Real-document acceptance focuses on structural properties / inventory honesty more than full wording corpora.

**Gap:** Passing `phase2-extraction` does not imply a CMS review package for AL-405 matches the PDF.

## 5. Missing edge cases (acknowledged)

From coverage matrix + artifact reality:

- Rotated pages  
- Poor-quality scans  
- Table-heavy papers  
- Equation-heavy papers  
- Mixed native+scan hybrids at scale  
- Merged multi-paper PDFs as live OCR (eligibility often synthetic)  
- Diagram-true vs full-page-false-positive classification  
- UI indicator correctness tests (pageCount 0 / QQ.1 / 50% confidence) — **not covered** by current assertions inspected

## 6. Safe verification commands (if a maintainer chooses later)

Prefer Program Files Node/npm on Windows if Anaconda shims break `npm`.

| Intent | Safer approach |
|---|---|
| Sharp only | `./node_modules/.bin/tsx scripts/cms-reliability/verify-sharp.ts` |
| Fast unit subset | `tsx --test scripts/cms-reliability/pipeline-failure-classes.test.ts` (no live OCR) |
| AL-405 live OCR | `tsx --test --test-name-pattern="real scanned PDF" scripts/cms-reliability/al405-jun-2026-golden.test.ts` — **CPU heavy**; writes under `scripts/cms-reliability/.tmp-ocr/` |
| Inspect artifacts | Read `.cms/uploads/<jobId>/*.json` — do **not** save |
| Avoid | CMS save with `CMS_ALLOW_CONTENT_WRITE=true`; deleting `.cms/history`; running imports “to clean” data |

## 7. Gap vs production claims

| Claim type | Supported by tests? |
|---|---|
| “Pipeline modules exist and wire together” | Partially |
| “Validators catch some invented numbers” | Yes (unit) |
| “Every RGPV scan extracts correctly” | **No** |
| “Review metrics are accurate” | **No** (bugs contradict) |
| “CMS is production-safe to expose” | Auth fail-closed tested in places; **not** the same as extraction quality |

## 8. What this audit verified about tests

- Test script membership and file presence: **Verified**  
- Fresh pass/fail counts today: **NOT VERIFIED**  
- Historical 230/0 log: **Observed artifact**  
- Golden AL-405 files: **Verified present**  
- UI indicator bugs covered by tests: **Not found**
