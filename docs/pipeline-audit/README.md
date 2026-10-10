# HyperLearningTech CMS / PYQ Pipeline — Technical Audit Pack

**Audit date:** 2026-10-10  
**Repository:** `hyper-learning-tech`  
**Git branch at audit:** `main`  
**Owner decision:** Pipeline development is **paused**. This pack is a documentation and handover record only.

## Scope

This audit documents the **local CMS Previous Year Question (PYQ) extraction pipeline**: upload → OCR/layout → AI normalization → validation → human review → optional local save → manual Git publishing.

It covers:

- Architecture and module inventory as implemented in the current working tree
- End-to-end workflow and persistence boundaries
- Failure analysis (including AL-405 June 2026 case study)
- Completion status, testing audit, tech debt, and handover guidance

## Current status (summary)

| Dimension | Verdict |
|---|---|
| CMS architecture / local-only boundary | Largely implemented; production CMS routes fail closed |
| Extraction correctness on real scanned bilingual papers | **Unreliable** — multiple AL-405 imports disagree |
| Review UI quality indicators | **Misleading** in confirmed cases (page count, OCR %, `QQ.1` labels) |
| Authoritative `content/rgpv/**` for AL-405 | Unchanged by latest imports inspected (no June 2026 paper saved) |
| Automated reliability suite (historical log artifact) | Prior run reported 230/0; **not re-executed in this audit** |
| Production readiness | **Not ready** |

## Documents

| File | Contents |
|---|---|
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Modules, boundaries, Mermaid architecture, security |
| [END_TO_END_WORKFLOW.md](./END_TO_END_WORKFLOW.md) | Stage-by-stage workflow, artifacts, failure branches |
| [FAILURE_ANALYSIS.md](./FAILURE_ANALYSIS.md) | Root-cause analysis + AL-405 case study |
| [COMPLETION_STATUS.md](./COMPLETION_STATUS.md) | Status matrix and production-readiness assessment |
| [TESTING_AND_VERIFICATION.md](./TESTING_AND_VERIFICATION.md) | Tests, assertions, gaps, safe commands |
| [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md) | Prioritized unresolved work |
| [DATA_AND_RECOVERY.md](./DATA_AND_RECOVERY.md) | `.cms` vs authoritative content, checkpoints, recovery |
| [HANDOVER.md](./HANDOVER.md) | Practical guide for a future maintainer |
| [AUDIT_EVIDENCE.md](./AUDIT_EVIDENCE.md) | Claim → evidence index |

## Major warnings

1. **Do not treat a green unit-test suite as extraction correctness.** Structural tests can pass while OCR text, numbering, and attachments are wrong.
2. **Do not save AL-405 June 2026 from an existing review session without independent human verification** against the PDF and the golden English fixture.
3. **Review indicators can lie:** page count can show `0` while `raw-document.json` has 2 pages; OCR confidence can show `50%` from a hardcoded fallback; `QQ.1` is a UI double-prefix bug when `questionNumber` is already `Q.1`.
4. **Diagram captions/alt/aiContext are Gemini-generated** for many jobs and attach full page scans as “diagrams,” not verified figures.
5. **`.cms/` is gitignored local state.** Multiple duplicate AL-405 history entries exist with question counts 4 / 6 / 8 / 10.
6. **Large uncommitted working-tree changes** exist on `main`. Preserve them; do not assume they are committed or production-safe.
7. **This audit does not modify application code, run imports, or mutate `content/rgpv/**`.**

## What a future maintainer should read first

1. This README  
2. [HANDOVER.md](./HANDOVER.md)  
3. [FAILURE_ANALYSIS.md](./FAILURE_ANALYSIS.md) (AL-405 section)  
4. [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)  
5. [AUDIT_EVIDENCE.md](./AUDIT_EVIDENCE.md) when verifying any claim  

## Evidence posture

| Label | Meaning |
|---|---|
| **Verified** | Confirmed in current source and/or on-disk artifacts during this audit |
| **Historical** | Observed in prior logs/reports/artifacts; may or may not still dominate |
| **Hypothesis** | Plausible but not fully proven |
| **UNKNOWN / NOT VERIFIED** | Not safely confirmed in this audit |

## What this audit executed

Read-only inspection only:

- `git status`, `git log`, file listings, targeted source reads
- Inspection of `.cms/history` and selected `.cms/uploads/job_*` JSON artifacts
- Inspection of fixtures under `scripts/cms-reliability/fixtures/al405-jun-2026/`
- Reading of a prior `scripts/cms-reliability/.tmp-ocr/full-suite.log` artifact (not a fresh run)

**Not executed:** imports, OCR jobs, CMS save, full `npm test`, `build`, commits, pushes, deployments, content writes.
