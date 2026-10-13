import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";
import { createCanvas } from "@napi-rs/canvas";

import {
  latinScriptRatio,
  preferEnglishExamText,
} from "../lib/content-pipeline/english-text.js";
import {
  cropRasterColumn,
  preprocessRasterForOcr,
} from "../lib/content-pipeline/ocr-preprocess.js";
import { runValidationRules } from "../lib/content-pipeline/validation-rules.js";
import { validateJsonShapes } from "../lib/content-pipeline/json-validator.js";
import { mergePyqs, papersMatch } from "../lib/content-pipeline/pyq-merger.js";
import type {
  ProductionPaper,
  ProductionPyqsJson,
  ProductionQuestion,
  ProductionSubQuestion,
} from "../lib/content-pipeline/schema-types.js";

/** Absolute path to the Next.js app root (directory containing package.json). */
export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

export interface BatchPaperCandidate {
  semester: string;
  subjectCode: string;
  subjectSlug: string;
  subjectName: string;
  destPath: string;
  rawText: string;
  pageUrl: string;
  pdfUrl: string;
  year: number;
  month: string;
  examSession: string;
}

/** Resolve a candidate destPath to an absolute path under the repo. */
export function resolveDestPath(destPath: string): string {
  if (path.isAbsolute(destPath)) {
    return destPath;
  }
  return path.resolve(REPO_ROOT, destPath);
}

export interface ProcessResult {
  candidate: BatchPaperCandidate;
  status: "ADDED" | "SKIPPED_DUPLICATE" | "FAILED" | "REVIEW_REQUIRED";
  reason?: string;
  questionCount?: number;
  subQuestionCount?: number;
}

// Download PDF safely with redirects
export async function downloadPdf(url: string, dest: string): Promise<string> {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) {
    return dest;
  }
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            let loc = res.headers.location;
            if (!loc.startsWith("http")) loc = new URL(loc, url).href;
            return downloadPdf(loc, dest).then(resolve).catch(reject);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          }
          const fileStream = fs.createWriteStream(dest);
          res.pipe(fileStream);
          fileStream.on("finish", () => {
            fileStream.close();
            resolve(dest);
          });
        }
      )
      .on("error", reject);
  });
}

/**
 * Rebuild readable lines from pdf.js text items using Y position / hasEOL.
 * Flat space-joining hides "1. a)" markers that the line parser needs.
 */
function textContentToLines(textContent: {
  items: Array<{ str?: string; transform?: number[]; hasEOL?: boolean }>;
}): string {
  const lines: string[] = [];
  let current = "";
  let lastY: number | null = null;

  for (const item of textContent.items) {
    const str = typeof item.str === "string" ? item.str : "";
    const y =
      Array.isArray(item.transform) && typeof item.transform[5] === "number"
        ? item.transform[5]
        : null;

    if (
      lastY != null &&
      y != null &&
      Math.abs(lastY - y) > 2 &&
      current.trim()
    ) {
      lines.push(current.trim());
      current = "";
    }

    current += str;
    if (item.hasEOL) {
      if (current.trim()) lines.push(current.trim());
      current = "";
      lastY = null;
      continue;
    }
    if (y != null) lastY = y;
  }

  if (current.trim()) lines.push(current.trim());
  return lines.join("\n");
}

/** Insert newlines before question / subquestion markers for single-line OCR blur. */
export function normalizeExtractedPageText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(
      /(?<![A-Za-z0-9])((?:Q(?:uestion|\.)?\s*)?\d{1,2}\s*[.):\-–]\s*(?:\(?[a-d]\)[.:\-–]?)?)/gi,
      "\n$1"
    )
    .replace(/(?<![A-Za-z0-9])(\(?[a-d]\)[.:\-–]?)/gi, "\n$1")
    .replace(/\n{3,}/g, "\n\n");
}

