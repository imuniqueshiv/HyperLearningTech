/**
 * Registry of REAL source documents for Phase 2 acceptance.
 * Scope: ONE paper per import (PDF ≤5 pages OR 1–5 images).
 * Multi-paper / merged-paper categories intentionally excluded.
 */

import fs from "node:fs";
import path from "node:path";

export type RealFixtureCategory =
  | "native-or-scanned-pdf"
  | "scanned-jbig2-pdf"
  | "single-image"
  | "multi-image-one-paper"
  | "multi-page-single-paper"
  | "header-footer-heavy"
  | "numerical-content"
  | "subquestions"
  | "diagram-likely"
  | "two-column"
  | "table-content"
  | "equations";

export interface RealDocumentFixture {
  id: string;
  path: string | null;
  type: "pdf" | "image" | "images";
  /** Extra ordered image paths for multi-image one-paper imports. */
  imagePaths?: string[];
  expectedPages: number | null;
  subjectHint: string | null;
  declaredPaperCount: 1;
  categories: RealFixtureCategory[];
  notes: string;
  rawDocumentPath: string | null;
}

function abs(...parts: string[]): string {
  return path.join(process.cwd(), ...parts);
}

function existing(...parts: string[]): string | null {
  const p = abs(...parts);
  return fs.existsSync(p) ? p : null;
}

export function listRealDocumentFixtures(): RealDocumentFixture[] {
  const cy301Images = [
    existing(
      ".cms",
      "uploads",
      "job_11e88aa0499747b08cc8e8c6003f4d03",
      "original.webp"
    ),
    existing(
      ".cms",
      "uploads",
      "job_5882e712240842fa819fc52bcde7552f",
      "original.webp"
    ),
    existing(
      ".cms",
      "uploads",
      "job_2bf58946b0624095a2e84bdf717c6d7d",
      "original.webp"
    ),
  ].filter((p): p is string => Boolean(p));

  return [
    {
      id: "native-text-al402-sample",
      path: existing(
        "scripts",
        "cms-reliability",
        "fixtures",
        "native-text-al402-sample.pdf"
      ),
      type: "pdf",
      expectedPages: 1,
      subjectHint: "AL-402",
      declaredPaperCount: 1,
      categories: [
        "native-or-scanned-pdf",
        "numerical-content",
        "subquestions",
      ],
      notes:
        "Synthetic native-text PDF for fast-path verification (not a scanned RGPV paper).",
      rawDocumentPath: null,
    },
    {
      id: "jbig2-al-402-committed",
      path: existing(
        "scripts",
        "cms-reliability",
        "fixtures",
        "jbig2-al-402.pdf"
      ),
      type: "pdf",
      expectedPages: 2,
      subjectHint: "AL-402",
      declaredPaperCount: 1,
      categories: [
        "scanned-jbig2-pdf",
        "native-or-scanned-pdf",
        "multi-page-single-paper",
        "subquestions",
        "numerical-content",
        "header-footer-heavy",
        "equations",
      ],
      notes: "Committed JBIG2 scanned AL-402 (≤5 pages, one paper).",
      rawDocumentPath: existing(
        ".cms",
        "uploads",
        "job_865e79db822140b0b401b0fa44534bd7",
        "raw-document.json"
      ),
    },
    {
      id: "al402-jun-2025",
      path: existing(
        ".cms",
        "uploads",
        "job_2b2e0be4fd5a4aa18a20cd4495ae8096",
        "original.pdf"
      ),
      type: "pdf",
      expectedPages: 2,
      subjectHint: "AL-402",
      declaredPaperCount: 1,
      categories: [
        "native-or-scanned-pdf",
        "multi-page-single-paper",
        "subquestions",
        "numerical-content",
        "header-footer-heavy",
        "equations",
      ],
      notes: "Local .cms: AI/AL/CD-402 June 2025.",
      rawDocumentPath: existing(
        ".cms",
        "uploads",
        "job_2b2e0be4fd5a4aa18a20cd4495ae8096",
        "raw-document.json"
      ),
    },
    {
      id: "al402-nov-2023",
      path: existing(
        ".cms",
        "uploads",
        "job_0756c2040aee4df09dba44e4a7c28e0b",
        "original.pdf"
      ),
      type: "pdf",
      expectedPages: 3,
      subjectHint: "AL-402",
      declaredPaperCount: 1,
      categories: [
        "native-or-scanned-pdf",
        "multi-page-single-paper",
        "subquestions",
        "numerical-content",
        "header-footer-heavy",
      ],
      notes: "Local .cms: AL/CD-402 Nov 2023.",
      rawDocumentPath: existing(
        ".cms",
        "uploads",
        "job_0756c2040aee4df09dba44e4a7c28e0b",
        "raw-document.json"
      ),
    },
    {
      id: "cy301-page1-image",
      path: existing(
        ".cms",
        "uploads",
        "job_11e88aa0499747b08cc8e8c6003f4d03",
        "original.webp"
      ),
      type: "image",
      expectedPages: 1,
      subjectHint: "CY-301",
      declaredPaperCount: 1,
      categories: ["single-image", "header-footer-heavy", "subquestions"],
      notes: "Local .cms single-page image.",
      rawDocumentPath: existing(
        ".cms",
        "uploads",
        "job_11e88aa0499747b08cc8e8c6003f4d03",
        "raw-document.json"
      ),
    },
    {
      id: "cy301-multi-image-one-paper",
      path: cy301Images[0] ?? null,
      type: "images",
      imagePaths: cy301Images.slice(0, 5),
      expectedPages: Math.min(cy301Images.length, 5) || null,
      subjectHint: "CY-301",
      declaredPaperCount: 1,
      categories: [
        "multi-image-one-paper",
        "header-footer-heavy",
        "subquestions",
      ],
      notes: "Ordered CY-301 page images as one paper (≤5).",
      rawDocumentPath: null,
    },
    {
      id: "dec2023-4page-single-paper",
      path: existing(
        ".cms",
        "uploads",
        "job_01cebe9d057e409eb66dd4b7fbfcc2a0",
        "original.pdf"
      ),
      type: "pdf",
      expectedPages: 4,
      subjectHint: "AL-301",
      declaredPaperCount: 1,
      categories: [
        "native-or-scanned-pdf",
        "multi-page-single-paper",
        "header-footer-heavy",
        "subquestions",
        "diagram-likely",
      ],
      notes: "4-page single Dec 2023 paper PDF (not multi-paper).",
      rawDocumentPath: existing(
        ".cms",
        "uploads",
        "job_01cebe9d057e409eb66dd4b7fbfcc2a0",
        "raw-document.json"
      ),
    },
    {
      id: "synthetic-5page-scanned",
      path: existing(
        "scripts",
        "cms-reliability",
        "fixtures",
        "synthetic-5page-scanned.pdf"
      ),
      type: "pdf",
      expectedPages: 5,
      subjectHint: "AL-301",
      declaredPaperCount: 1,
      categories: ["native-or-scanned-pdf", "multi-page-single-paper"],
      notes:
        "SYNTHETIC: 5-page scanned PDF assembled from real page rasters (4-page Dec2023 + 1 page Jun2025). Not a single real exam PDF.",
      rawDocumentPath: null,
    },
  ];
}

export function availableRealDocumentFixtures(): RealDocumentFixture[] {
  return listRealDocumentFixtures().filter((f) => f.path != null);
}
