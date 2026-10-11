import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { GoogleGenAI } from "@google/genai";
import { runValidationRules } from "../lib/content-pipeline/validation-rules.js";
import { validateJsonShapes } from "../lib/content-pipeline/json-validator.js";
import { mergePyqs } from "../lib/content-pipeline/pyq-merger.js";
import type {
  ProductionPaper,
  ProductionPyqSubject,
  ProductionPyqsJson,
  ProductionQuestion,
  ProductionSubQuestion,
  ValidationIssue,
} from "../lib/content-pipeline/schema-types.js";

const require = createRequire(import.meta.url);

interface PaperManifestItem {
  slug: string;
  subjectCode: string; // e.g. "al-501"
  pdfUrl: string;
  expectedYear: number;
  expectedMonth: string;
}

interface PipelineSyllabusSubject {
  name?: string;
  title?: string;
}

type PipelineSyllabusTopic = string | { title?: string };

interface PipelineSyllabusModule {
  number: number;
  title: string;
  topics?: PipelineSyllabusTopic[];
}

interface PipelineSyllabus {
  subject?: PipelineSyllabusSubject;
  modules?: PipelineSyllabusModule[];
}

interface SubjectExtractionBucket {
  subject: ProductionPyqSubject;
  papers: ProductionPaper[];
}

interface PaperValidationSummary {
  slug: string;
  errors: number;
  warnings: number;
  issues: ValidationIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function formatTopicLabel(topic: PipelineSyllabusTopic): string {
  if (typeof topic === "string") return topic;
  return topic.title ?? "";
}

function parsePipelineSyllabus(value: unknown): PipelineSyllabus | null {
  if (!isRecord(value)) return null;

  const subjectRecord = isRecord(value.subject) ? value.subject : null;
  const subject: PipelineSyllabusSubject | undefined = subjectRecord
    ? {
        name:
          typeof subjectRecord.name === "string"
            ? subjectRecord.name
            : undefined,
        title:
          typeof subjectRecord.title === "string"
            ? subjectRecord.title
            : undefined,
      }
    : undefined;

  const modules = Array.isArray(value.modules)
    ? value.modules.flatMap((mod): PipelineSyllabusModule[] => {
        if (!isRecord(mod)) return [];
        if (typeof mod.number !== "number" || typeof mod.title !== "string") {
          return [];
        }
        const topics = Array.isArray(mod.topics)
          ? mod.topics.filter(
              (topic): topic is PipelineSyllabusTopic =>
                typeof topic === "string" || isRecord(topic)
            )
          : undefined;
        return [{ number: mod.number, title: mod.title, topics }];
      })
    : undefined;

  return { subject, modules };
}

/** Subquestion shape accepted from Gemini / cache before id/unit normalization. */
interface DraftSubQuestion {
  id?: string;
  label: string;
  text: string;
  latex?: string;
  unit?: string | null;
  type?: string;
  isPredicted?: boolean;
}

interface DraftQuestion {
  id?: string;
  questionNumber?: string;
  subQuestions: DraftSubQuestion[];
}

interface DraftPaper {
  exam: string;
  year: number;
  month: string;
  isPredicted?: boolean;
  questions: DraftQuestion[];
}

interface DraftExtractedPaperPayload {
  subject: ProductionPyqSubject;
  paper: DraftPaper;
}

function isDraftSubQuestion(value: unknown): value is DraftSubQuestion {
  if (!isRecord(value)) return false;
  return (
    typeof value.label === "string" &&
    typeof value.text === "string" &&
    (value.unit === undefined ||
      value.unit === null ||
      typeof value.unit === "string") &&
    (value.id === undefined || typeof value.id === "string") &&
    (value.latex === undefined || typeof value.latex === "string") &&
    (value.type === undefined || typeof value.type === "string") &&
    (value.isPredicted === undefined || typeof value.isPredicted === "boolean")
  );
}

function isDraftQuestion(value: unknown): value is DraftQuestion {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.subQuestions)) return false;
  return (
    value.subQuestions.every(isDraftSubQuestion) &&
    (value.id === undefined || typeof value.id === "string") &&
    (value.questionNumber === undefined ||
      typeof value.questionNumber === "string")
  );
}