/** Keep English exam wording; drop Devanagari and OCR noise tails. */
export function cleanEnglishQuestionText(text: string): string {
  let cleaned = preferEnglishExamText(text)
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:PTO|Contd|www\.rgpvonline\.com)\b/gi, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Prefer English text before a trailing marks digit.
  const beforeMarks = cleaned.match(
    /^(.*?)(?:[\s.,'"]+)(\d{1,2})\s*(?:\[?\d*\]?)?\s*$/
  );
  if (beforeMarks && beforeMarks[1].length >= 20) {
    cleaned = beforeMarks[1].trim();
  }

  // Cut when a sentence is followed by short OCR-noise tokens (Hindi-as-Latin).
  const sentences = cleaned.split(/(?<=[.?;:])\s+/);
  const kept: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    const shortNoise = words.filter((w) => {
      const alpha = w.replace(/[^A-Za-z]/g, "");
      return alpha.length > 0 && alpha.length <= 3;
    }).length;
    const longWords = words.filter((w) => /[A-Za-z]{5,}/.test(w)).length;
    if (
      kept.length > 0 &&
      words.length >= 4 &&
      shortNoise / words.length >= 0.5 &&
      longWords <= 1
    ) {
      break;
    }
    kept.push(sentence);
  }
  cleaned = kept.join(" ").replace(/\s+/g, " ").trim();

  // Strip leading OCR bullets / duplicated labels (require ")" so "Discuss" is kept)
  cleaned = cleaned
    .replace(/^[@®©]+\s*/, "")
    .replace(/^\(?[a-d]\)\s*/i, "")
    .replace(/^\)+\s*/, "")
    .trim();

  return cleaned;
}

// Extract raw text from PDF: Native fast path or Local Tesseract OCR
export async function extractPdfText(
  pdfPath: string,
  tesseractWorker?: any
): Promise<{ pages: string[]; method: "NATIVE_TEXT" | "LOCAL_OCR" }> {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
  const pageTexts: string[] = [];
  let isNative = true;

  // Pass 1: Try native text (preserve line breaks)
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const text = normalizeExtractedPageText(
      textContentToLines(textContent as never)
    ).trim();
    if (text.length < 80) {
      isNative = false;
      break;
    }
    pageTexts.push(text);
  }

  if (isNative && pageTexts.length === doc.numPages) {
    return { pages: pageTexts, method: "NATIVE_TEXT" };
  }

  // Pass 2: Local OCR for scanned PDFs using repo preprocess + column crop.
  const ocrPages: string[] = [];
  const worker = tesseractWorker || (await createWorker("eng"));

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const landscape = base.width > base.height * 1.15;
      const scale = landscape ? 2.0 : 1.75;
      const viewport = page.getViewport({ scale });
      const fullCanvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height)
      );
      const fullCtx = fullCanvas.getContext("2d");

      await page.render({
        canvasContext: fullCtx as never,
        canvas: fullCanvas as never,
        viewport,
      }).promise;

      const fullPng = Buffer.from(await fullCanvas.encode("png"));
      let pageText = "";

      if (landscape) {
        const [leftCrop, rightCrop] = await Promise.all([
          cropRasterColumn(fullPng, 0, 0.5),
          cropRasterColumn(fullPng, 0.5, 1),
        ]);
        const left = await worker.recognize(leftCrop.buffer);
        const right = await worker.recognize(rightCrop.buffer);
        const leftText = preferEnglishExamText(left.data.text || "");
        const rightText = preferEnglishExamText(right.data.text || "");
        pageText =
          latinScriptRatio(leftText) >= latinScriptRatio(rightText)
            ? leftText
            : rightText;
      } else {
        let prepared = fullPng;
        try {
          prepared = (await preprocessRasterForOcr(fullPng)).buffer;
        } catch {
          prepared = fullPng;
        }
        const recognized = await worker.recognize(prepared);
        pageText = preferEnglishExamText(recognized.data.text || "");
      }

      ocrPages.push(normalizeExtractedPageText(pageText));
    }
  } finally {
    if (!tesseractWorker) {
      await worker.terminate();
    }
  }

  return { pages: ocrPages, method: "LOCAL_OCR" };
}

