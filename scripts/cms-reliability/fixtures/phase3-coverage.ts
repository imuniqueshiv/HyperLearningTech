/**
 * Phase 3 golden / real-document coverage matrix.
 * Marks what is available locally vs unavailable (honest — no fabricated "real" PDFs).
 */

export type CoverageStatus =
  | "AVAILABLE"
  | "SYNTHETIC_ONLY"
  | "UNAVAILABLE"
  | "PARTIAL";

export interface Phase3CoverageRow {
  id: string;
  status: CoverageStatus;
  fixtureIds: string[];
  notes: string;
}

/**
 * Required Phase 3 real-document coverage categories from the acceptance spec.
 */
export const PHASE3_DOCUMENT_COVERAGE: Phase3CoverageRow[] = [
  {
    id: "real-1-page-scanned",
    status: "PARTIAL",
    fixtureIds: ["cy301-page1-image", "jbig2-al-402-committed"],
    notes:
      "Image + JBIG2 pages available; dedicated 1-page scanned PDF may be local-only.",
  },
  {
    id: "real-5-page-scanned",
    status: "SYNTHETIC_ONLY",
    fixtureIds: ["synthetic-5page-scanned"],
    notes:
      "No single real 5-page RGPV PDF in repo; synthetic assembled from real rasters.",
  },
  {
    id: "real-two-column",
    status: "AVAILABLE",
    fixtureIds: ["al405-jun-2026"],
    notes:
      "AL-405 June 2026 landscape bilingual scan — two-column English/Hindi fixture.",
  },
  {
    id: "real-mixed-column",
    status: "UNAVAILABLE",
    fixtureIds: [],
    notes: "No verified mixed-column RGPV fixture committed.",
  },
  {
    id: "real-table-heavy",
    status: "UNAVAILABLE",
    fixtureIds: [],
    notes:
      "Algorithmic table tests exist; no dedicated real table-heavy paper fixture.",
  },
  {
    id: "probability-statistics",
    status: "UNAVAILABLE",
    fixtureIds: [],
    notes: "No dedicated probability/statistics paper fixture.",
  },
  {
    id: "binary-hex",
    status: "UNAVAILABLE",
    fixtureIds: [],
    notes:
      "Numeric fidelity unit tests cover binary/hex patterns; no dedicated real paper.",
  },
  {
    id: "low-quality-scan",
    status: "PARTIAL",
    fixtureIds: ["jbig2-al-402-committed"],
    notes:
      "JBIG2 scans exercise degraded compression; not labeled as low-quality intentionally.",
  },
  {
    id: "equation-heavy",
    status: "PARTIAL",
    fixtureIds: ["jbig2-al-402-committed", "al402-jun-2025"],
    notes:
      "AL-402 papers contain equations; dedicated equation-only fixture unavailable.",
  },
  {
    id: "diagram-heavy",
    status: "PARTIAL",
    fixtureIds: ["dec2023-4page-single-paper"],
    notes:
      "Diagram markers/assets preserved; diagram reconstruction intentionally not claimed.",
  },
  {
    id: "multi-page-questions",
    status: "AVAILABLE",
    fixtureIds: ["al402-nov-2023", "dec2023-4page-single-paper"],
    notes:
      "Cross-page continuation covered by Phase 2 continuation + multi-page fixtures.",
  },
  {
    id: "subquestion-heavy",
    status: "AVAILABLE",
    fixtureIds: ["jbig2-al-402-committed", "al402-jun-2025"],
    notes: "AL-402 papers are subquestion-heavy.",
  },
  {
    id: "header-footer-heavy",
    status: "AVAILABLE",
    fixtureIds: ["jbig2-al-402-committed", "al402-nov-2023"],
    notes: "Header/footer detector exercised on AL-402 scans.",
  },
  {
    id: "native-text-pdf",
    status: "AVAILABLE",
    fixtureIds: ["native-text-al402-sample"],
    notes:
      "Committed native-text sample (synthetic academic text, not scanned).",
  },
  {
    id: "image-only-paper",
    status: "AVAILABLE",
    fixtureIds: ["cy301-page1-image"],
    notes: "Single-image import path.",
  },
  {
    id: "multi-image-single-paper",
    status: "PARTIAL",
    fixtureIds: ["cy301-multi-image-one-paper"],
    notes: "Depends on local .cms page images being present.",
  },
];