function isDraftPaper(value: unknown): value is DraftPaper {
  if (!isRecord(value)) return false;
  return (
    typeof value.exam === "string" &&
    typeof value.year === "number" &&
    typeof value.month === "string" &&
    Array.isArray(value.questions) &&
    value.questions.every(isDraftQuestion)
  );
}

function isProductionPyqSubject(value: unknown): value is ProductionPyqSubject {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    typeof value.name === "string" &&
    typeof value.title === "string" &&
    typeof value.semester === "string" &&
    typeof value.gradingSystem === "string" &&
    typeof value.maxMarks === "number" &&
    typeof value.time === "string" &&
    Array.isArray(value.commonInstructions) &&
    value.commonInstructions.every((item) => typeof item === "string")
  );
}

function parseExtractedPaperPayload(
  value: unknown
): DraftExtractedPaperPayload {
  if (!isRecord(value)) {
    throw new Error("Extraction result must be an object");
  }
  if (!isProductionPyqSubject(value.subject)) {
    throw new Error(
      "Extraction result subject does not match production shape"
    );
  }
  if (!isDraftPaper(value.paper)) {
    throw new Error("Extraction result paper does not match expected shape");
  }
  return { subject: value.subject, paper: value.paper };
}

function normalizePaperIds(paper: DraftPaper): ProductionPaper {
  return {
    exam: paper.exam,
    year: paper.year,
    month: paper.month,
    isPredicted: paper.isPredicted,
    questions: paper.questions.map(
      (q, qIdx): ProductionQuestion => ({
        id: q.id || `q${qIdx + 1}`,
        questionNumber: q.questionNumber || `Q.${qIdx + 1}`,
        subQuestions: q.subQuestions.map((sq, sqIdx): ProductionSubQuestion => {
          const normalized: ProductionSubQuestion = {
            id:
              sq.id ||
              `q${qIdx + 1}${
                sq.label
                  ? sq.label.replace(/[^a-z0-9]/gi, "")
                  : String.fromCharCode(97 + sqIdx)
              }`,
            label: sq.label,
            text: sq.text,
            unit: sq.unit ?? "Unit 1",
          };
          if (sq.latex !== undefined) normalized.latex = sq.latex;
          if (sq.type !== undefined) normalized.type = sq.type;
          if (sq.isPredicted !== undefined) {
            normalized.isPredicted = sq.isPredicted;
          }
          return normalized;
        }),
      })
    ),
  };
}

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"'))
          value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const apiKey = process.env.GEMINI_KEY_1 || process.env.GEMINI_WORKSPACE_KEY_1;
if (!apiKey) {
  throw new Error("GEMINI_KEY_1 is not set");
}

const ai = new GoogleGenAI({ apiKey });

