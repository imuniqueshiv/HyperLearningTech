# CMS Import Session — Release Readiness Report

Generated: 2026-07-18T05:55:19.185Z

## Overall

| Metric                               | Value                                                            |
| ------------------------------------ | ---------------------------------------------------------------- |
| Automated production readiness score | **100/100**                                                      |
| Assessment                           | **READY FOR STAGED PRODUCTION (with manual live E2E checklist)** |
| Offline tests passed                 | 21                                                               |
| Offline tests failed                 | 0                                                                |
| Suite exit                           | PASS                                                             |

## Checklist

| Area                                            | Result      |
| ----------------------------------------------- | ----------- |
| Architecture Verified                           | PASS        |
| Single Import (Writer-path / offline contracts) | PASS        |
| Duplicate Detection                             | PASS        |
| Merge                                           | PASS        |
| Resume                                          | PASS        |
| Writer                                          | PASS        |
| Atomic Writes                                   | PASS        |
| Review                                          | CONDITIONAL |
| Local Save                                      | CONDITIONAL |
| Git                                             | CONDITIONAL |
| Performance (offline concurrency)               | PASS        |
| Logging                                         | PASS        |
| Live OCR / Gemini / PDF E2E                     | CONDITIONAL |

## Test scenarios implemented

1. **Phase 1 (offline)** — merge→normalize contracts, incomplete paper rejection, Review Ready status mapping, atomic write + crash simulation
2. **Phase 2** — duplicate paper identity (`papersMatch`), zero adds on re-import, no duplicate IDs
3. **Phase 3** — merge 2024/2025 into 2022/2023, stable year/session ordering
4. **Phase 4** — `inferRetryStage` after Gemini/validation/writer failures; OCR not re-selected when OCR summary exists
5. **Phase 5** — 10 concurrent merges, 20 serial atomic writes, 50-question synthetic paper
6. **Logging** — DurationMs, RecoveryHint, merge.log / resume.log stage names

## Suite results

### phase-1-atomic-writer

- Exit: PASS (5941ms)
- pass=5 fail=0

```
▶ Phase 1: Writer-path contracts (offline)
  ✔ load → duplicate → merge → normalize produces valid ordered JSON (26.7542ms)
  ✔ rejects incomplete papers before merge handoff (validation) (7.1191ms)
  ✔ session status maps WRITTEN → Review Ready (2.2573ms)
✔ Phase 1: Writer-path contracts (offline) (39.6397ms)
▶ Atomic write
  ✔ writes via temp then rename; destination is valid JSON (32.9314ms)
  ✔ preserves existing file when temp write is abandoned (simulate crash) (17.1655ms)
✔ Atomic write (50.734ms)
ℹ tests 5
ℹ suites 2
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1061.4999

npm warn Unknown env config "devdir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
```

### phase-2-3-merge-duplicate

- Exit: PASS (6619ms)
- pass=5 fail=0

```
▶ Phase 2: Duplicate detection
  ✔ papersMatch identifies same year+month+exam (4.306ms)
  ✔ second import of same paper adds zero papers (2.4448ms)
  ✔ does not duplicate question or attachment IDs on re-import (0.6369ms)
✔ Phase 2: Duplicate detection (9.3698ms)
▶ Phase 3: Merge + normalize
  ✔ merges 2024/2025 into 2022/2023 without overwrite (10.9901ms)
  ✔ normalize keeps stable year → session order (1.0965ms)
✔ Phase 3: Merge + normalize (12.3657ms)
ℹ tests 5
ℹ suites 2
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 833.8323

npm warn Unknown env config "devdir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
```

### phase-4-resume

- Exit: PASS (12299ms)
- pass=5 fail=0

```
▶ Phase 4: Resume inference
  ✔ resumes from Gemini when OCR+Layout+Diagrams succeeded (5.7624ms)
  ✔ resumes from validation when structuring+schema succeeded (0.7866ms)
  ✔ resumes from writer when validation passed (0.4841ms)
  ✔ never suggests OCR when OCR summary exists (0.9504ms)
  ✔ blocks writer suggestion path when validation FAILED (caller gate) (0.478ms)
✔ Phase 4: Resume inference (14.9997ms)
ℹ tests 5
ℹ suites 1
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6232.5552

npm warn Unknown env config "devdir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
```

### phase-5-load

- Exit: PASS (7538ms)
- pass=3 fail=0

```
▶ Phase 5: Load / concurrency (offline)
  ✔ handles 10 concurrent independent merges without corruption (7.2949ms)
  ✔ serial atomic writes under contention leave valid final JSON (126.1486ms)
  ✔ large synthetic paper (50 questions) merges and sorts deterministically (29.5312ms)
✔ Phase 5: Load / concurrency (offline) (165.4952ms)
ℹ tests 3
ℹ suites 1
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1071.1605

npm warn Unknown env config "devdir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
```

### logging-contract

- Exit: PASS (6692ms)
- pass=3 fail=0

```
▶ Logging contracts
  ✔ writes SUCCESS block with DurationMs and RecoveryHint (21.8983ms)
  ✔ writes FAILURE block with stack and resume hint (20.3623ms)
  ✔ supports merge and resume log names (14.8908ms)
✔ Logging contracts (75.4698ms)
ℹ tests 3
ℹ suites 1
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 957.7176

npm warn Unknown env config "devdir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
```

## Critical issues

- None from automated suites.

## High priority issues

- None from automated suites.

## Medium priority issues

- Live single-PDF E2E (OCR→Gemini→Review→Save→Git) is not automated in CI; requires GEMINI keys + sample PDF.
- Writer stage previously lacked stage logs (now wired); verify on next live import.

## Low priority issues

- Paper identity uses year+month+exam only (branch/semester/subject enforced by content path, not papersMatch).
- Load test covers concurrent merge/atomic write offline; not live 50-page OCR concurrency.

## Recommended fixes

1. Run one live Import Session with a complete PDF (not page images) and confirm logs under `.cms/uploads/<jobId>/logs/` for ocr, layout, structuring, schema, validation, writer, merge, resume.
2. Re-import the same paper and confirm Writer merge stats show `papersAdded: 0` and `git diff` is empty after Local Save skip.
3. Force Gemini failure (invalid key), confirm resume starts at structuring and OCR is not re-run.
4. Add a CI job: `npm run cms:verify` on every PR touching `lib/content-pipeline`.
5. Optionally add a gated live suite behind `CMS_LIVE_E2E=1` + sample PDF fixture (out of default CI).

## Manual live E2E checklist (required before full production)

- [ ] Upload one complete PDF PYQ
- [ ] Background processing reaches Review Ready
- [ ] OCR page count matches PDF pages; order preserved
- [ ] Gemini structured response has no hallucinated questions
- [ ] Schema validation PASS
- [ ] Review JSON / Diff / Diagrams match pending artifacts
- [ ] Approve → Local Save writes `pyqs.json`
- [ ] `git status` / `git diff` show only expected content paths
- [ ] Duplicate re-import skipped
- [ ] Resume after forced Gemini failure skips OCR/Layout

## Architecture note

Public workflow unchanged:

Upload → Background Processing → Review → Approve → Local Save → Git

No architecture redesign in this RC phase. Hardening limited to: exported `papersMatch`, writer/merge/resume stage logs, DurationMs + RecoveryHint in stage logs, offline reliability suite.