// Clean text lines and parse into Question hierarchy
export function parsePaperQuestions(
  pages: string[],
  subjectSyllabus?: any
): { questions: ProductionQuestion[]; error?: string } {
  const allLines: string[] = [];
  for (const page of pages) {
    const lines = page.split("\n");
    for (const l of lines) {
      const line = l.trim();
      if (!line) continue;
      if (/https?:\/\/(www\.)?rgpvonline\.com/i.test(line)) continue;
      if (/Total No\. of (Questions|Printed Pages)/i.test(line)) continue;
      if (/Roll No/i.test(line)) continue;
      if (/B\.Tech|Grading System|Time\s*:|Maximum Marks\s*:/i.test(line))
        continue;
      if (
        /Note\s*:\s*i\)|Attempt any five|equal marks|English version/i.test(
          line
        )
      )
        continue;
      if (/^(?:CS|ES|BT|AL|IT)-\d+/i.test(line)) continue;
      if (/^PTO$/i.test(line)) continue;
      if (/^\s*[-*_=]+\s*$/.test(line)) continue;
      // Keep lone 1..8 — those are question numbers. Drop other bare digits/brackets.
      if (/^\[?\d+\]?$/.test(line)) {
        const n = parseInt(line.replace(/[\[\]]/g, ""), 10);
        if (!(n >= 1 && n <= 8)) continue;
      }
      allLines.push(line);
    }
  }

  interface TempSub {
    label: string;
    text: string;
    marks?: number;
  }

  interface TempQ {
    qNum: number;
    subs: TempSub[];
  }

  const rawQuestions: TempQ[] = [];
  let curQ: TempQ | null = null;
  let curSub: TempSub | null = null;
  let capturingEnglish = true;
  let pendingQNum: number | null = null;

  const startSub = (q: TempQ, label: string, rest: string) => {
    capturingEnglish = true;
    curSub = { label: `${label})`, text: "" };
    q.subs.push(curSub);
    const trimmed = rest.trim();
    if (!trimmed) return;
    const marksMatch = trimmed.match(/[\s.,'"]+(\d{1,2})\s*$/);
    if (marksMatch) {
      curSub.text = trimmed.replace(/[\s.,'"]+(\d{1,2})\s*$/, "").trim();
      curSub.marks = parseInt(marksMatch[1], 10);
      capturingEnglish = false;
    } else {
      curSub.text = trimmed;
    }
  };

  for (let i = 0; i < allLines.length; i++) {
    const rawLine = allLines[i].trim();

    // Lone question number on its own line: "1" / "2." / "Q.3"
    const loneNum = rawLine.match(
      /^(?:Q(?:uestion|\.)?\s*)?(\d{1,2})\s*[.):\-–]?\s*$/i
    );
    if (
      loneNum &&
      parseInt(loneNum[1], 10) >= 1 &&
      parseInt(loneNum[1], 10) <= 8
    ) {
      pendingQNum = parseInt(loneNum[1], 10);
      continue;
    }

    // Check main Q start: e.g. "1. a)", "1. ", "1 )", "Q.1", "1 a)", "} 1. a)"
    const mainMatch = rawLine.match(
      /^(?:[}\]])?\s*(?:Q(?:uestion|\.)?\s*)?(\d{1,2})\s*[.):\-–]\s*(?:\(?([a-d])\)[.:\-–]?)?\s*(.*)$/i
    );
    // Check sub Q start alone: e.g. "a)", "b)", "(a)", "(b)", "bn)", "by ", "ay "
    const subMatch = rawLine.match(
      /^(?:\(?([a-d])n?\)[.:\-–]?|b[yYn]\s+|a[yY]\s+)\s*(.*)$/i
    );

    if (
      mainMatch &&
      parseInt(mainMatch[1], 10) >= 1 &&
      parseInt(mainMatch[1], 10) <= 8
    ) {
      const qNum = parseInt(mainMatch[1], 10);
      curQ = { qNum, subs: [] };
      rawQuestions.push(curQ);
      pendingQNum = null;
      const subLabel = mainMatch[2] ? mainMatch[2].toLowerCase() : "a";
      startSub(curQ, subLabel, mainMatch[3] || "");
      continue;
    }

    if (subMatch) {
      const subLabel = subMatch[1]
        ? subMatch[1].toLowerCase().replace(/n$/, "")
        : rawLine.toLowerCase().startsWith("b")
          ? "b"
          : "a";
      const rest = (subMatch[2] || "").trim();

      if (pendingQNum != null) {
        curQ = { qNum: pendingQNum, subs: [] };
        rawQuestions.push(curQ);
        pendingQNum = null;
      }

      if (curQ) {
        startSub(curQ, subLabel, rest);
      }
      continue;
    }

    if (curSub && capturingEnglish) {
      if (/[\u0900-\u097F]/.test(rawLine)) {
        capturingEnglish = false;
        continue;
      }
      const marksMatch = rawLine.match(/[\s.,'"]+(\d{1,2})\s*$/);
      if (marksMatch) {
        const clean = rawLine.replace(/[\s.,'"]+(\d{1,2})\s*$/, "").trim();
        curSub.text = (curSub.text + " " + clean).trim();
        curSub.marks = parseInt(marksMatch[1], 10);
        capturingEnglish = false;
      } else if (/^\d{1,2}\s*$/.test(rawLine)) {
        curSub.marks = parseInt(rawLine, 10);
        capturingEnglish = false;
      } else {
        curSub.text = (curSub.text + " " + rawLine).trim();
      }
    }
  }

  // Deduplicate/sort by question number
  const uniqueQMap = new Map<number, TempQ>();
  for (const q of rawQuestions) {
    if (!uniqueQMap.has(q.qNum)) {
      uniqueQMap.set(q.qNum, q);
    } else {
      // Merge subquestions if split across page break
      const existing = uniqueQMap.get(q.qNum)!;
      for (const s of q.subs) {
        if (!existing.subs.some((es) => es.label === s.label)) {
          existing.subs.push(s);
        }
      }
    }
  }

  const sortedQuestions = Array.from(uniqueQMap.values()).sort(
    (a, b) => a.qNum - b.qNum
  );

  // Convert to ProductionQuestion shape (unique sub IDs within each question)
  const productionQuestions: ProductionQuestion[] = [];
  for (const q of sortedQuestions) {
    const subQuestions: ProductionSubQuestion[] = [];
    const validSubs = q.subs.filter((s) => s.text.length > 5);
    const usedIds = new Set<string>();

    if (validSubs.length === 0) continue;

    for (let sIdx = 0; sIdx < validSubs.length; sIdx++) {
      const s = validSubs[sIdx];
      let cleanLabelChar =
        s.label.replace(/[^a-z0-9]/gi, "").toLowerCase() ||
        String.fromCharCode(97 + sIdx);
      let subId = `q${q.qNum}${cleanLabelChar}`;
      let suffix = 2;
      while (usedIds.has(subId)) {
        cleanLabelChar = String.fromCharCode(97 + sIdx);
        subId = `q${q.qNum}${cleanLabelChar}${suffix}`;
        suffix += 1;
      }
      usedIds.add(subId);
      const unitNum = Math.min(5, Math.max(1, Math.ceil(q.qNum / 1.6)));
      const labelChar =
        cleanLabelChar.replace(/\d+$/, "") || String.fromCharCode(97 + sIdx);

      const cleaned = cleanEnglishQuestionText(s.text);
      if (cleaned.length < 12) continue;

      subQuestions.push({
        id: subId,
        label: `${labelChar})`,
        text: cleaned,
        unit: `Unit ${unitNum}`,
      });
    }

    if (subQuestions.length > 0 && q.qNum >= 1 && q.qNum <= 8) {
      productionQuestions.push({
        id: `q${q.qNum}`,
        questionNumber: `Q.${q.qNum}`,
        subQuestions,
      });
    }
  }

  if (productionQuestions.length < 4) {
    return {
      questions: productionQuestions,
      error: `Question count (${productionQuestions.length}) is below threshold of 4.`,
    };
  }

  function isNoisySub(text: string): boolean {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;
    const shortNoise = words.filter((w) => {
      const alpha = w.replace(/[^A-Za-z]/g, "");
      return alpha.length > 0 && alpha.length <= 3;
    }).length;
    const longWords = words.filter((w) => /[A-Za-z]{5,}/.test(w)).length;
    const vowelWords = words.filter((w) => /[aeiouAEIOU]/.test(w)).length;
    return (
      (words.length >= 5 && shortNoise / words.length >= 0.4) ||
      (words.length >= 4 && longWords === 0) ||
      (words.length >= 6 && vowelWords / words.length < 0.35)
    );
  }

  // Drop individually noisy sub-questions rather than inventing replacements.
  const cleanedQuestions: ProductionQuestion[] = [];
  for (const q of productionQuestions) {
    const subs = q.subQuestions.filter(
      (s) => !isNoisySub(s.text) && s.text.length >= 20
    );
    if (subs.length === 0) continue;
    cleanedQuestions.push({ ...q, subQuestions: subs });
  }

  const allSubs = cleanedQuestions.flatMap((q) => q.subQuestions);
  const shortSubs = allSubs.filter((s) => s.text.length < 20).length;
  const avgLen =
    allSubs.reduce((sum, s) => sum + s.text.length, 0) /
    Math.max(1, allSubs.length);
  const garbageRatio =
    allSubs.filter((s) => {
      const latin = (s.text.match(/[A-Za-z0-9]/g) || []).length;
      return latin / Math.max(1, s.text.length) < 0.45;
    }).length / Math.max(1, allSubs.length);

  const hasQ1 = cleanedQuestions.some((q) => q.questionNumber === "Q.1");
  const hasQ2 = cleanedQuestions.some((q) => q.questionNumber === "Q.2");
  const noisySubs = allSubs.filter((s) => isNoisySub(s.text)).length;

  if (
    avgLen < 40 ||
    garbageRatio > 0.25 ||
    shortSubs > allSubs.length * 0.3 ||
    !(hasQ1 && hasQ2) ||
    cleanedQuestions.length < 6 ||
    noisySubs > allSubs.length * 0.2
  ) {
    return {
      questions: cleanedQuestions,
      error: `OCR quality gate failed (q=${cleanedQuestions.length}, avgLen=${avgLen.toFixed(1)}, garbageRatio=${garbageRatio.toFixed(2)}, shortSubs=${shortSubs}/${allSubs.length}, noisySubs=${noisySubs}, q1=${hasQ1}, q2=${hasQ2}).`,
    };
  }

  return { questions: cleanedQuestions };
}

// Process a single candidate paper safely
function buildSubjectMeta(
  candidate: BatchPaperCandidate,
  existingPyqs: ProductionPyqsJson | null,
  syllabusData: { subject?: Record<string, unknown> } | null
): ProductionPyqsJson["subject"] | null {
  if (existingPyqs?.subject) {
    return existingPyqs.subject;
  }

  const syllabusSubject = syllabusData?.subject;
  if (!syllabusSubject) {
    return null;
  }

  const semesterHint =
    (typeof syllabusSubject.semester === "string" &&
      syllabusSubject.semester) ||
    candidate.semester.replace(/^semester-/, "").toUpperCase();

  return {
    id: String(syllabusSubject.id || candidate.subjectSlug),
    code: String(syllabusSubject.code || candidate.subjectCode),
    name: String(syllabusSubject.name || candidate.subjectName),
    title: String(
      syllabusSubject.title ||
        `${candidate.subjectCode} - ${candidate.subjectName}`
    ),
    semester: semesterHint,
    gradingSystem: "Grading System (GS)",
    maxMarks: 70,
    time: "3 Hours",
    commonInstructions: [
      "Attempt any five questions.",
      "All questions carry equal marks.",
    ],
  };
}

export async function processPaperCandidate(
  candidate: BatchPaperCandidate,
  downloadsDir: string,
  tesseractWorker?: any
): Promise<ProcessResult> {
  const targetFile = resolveDestPath(candidate.destPath);
  const targetDir = path.dirname(targetFile);

  if (!fs.existsSync(targetDir)) {
    return {
      candidate,
      status: "FAILED",
      reason: `Target directory ${targetDir} does not exist.`,
    };
  }

  // 1. Download
  const pdfFilename = path.basename(candidate.pdfUrl);
  const localPdfPath = path.join(downloadsDir, pdfFilename);
  try {
    await downloadPdf(candidate.pdfUrl, localPdfPath);
  } catch (err: any) {
    return {
      candidate,
      status: "FAILED",
      reason: `Download failed: ${err.message}`,
    };
  }

  // 2. Extract text locally
  let extractResult: { pages: string[]; method: "NATIVE_TEXT" | "LOCAL_OCR" };
  try {
    extractResult = await extractPdfText(localPdfPath, tesseractWorker);
  } catch (err: any) {
    return {
      candidate,
      status: "FAILED",
      reason: `Extraction failed: ${err.message}`,
    };
  }

  // 3. Load syllabus for unit mapping
  const syllabusPath = path.join(targetDir, "syllabus.json");
  let syllabusData: any = null;
  if (fs.existsSync(syllabusPath)) {
    try {
      syllabusData = JSON.parse(fs.readFileSync(syllabusPath, "utf8"));
    } catch (e) {}
  }

  // 4. Parse questions
  const parsed = parsePaperQuestions(extractResult.pages, syllabusData);
  if (parsed.error || parsed.questions.length === 0) {
    return {
      candidate,
      status: "REVIEW_REQUIRED",
      reason: parsed.error || "No valid questions parsed.",
    };
  }

  // 5. Build ProductionPaper
  const incomingPaper: ProductionPaper = {
    exam: candidate.examSession,
    year: candidate.year,
    month: candidate.month,
    questions: parsed.questions,
  };

  // 6. Load or initialize subject pyqs.json
  let existingPyqs: ProductionPyqsJson | null = null;
  if (fs.existsSync(targetFile)) {
    try {
      existingPyqs = JSON.parse(fs.readFileSync(targetFile, "utf8"));
    } catch (err: any) {
      return {
        candidate,
        status: "FAILED",
        reason: `Corrupted existing pyqs.json: ${err.message}`,
      };
    }
  }

  // Check duplicate
  if (existingPyqs) {
    const isDup = existingPyqs.papers.some((p) =>
      papersMatch(p, incomingPaper)
    );
    if (isDup) {
      return {
        candidate,
        status: "SKIPPED_DUPLICATE",
        reason: "Already present in existing pyqs.json.",
      };
    }
  }

  const subjectMeta = buildSubjectMeta(candidate, existingPyqs, syllabusData);

  if (!subjectMeta) {
    return {
      candidate,
      status: "FAILED",
      reason: "Could not establish subject metadata from syllabus or pyqs.",
    };
  }

  const incomingPyqs: ProductionPyqsJson = {
    subject: subjectMeta,
    papers: [incomingPaper],
  };

  // 7. Validate incoming paper
  let issueIdx = 0;
  const incomingShape = validateJsonShapes({
    pyqs: incomingPyqs,
    syllabus: syllabusData,
    nextIndex: () => ++issueIdx,
  });
  const incomingRules = runValidationRules({
    pyqs: incomingPyqs,
    syllabus: syllabusData,
    jobDir: targetDir,
    existingPaths: new Set(),
    nextIndex: () => ++issueIdx,
    contract: "repository",
  });

  const incomingErrors = [...incomingShape.errors, ...incomingRules.errors];
  if (incomingErrors.length > 0) {
    return {
      candidate,
      status: "REVIEW_REQUIRED",
      reason: `Incoming validation failed with ${incomingErrors.length} errors: ${incomingErrors[0]?.message}`,
    };
  }

  // 8. Merge safely
  const merged = mergePyqs(existingPyqs, incomingPyqs);

  // Validate merged result
  const mergedShape = validateJsonShapes({
    pyqs: merged.pyqs,
    syllabus: syllabusData,
    nextIndex: () => ++issueIdx,
  });
  const mergedRules = runValidationRules({
    pyqs: merged.pyqs,
    syllabus: syllabusData,
    jobDir: targetDir,
    existingPaths: new Set(),
    nextIndex: () => ++issueIdx,
    contract: "repository",
  });

  const mergedErrors = [...mergedShape.errors, ...mergedRules.errors];
  if (mergedErrors.length > 0) {
    return {
      candidate,
      status: "FAILED",
      reason: `Merged validation failed with ${mergedErrors.length} errors: ${mergedErrors[0]?.message}`,
    };
  }

  // 9. Atomic write
  const tempPath = `${targetFile}.tmp.${Date.now()}`;
  fs.writeFileSync(
    tempPath,
    JSON.stringify(merged.pyqs, null, 2) + "\n",
    "utf8"
  );
  fs.renameSync(tempPath, targetFile);

  const subQCount = parsed.questions.reduce(
    (sum, q) => sum + q.subQuestions.length,
    0
  );

  return {
    candidate,
    status: "ADDED",
    questionCount: parsed.questions.length,
    subQuestionCount: subQCount,
  };
}