const MANIFEST: PaperManifestItem[] = [
  // AL-501 Operating Systems (5 papers)
  {
    slug: "ai-al-501-operating-systems-jun-2025",
    subjectCode: "al-501",
    pdfUrl:
      "https://www.rgpvonline.com/be/ai-al-501-operating-systems-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "al-501-operating-system-dec-2025",
    subjectCode: "al-501",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-501-operating-system-dec-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "December",
  },
  {
    slug: "ai-al-501-operating-systems-dec-2024",
    subjectCode: "al-501",
    pdfUrl:
      "https://www.rgpvonline.com/be/ai-al-501-operating-systems-dec-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "December",
  },
  {
    slug: "al-501-operating-systems-nov-2023",
    subjectCode: "al-501",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-501-operating-systems-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "al-501-operating-systems-nov-2022",
    subjectCode: "al-501",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-501-operating-systems-nov-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "November",
  },

  // AL-502 Database Management Systems (5 papers)
  {
    slug: "ai-al-io-sd-502-database-management-systems-dec-2025",
    subjectCode: "al-502",
    pdfUrl:
      "https://www.rgpvonline.com/be/ai-al-io-sd-502-database-management-systems-dec-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "December",
  },
  {
    slug: "ai-al-is-io-502-database-management-system-jun-2025",
    subjectCode: "al-502",
    pdfUrl:
      "https://www.rgpvonline.com/be/ai-al-is-io-502-database-management-system-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "ai-al-is-io-502-database-management-systems-dec-2024",
    subjectCode: "al-502",
    pdfUrl:
      "https://www.rgpvonline.com/be/ai-al-is-io-502-database-management-systems-dec-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "December",
  },
  {
    slug: "al-is-io-502-data-base-management-system-nov-2023",
    subjectCode: "al-502",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-is-io-502-data-base-management-system-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "al-502-database-management-systems-nov-2022",
    subjectCode: "al-502",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-502-database-management-systems-nov-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "November",
  },

  // AL-503-A Information Retrieval (1 paper)
  {
    slug: "al-503-a-information-retrieval-nov-2023",
    subjectCode: "al-503-a",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-503-a-information-retrieval-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },

  // AL-503-B Deep Learning (5 papers)
  {
    slug: "al-503-b-deep-learning-dec-2025",
    subjectCode: "al-503-b",
    pdfUrl: "https://www.rgpvonline.com/be/al-503-b-deep-learning-dec-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "December",
  },
  {
    slug: "al-503-b-deep-learning-jun-2025",
    subjectCode: "al-503-b",
    pdfUrl: "https://www.rgpvonline.com/be/al-503-b-deep-learning-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "al-503-deep-system-dec-2024",
    subjectCode: "al-503-b",
    pdfUrl: "https://www.rgpvonline.com/be/al-503-deep-system-dec-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "December",
  },
  {
    slug: "al-503-b-deep-learning-nov-2023",
    subjectCode: "al-503-b",
    pdfUrl: "https://www.rgpvonline.com/be/al-503-b-deep-learning-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "al-503-b-deep-learning-nov-2022",
    subjectCode: "al-503-b",
    pdfUrl: "https://www.rgpvonline.com/be/al-503-b-deep-learning-nov-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "November",
  },

  // AL-504-A AI in Health Care (1 paper)
  {
    slug: "al-504-a-ai-in-health-care-nov-2023",
    subjectCode: "al-504-a",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-504-a-ai-in-health-care-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },

  // AL-504-B Natural Language Processing (5 papers)
  {
    slug: "al-504-b-natural-language-processing-dec-2025",
    subjectCode: "al-504-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-504-b-natural-language-processing-dec-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "December",
  },
  {
    slug: "al-504-b-natural-language-processing-jun-2025",
    subjectCode: "al-504-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-504-b-natural-language-processing-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "al-504-b-natural-language-processing-dec-2024",
    subjectCode: "al-504-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-504-b-natural-language-processing-dec-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "December",
  },
  {
    slug: "al-504-b-natural-language-processing-nov-2023",
    subjectCode: "al-504-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-504-b-natural-language-processing-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "al-504-b-natural-language-processing-nov-2022",
    subjectCode: "al-504-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/al-504-b-natural-language-processing-nov-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "November",
  },
];

async function downloadFile(url: string, dest: string): Promise<void> {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    return;
  }
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(`Failed to download ${url}: status ${res.statusCode}`)
          );
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

async function rasterizePdf(
  pdfPath: string,
  outputDir: string,
  scale = 2.0
): Promise<string[]> {
  const existingFiles = fs.existsSync(outputDir)
    ? fs
        .readdirSync(outputDir)
        .filter((f) => f.endsWith(".png"))
        .sort()
    : [];

  if (existingFiles.length > 0) {
    return existingFiles.map((f) => path.join(outputDir, f));
  }

  await fs.promises.mkdir(outputDir, { recursive: true });
  const { createCanvas } = require("@napi-rs/canvas");
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const wasmDir = path.join(
    path.dirname(require.resolve("pdfjs-dist/package.json")),
    "wasm"
  );
  const wasmUrl = pathToFileURL(wasmDir + path.sep).href;

  const data = new Uint8Array(await fs.promises.readFile(pdfPath));
  const pdf = await getDocument({
    data,
    useSystemFonts: true,
    wasmUrl,
    useWasm: true,
  }).promise;

  const pageImagePaths: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height)
    );
    const context = canvas.getContext("2d");

    await page.render({
      canvasContext: context as never,
      canvas: canvas as never,
      viewport,
    }).promise;

    const pngBuffer = Buffer.from(await canvas.encode("png"));
    const pageImgPath = path.join(outputDir, `page-${i}.png`);
    await fs.promises.writeFile(pageImgPath, pngBuffer);
    pageImagePaths.push(pageImgPath);
  }

  return pageImagePaths;
}

function loadSyllabus(subjectCode: string): PipelineSyllabus | null {
  const syllabusPath = path.join(
    process.cwd(),
    "content",
    "rgpv",
    "aiml",
    "semester-5",
    subjectCode,
    "syllabus.json"
  );
  if (fs.existsSync(syllabusPath)) {
    const parsed: unknown = JSON.parse(fs.readFileSync(syllabusPath, "utf8"));
    return parsePipelineSyllabus(parsed);
  }
  return null;
}

function buildPrompt(
  item: PaperManifestItem,
  syllabus: PipelineSyllabus | null
): string {
  const syllabusModules = syllabus?.modules
    ? syllabus.modules
        .map(
          (m) =>
            `Unit ${m.number}: ${m.title} (Topics: ${(m.topics || [])
              .slice(0, 6)
              .map(formatTopicLabel)
              .filter(Boolean)
              .join("; ")})`
        )
        .join("\n")
    : "No syllabus modules available.";

  return `You are a high-precision academic examination digitization engine for Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV) engineering exams.
You are given high-resolution scanned pages of an examination paper.

TARGET SUBJECT: ${item.subjectCode.toUpperCase()}
EXPECTED EXAM: ${item.expectedMonth} ${item.expectedYear}

SYLLABUS MODULES FOR UNIT MAPPING:
${syllabusModules}

STRICT EXTRACTION RULES:
1. EXTRACT ENGLISH ONLY: RGPV papers are bilingual (English and Hindi). Extract ONLY the English text. Completely discard Hindi lines, Hindi translations, and Devanagari script.
2. VERBATIM ACCURACY: Do NOT summarize, rewrite, rephrase, correct typos, or invent content. Preserve the exact source question wording.
3. WATERMARKS: Ignore and omit external site watermarks or URLs like "https://www.rgpvonline.com" or "www.rgpvonline.com".
4. QUESTION HIERARCHY:
   - Identify main questions (Q.1, Q.2, ... Q.8).
   - Identify subquestions with labels like "a)", "b)", "c)", or "" if a question has only one unlabelled part.
   - For subparts with Roman numerals like i), ii), iii), iv), preserve them inside the subquestion text.
   - For tables (such as process scheduling, matrices, truth tables, state tables), format them as clean GitHub-flavored markdown tables in the question text.
5. MATHEMATICAL NOTATION: Convert mathematical equations, symbols, fractions, and matrices into clean LaTeX math notation using $...$ or $$...$$, and populate the optional 'latex' field if a subquestion contains notable math expressions.
6. UNIT MAPPING: Based on the syllabus modules provided above, map each subquestion to the most appropriate unit label (e.g. "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5").
7. TOPIC TYPE: Provide a concise kebab-case slug for the 'type' field describing the subquestion concept (e.g. "deadlock-bankers", "cpu-scheduling", "paging", "rnn-lstm").
8. METADATA:
   - Extract subject code (e.g. "AL-501"), title, exam session (e.g. "${item.expectedMonth} ${item.expectedYear}"), year (${item.expectedYear}), month ("${item.expectedMonth}").
   - Extract maximum marks (typically 70), duration (typically "3 Hours"), and common instructions.
9. OUTPUT FORMAT:
   Return a single JSON object strictly adhering to this schema (no markdown formatting, no backticks, raw JSON only):
{
  "subject": {
    "id": "${item.subjectCode}",
    "code": "${item.subjectCode.toUpperCase()}",
    "name": "${syllabus?.subject?.name || ""}",
    "title": "${syllabus?.subject?.title || ""}",
    "semester": "V",
    "gradingSystem": "Grading System (GS)",
    "maxMarks": 70,
    "time": "3 Hours",
    "commonInstructions": [
      "Attempt any five questions.",
      "All questions carry equal marks."
    ]
  },
  "paper": {
    "exam": "${item.expectedMonth} ${item.expectedYear}",
    "year": ${item.expectedYear},
    "month": "${item.expectedMonth}",
    "questions": [
      {
        "id": "q1",
        "questionNumber": "Q.1",
        "subQuestions": [
          {
            "id": "q1a",
            "label": "a)",
            "text": "...",
            "unit": "Unit 1",
            "type": "topic-slug"
          }
        ]
      }
    ]
  }
}
`;
}

async function extractPaperWithGemini(
  item: PaperManifestItem,
  imagePaths: string[],
  syllabus: PipelineSyllabus | null,
  maxRetries = 3
): Promise<DraftExtractedPaperPayload> {
  const prompt = buildPrompt(item, syllabus);
  const imageParts = imagePaths.map((p) => ({
    inlineData: {
      data: fs.readFileSync(p).toString("base64"),
      mimeType: "image/png",
    },
  }));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const callPromise = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              ...imageParts,
              {
                text: "Extract this complete RGPV question paper into the required JSON schema following all strict rules.",
              },
            ],
          },
        ],
        config: {
          systemInstruction: prompt,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini generateContent timed out after 75s`)),
          75000
        )
      );

      const response = await Promise.race([callPromise, timeoutPromise]);
      const responseText = response.text?.trim() || "";
      const parsed: unknown = JSON.parse(responseText);
      return parseExtractedPaperPayload(parsed);
    } catch (err: unknown) {
      console.warn(
        `[GEMINI ATTEMPT ${attempt} FAILED] for ${item.slug}:`,
        errorMessage(err)
      );
      if (attempt < maxRetries) {
        const delay = attempt * 5000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }

  throw new Error(`Gemini extraction failed for ${item.slug}`);
}

async function runPipeline() {
  const stagingDir = path.join(process.cwd(), ".cms", "staging-sem5");
  const downloadsDir = path.join(stagingDir, "downloads");
  const rastersDir = path.join(stagingDir, "rasters");
  const extractedDir = path.join(stagingDir, "extracted");
  fs.mkdirSync(downloadsDir, { recursive: true });
  fs.mkdirSync(rastersDir, { recursive: true });
  fs.mkdirSync(extractedDir, { recursive: true });

  console.log(`=== STARTING RGPV AIML SEMESTER 5 PYQ EXTRACTION PIPELINE ===`);
  console.log(`Total papers in manifest: ${MANIFEST.length}`);

  const extractedPapersBySubject: Record<string, SubjectExtractionBucket> = {};
  const validationSummary: PaperValidationSummary[] = [];

  for (let i = 0; i < MANIFEST.length; i++) {
    const item = MANIFEST[i];
    console.log(
      `\n[${i + 1}/${MANIFEST.length}] Processing ${item.slug} (${item.subjectCode.toUpperCase()})...`
    );

    // 1. Download
    const pdfPath = path.join(downloadsDir, `${item.slug}.pdf`);
    await downloadFile(item.pdfUrl, pdfPath);

    // 2. Rasterize
    const pageRasterDir = path.join(rastersDir, item.slug);
    const images = await rasterizePdf(pdfPath, pageRasterDir);
    console.log(`  Rasterized ${images.length} pages.`);

    // 3. Extract or Load cached
    const extractedFile = path.join(extractedDir, `${item.slug}.json`);
    let extractedData: DraftExtractedPaperPayload | null = null;

    if (fs.existsSync(extractedFile)) {
      try {
        const cached: unknown = JSON.parse(
          fs.readFileSync(extractedFile, "utf8")
        );
        extractedData = parseExtractedPaperPayload(cached);
        console.log(`  Loaded cached extraction from ${extractedFile}`);
      } catch {
        extractedData = null;
      }
    }

    if (!extractedData) {
      const syllabus = loadSyllabus(item.subjectCode);
      console.log(`  Calling Gemini Vision for extraction...`);
      extractedData = await extractPaperWithGemini(item, images, syllabus);
      fs.writeFileSync(extractedFile, JSON.stringify(extractedData, null, 2));
      console.log(`  Saved extraction to ${extractedFile}`);
      // Polite delay between API calls
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 4. Validate
    const paperObj = normalizePaperIds(extractedData.paper);

    const testContainer: ProductionPyqsJson = {
      subject: extractedData.subject,
      papers: [paperObj],
    };

    let issueIndex = 0;
    const shapeValidation = validateJsonShapes({
      pyqs: testContainer,
      syllabus: null,
      nextIndex: () => ++issueIndex,
    });

    const ruleValidation = runValidationRules({
      pyqs: testContainer,
      syllabus: null,
      jobDir: pageRasterDir,
      existingPaths: new Set(),
      nextIndex: () => ++issueIndex,
      contract: "repository",
    });

    const allErrors = [...shapeValidation.errors, ...ruleValidation.errors];
    const allWarnings = [
      ...shapeValidation.warnings,
      ...ruleValidation.warnings,
    ];

    validationSummary.push({
      slug: item.slug,
      errors: allErrors.length,
      warnings: allWarnings.length,
      issues: [...allErrors, ...allWarnings],
    });

    console.log(
      `  Validation: ${allErrors.length} errors, ${allWarnings.length} warnings (Questions: ${paperObj.questions.length})`
    );

    // Group for subject merge
    if (!extractedPapersBySubject[item.subjectCode]) {
      extractedPapersBySubject[item.subjectCode] = {
        subject: extractedData.subject,
        papers: [],
      };
    }
    extractedPapersBySubject[item.subjectCode].papers.push(paperObj);
  }

  console.log(`\n=== EXTRACTION & VALIDATION PHASE COMPLETE ===`);
  const totalErrors = validationSummary.reduce((acc, v) => acc + v.errors, 0);
  console.log(`Total Validation Errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.error("Errors found in validation! Halting before write.");
    return;
  }

  // 5. Integrate & Merge into production directories
  console.log(`\n=== INTEGRATING INTO PRODUCTION DIRECTORIES ===`);
  const subjects = Object.keys(extractedPapersBySubject);

  for (const subjectCode of subjects) {
    const { subject, papers } = extractedPapersBySubject[subjectCode];
    const targetDir = path.join(
      process.cwd(),
      "content",
      "rgpv",
      "aiml",
      "semester-5",
      subjectCode
    );
    const targetFile = path.join(targetDir, "pyqs.json");

    console.log(
      `\nSubject ${subjectCode.toUpperCase()} (${papers.length} papers):`
    );
    let existingPyqs: ProductionPyqsJson | null = null;
    if (fs.existsSync(targetFile)) {
      try {
        existingPyqs = JSON.parse(fs.readFileSync(targetFile, "utf8"));
        console.log(
          `  Found existing pyqs.json with ${existingPyqs?.papers?.length ?? 0} papers.`
        );
      } catch {
        existingPyqs = null;
      }
    }

    // Clean syllabus subject if available
    const syllabus = loadSyllabus(subjectCode);
    const cleanSubject = {
      id: subjectCode,
      code: subjectCode.toUpperCase(),
      name: syllabus?.subject?.name || subject.name,
      title: syllabus?.subject?.title || subject.title,
      semester: "V",
      gradingSystem: subject.gradingSystem || "Grading System (GS)",
      maxMarks: subject.maxMarks || 70,
      time: subject.time || "3 Hours",
      commonInstructions: subject.commonInstructions || [
        "Attempt any five questions.",
        "All questions carry equal marks.",
      ],
    };

    const incoming: ProductionPyqsJson = {
      subject: cleanSubject,
      papers,
    };

    const { pyqs: mergedPyqs, stats } = mergePyqs(existingPyqs, incoming);
    console.log(
      `  Merged stats: +${stats.papersAdded} papers, +${stats.questionsAdded} questions, +${stats.subQuestionsAdded} subquestions`
    );

    // Final validation of merged production file
    let finalIssueIndex = 0;
    const finalCheck = runValidationRules({
      pyqs: mergedPyqs,
      syllabus: null,
      jobDir: targetDir,
      existingPaths: new Set(),
      nextIndex: () => ++finalIssueIndex,
      contract: "repository",
    });

    if (finalCheck.errors.length > 0) {
      console.error(
        `  FINAL VALIDATION ERROR for ${subjectCode}:`,
        finalCheck.errors
      );
      throw new Error(`Validation failed for merged ${subjectCode}`);
    }

    fs.writeFileSync(targetFile, JSON.stringify(mergedPyqs, null, 2) + "\n");
    console.log(
      `  Successfully wrote ${targetFile} (${mergedPyqs.papers.length} total papers)`
    );
  }

  console.log(`\n=== ALL SUBJECTS INTEGRATED SUCCESSFULLY ===`);
}

runPipeline().catch(console.error);
