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
  semester: string; // e.g. "semester-3"
  subjectCode: string; // e.g. "csit-304"
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
  semester: string;
  subjectCode: string;
  subject: ProductionPyqSubject;
  papers: ProductionPaper[];
}

interface PaperValidationSummary {
  slug: string;
  errors: number;
  warnings: number;
  issues: ValidationIssue[];
}

interface DiagramReportEntry {
  paperSlug: string;
  branch: string;
  semester: string;
  subjectCode: string;
  exam: string;
  questionId: string;
  questionNumber: string;
  label: string;
  textSnippet: string;
  diagramType: string;
  actionRequired: string;
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

const semesterRomanMap: Record<string, string> = {
  "semester-1": "I",
  "semester-2": "II",
  "semester-3": "III",
  "semester-4": "IV",
  "semester-5": "V",
  "semester-6": "VI",
  "semester-7": "VII",
  "semester-8": "VIII",
};

// Complete verified manifest of all 42 missing CSIT papers
const MANIFEST: PaperManifestItem[] = [
  // Semester 3 (9 papers)
  {
    slug: "cs-cy-csit-304-digital-system-digital-circuits-and-system-dec-2025",
    semester: "semester-3",
    subjectCode: "csit-304",
    pdfUrl:
      "https://www.rgpvonline.com/be/cs-cy-csit-304-digital-system-digital-circuits-and-system-dec-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "December",
  },
  {
    slug: "cs-ct-co-ci-cy-304-digital-systems-dec-2024",
    semester: "semester-3",
    subjectCode: "csit-304",
    pdfUrl:
      "https://www.rgpvonline.com/be/cs-ct-co-ci-cy-304-digital-systems-dec-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "December",
  },
  {
    slug: "ci-303-data-structure-jun-2023",
    semester: "semester-3",
    subjectCode: "csit-303",
    pdfUrl: "https://www.rgpvonline.com/be/ci-303-data-structure-jun-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "June",
  },
  {
    slug: "ci-305-object-oriented-programming-and-methodology-dec-2023",
    semester: "semester-3",
    subjectCode: "csit-305",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-305-object-oriented-programming-and-methodology-dec-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "December",
  },
  {
    slug: "ci-305-object-oriented-programming-and-methodology-jun-2023",
    semester: "semester-3",
    subjectCode: "csit-305",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-305-object-oriented-programming-and-methodology-jun-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "June",
  },
  {
    slug: "cs-ct-co-ci-304-digital-circuits-and-system-jun-2023",
    semester: "semester-3",
    subjectCode: "csit-304",
    pdfUrl:
      "https://www.rgpvonline.com/be/cs-ct-co-ci-304-digital-circuits-and-system-jun-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "June",
  },
  {
    slug: "cs-ct-co-ci-cy-304-digital-systems-dec-2023",
    semester: "semester-3",
    subjectCode: "csit-304",
    pdfUrl:
      "https://www.rgpvonline.com/be/cs-ct-co-ci-cy-304-digital-systems-dec-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "December",
  },
  {
    slug: "ci-305-object-oriented-programming-and-methodology-nov-2022",
    semester: "semester-3",
    subjectCode: "csit-305",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-305-object-oriented-programming-and-methodology-nov-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "November",
  },
  {
    slug: "cs-ct-co-ci-304-digital-systems-nov-2022",
    semester: "semester-3",
    subjectCode: "csit-304",
    pdfUrl:
      "https://www.rgpvonline.com/be/cs-ct-co-ci-304-digital-systems-nov-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "November",
  },

  // Semester 4 (12 papers)
  {
    slug: "ag-csit-it-403-analysis-and-design-of-algorithm-jun-2025",
    semester: "semester-4",
    subjectCode: "csit-403",
    pdfUrl:
      "https://www.rgpvonline.com/be/ag-csit-it-403-analysis-and-design-of-algorithm-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "ag-csit-it-405-data-base-management-system-jun-2025",
    semester: "semester-4",
    subjectCode: "csit-405",
    pdfUrl:
      "https://www.rgpvonline.com/be/ag-csit-it-405-data-base-management-system-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "ci-402-analog-and-digital-communication-jun-2024",
    semester: "semester-4",
    subjectCode: "csit-402",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-402-analog-and-digital-communication-jun-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "June",
  },
  {
    slug: "ag-ci-it-403-analysis-and-design-of-algorithm-nov-2023",
    semester: "semester-4",
    subjectCode: "csit-403",
    pdfUrl:
      "https://www.rgpvonline.com/be/ag-ci-it-403-analysis-and-design-of-algorithm-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "ag-ci-it-405-data-base-management-system-jun-2023",
    semester: "semester-4",
    subjectCode: "csit-405",
    pdfUrl:
      "https://www.rgpvonline.com/be/ag-ci-it-405-data-base-management-system-jun-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "June",
  },
  {
    slug: "ag-csit-ci-it-403-analysis-and-design-of-algorithm-jun-2023",
    semester: "semester-4",
    subjectCode: "csit-403",
    pdfUrl:
      "https://www.rgpvonline.com/be/ag-csit-ci-it-403-analysis-and-design-of-algorithm-jun-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "June",
  },
  {
    slug: "ci-402-analog-and-digital-communication-jun-2023",
    semester: "semester-4",
    subjectCode: "csit-402",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-402-analog-and-digital-communication-jun-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "June",
  },
  {
    slug: "ci-402-analog-and-digital-communication-nov-2023",
    semester: "semester-4",
    subjectCode: "csit-402",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-402-analog-and-digital-communication-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "ad-ag-at-ci-cs-ct-co-ee-ex-ft-it-mi-mm-bt-401-mathematics-3-jun-2022",
    semester: "semester-4",
    subjectCode: "bt-401",
    pdfUrl:
      "https://www.rgpvonline.com/be/ad-ag-at-ci-cs-ct-co-ee-ex-ft-it-mi-mm-bt-401-mathematics-3-jun-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "June",
  },
  {
    slug: "ag-ci-it-403-analysis-and-design-of-algorithm-jun-2022",
    semester: "semester-4",
    subjectCode: "csit-403",
    pdfUrl:
      "https://www.rgpvonline.com/be/ag-ci-it-403-analysis-and-design-of-algorithm-jun-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "June",
  },
  {
    slug: "ag-ci-it-405-data-base-management-system-jun-2022",
    semester: "semester-4",
    subjectCode: "csit-405",
    pdfUrl:
      "https://www.rgpvonline.com/be/ag-ci-it-405-data-base-management-system-jun-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "June",
  },
  {
    slug: "ci-cs-ct-co-al-io-is-404-computer-organization-and-architecture-jun-2022",
    semester: "semester-4",
    subjectCode: "csit-404",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-cs-ct-co-al-io-is-404-computer-organization-and-architecture-jun-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "June",
  },

  // Semester 5 (13 papers)
  {
    slug: "ci-it-503-a-theory-of-computation-jun-2025",
    semester: "semester-5",
    subjectCode: "csit-503-a",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-it-503-a-theory-of-computation-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "ci-it-504-artificial-intelligence-jun-2025",
    semester: "semester-5",
    subjectCode: "csit-504-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-it-504-artificial-intelligence-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "it-csit-503-a-theory-of-computation-dec-2025",
    semester: "semester-5",
    subjectCode: "csit-503-a",
    pdfUrl:
      "https://www.rgpvonline.com/be/it-csit-503-a-theory-of-computation-dec-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "December",
  },
  {
    slug: "ci-503-it-a-theory-of-computation-dec-2024",
    semester: "semester-5",
    subjectCode: "csit-503-a",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-503-it-a-theory-of-computation-dec-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "December",
  },
  {
    slug: "ci-504-b-it-504-a-artificial-intelligence-dec-2024",
    semester: "semester-5",
    subjectCode: "csit-504-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-504-b-it-504-a-artificial-intelligence-dec-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "December",
  },
  {
    slug: "ci-501-computer-networking-nov-2023",
    semester: "semester-5",
    subjectCode: "csit-501",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-501-computer-networking-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "ci-502-operating-system-nov-2023",
    semester: "semester-5",
    subjectCode: "csit-502",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-502-operating-system-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "ci-503-b-it-503-b-microprocessor-and-interfacing-nov-2023",
    semester: "semester-5",
    subjectCode: "csit-503-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-503-b-it-503-b-microprocessor-and-interfacing-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "ci-503-c-principles-of-programming-languages-nov-2023",
    semester: "semester-5",
    subjectCode: "csit-503-c",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-503-c-principles-of-programming-languages-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "ci-504-b-it-504-a-artificial-intelligence-nov-2023",
    semester: "semester-5",
    subjectCode: "csit-504-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-504-b-it-504-a-artificial-intelligence-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "ci-504-c-web-technology-and-e-commerce-nov-2023",
    semester: "semester-5",
    subjectCode: "csit-504-c",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-504-c-web-technology-and-e-commerce-nov-2023.pdf",
    expectedYear: 2023,
    expectedMonth: "November",
  },
  {
    slug: "ci-it-503-a-theory-of-computation-nov-2022",
    semester: "semester-5",
    subjectCode: "csit-503-a",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-it-503-a-theory-of-computation-nov-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "November",
  },
  {
    slug: "ci-it-504-b-artificial-intelligence-nov-2022",
    semester: "semester-5",
    subjectCode: "csit-504-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-it-504-b-artificial-intelligence-nov-2022.pdf",
    expectedYear: 2022,
    expectedMonth: "November",
  },

  // Semester 6 (5 papers)
  {
    slug: "ci-601-software-engineering-and-agile-jun-2025",
    semester: "semester-6",
    subjectCode: "csit-601",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-601-software-engineering-and-agile-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "ci-602-machine-learning-jun-2025",
    semester: "semester-6",
    subjectCode: "csit-602",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-602-machine-learning-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "ci-603-a-wireless-and-mobile-computing-jun-2025",
    semester: "semester-6",
    subjectCode: "csit-603-a",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-603-a-wireless-and-mobile-computing-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "ci-603-b-computer-graphics-and-multimedia-jun-2025",
    semester: "semester-6",
    subjectCode: "csit-603-b",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-603-b-computer-graphics-and-multimedia-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },
  {
    slug: "ci-604-a-cryptography-and-network-security-jun-2025",
    semester: "semester-6",
    subjectCode: "csit-604-a",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-604-a-cryptography-and-network-security-jun-2025.pdf",
    expectedYear: 2025,
    expectedMonth: "June",
  },

  // Semester 8 (3 papers)
  {
    slug: "ci-801-data-science-may-2024",
    semester: "semester-8",
    subjectCode: "csit-801",
    pdfUrl: "https://www.rgpvonline.com/be/ci-801-data-science-may-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "May",
  },
  {
    slug: "ci-802-d-block-chain-technology-may-2024",
    semester: "semester-8",
    subjectCode: "csit-802-d",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-802-d-block-chain-technology-may-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "May",
  },
  {
    slug: "ci-803-c-cyber-laws-and-forensics-may-2024",
    semester: "semester-8",
    subjectCode: "csit-803-c",
    pdfUrl:
      "https://www.rgpvonline.com/be/ci-803-c-cyber-laws-and-forensics-may-2024.pdf",
    expectedYear: 2024,
    expectedMonth: "May",
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

function loadSyllabus(
  semester: string,
  subjectCode: string
): PipelineSyllabus | null {
  const syllabusPath = path.join(
    process.cwd(),
    "content",
    "rgpv",
    "csit",
    semester,
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
              .slice(0, 8)
              .map(formatTopicLabel)
              .filter(Boolean)
              .join("; ")})`
        )
        .join("\n")
    : "No syllabus modules available.";

  const romanSemester = semesterRomanMap[item.semester] || "III";

  return `You are a high-precision academic examination digitization engine for Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV) engineering exams.
You are given high-resolution scanned pages of an examination paper.

TARGET BRANCH: CSIT (Computer Science & Information Technology)
TARGET SEMESTER: ${romanSemester} (${item.semester})
TARGET SUBJECT: ${item.subjectCode.toUpperCase()}
EXPECTED EXAM: ${item.expectedMonth} ${item.expectedYear}

SYLLABUS MODULES FOR UNIT MAPPING:
${syllabusModules}

STRICT EXTRACTION RULES:
1. EXTRACT ENGLISH ONLY: RGPV papers are bilingual (English and Hindi). Extract ONLY the English text. Completely discard Hindi lines, Hindi translations, and Devanagari script.
2. VERBATIM ACCURACY: Do NOT summarize, rewrite, rephrase, correct typos, or invent content. Preserve the exact source question wording, numbering, marks notation (e.g. [7 Marks] if stated), and internal choices.
3. WATERMARKS: Ignore and omit external site watermarks or URLs like "https://www.rgpvonline.com" or "www.rgpvonline.com".
4. QUESTION HIERARCHY:
   - Identify main questions (Q.1, Q.2, ... Q.8).
   - Identify subquestions with labels like "a)", "b)", "c)", or "" if a question has only one unlabelled part.
   - For subparts with Roman numerals like i), ii), iii), iv), preserve them inside the subquestion text.
   - For tables (such as transition tables, truth tables, schema relations), format them as clean GitHub-flavored markdown tables in the question text.
5. DIAGRAM HANDLING:
   - Whenever a question contains, references, or requires a diagram, figure, graph, circuit, flowchart, architecture, state diagram, or other visual in the original paper:
     Preserve the original question wording and insert the literal placeholder alt='' at the appropriate location in the extracted question text where the diagram appears.
     Example: "Draw the state diagram of the sequential circuit shown below. alt=''"
   - Do NOT attempt to draw or render the visual as ascii art.
6. MATHEMATICAL NOTATION: Convert mathematical equations, symbols, formal grammar tuples, automata specifications, fractions, and matrices into clean LaTeX math notation using $...$ or $$...$$, and populate the optional 'latex' field if a subquestion contains notable math expressions.
7. UNIT MAPPING: Based on the syllabus modules provided above, map each subquestion to the most appropriate unit label (e.g. "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5").
8. TOPIC TYPE: Provide a concise kebab-case slug for the 'type' field describing the subquestion concept (e.g. "boolean-algebra", "k-map", "relational-algebra", "b-plus-tree", "network-layer").
9. METADATA:
   - Extract subject code (e.g. "${item.subjectCode.toUpperCase()}"), title, exam session ("${item.expectedMonth} ${item.expectedYear}"), year (${item.expectedYear}), month ("${item.expectedMonth}").
   - Extract maximum marks (typically 70), duration (typically "3 Hours"), and common instructions.
10. JSON COMPLIANCE: In JSON strings, every backslash MUST be escaped with a double backslash (e.g. \\\\Sigma, \\\\to, \\\\delta, \\\\{). Never output bare single backslashes in JSON string values.
11. OUTPUT FORMAT:
   Return a single JSON object strictly adhering to this schema (no markdown formatting, no backticks, raw JSON only):
{
  "subject": {
    "id": "${item.subjectCode}",
    "code": "${item.subjectCode.toUpperCase()}",
    "name": "${syllabus?.subject?.name || ""}",
    "title": "${syllabus?.subject?.title || ""}",
    "semester": "${romanSemester}",
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

function repairJsonBackslashes(jsonStr: string): string {
  let result = "";
  let inString = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (!inString) {
      if (char === '"') {
        inString = true;
      }
      result += char;
      continue;
    }

    if (char === "\\") {
      const nextChar = jsonStr[i + 1];
      if (
        nextChar === '"' ||
        nextChar === "\\" ||
        nextChar === "/" ||
        nextChar === "b" ||
        nextChar === "f" ||
        nextChar === "n" ||
        nextChar === "r" ||
        nextChar === "t"
      ) {
        const afterNext = jsonStr[i + 2];
        if (/[a-zA-Z]/.test(afterNext)) {
          // LaTeX keyword starting with b, f, n, r, t (like \to, \frac, \beta, \theta, \rho)
          result += "\\\\";
          continue;
        }

        result += "\\" + nextChar;
        i++;
        continue;
      } else if (
        nextChar === "u" &&
        /^[0-9a-fA-F]{4}$/.test(jsonStr.slice(i + 2, i + 6))
      ) {
        result += jsonStr.slice(i, i + 6);
        i += 5;
        continue;
      } else {
        // Lone or invalid escape in JSON (e.g. \S, \d, \{, \}, \a, \l, etc.)
        result += "\\\\";
        continue;
      }
    }

    if (char === '"') {
      inString = false;
    }

    result += char;
  }

  return result;
}

function parseModelJsonResponse(text: string): unknown {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    console.log(
      "  Initial JSON.parse failed, attempting repair of unescaped LaTeX backslashes..."
    );
    try {
      const repaired = repairJsonBackslashes(cleaned);
      return JSON.parse(repaired);
    } catch {
      throw initialErr;
    }
  }
}

async function extractWithOcrFallback(
  item: PaperManifestItem,
  imagePaths: string[],
  syllabus: PipelineSyllabus | null
): Promise<DraftExtractedPaperPayload> {
  console.log(
    `  [OCR FALLBACK] Running local Tesseract OCR on ${imagePaths.length} pages...`
  );
  const Tesseract = require("tesseract.js");
  const ocrTexts: string[] = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const res = await Tesseract.recognize(imagePaths[i], "eng");
    ocrTexts.push(`--- PAGE ${i + 1} ---\n` + (res.data.text || ""));
  }
  const combinedOcr = ocrTexts.join("\n\n");
  console.log(
    `  [OCR FALLBACK] Completed OCR (${combinedOcr.length} chars). Sending transcription to Gemini...`
  );

  const prompt = buildPrompt(item, syllabus);
  const client = new GoogleGenAI({ apiKey });
  const res = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `The scanned examination paper has been transcribed via OCR as follows. Structure this examination paper into the target JSON schema following all strict rules:\n\n${combinedOcr}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: prompt,
      temperature: 0.1,
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
    },
  });

  const responseText = res.text?.trim() || "";
  if (!responseText) {
    throw new Error("OCR fallback returned empty response text");
  }
  const parsed = parseModelJsonResponse(responseText);
  return parseExtractedPaperPayload(parsed);
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
      // Create new GoogleGenAI instance per attempt to prevent Node HTTP/2 connection pooling issues
      const client = new GoogleGenAI({ apiKey });
      const callPromise = client.models.generateContent({
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
          maxOutputTokens: 16384,
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
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === "RECITATION") {
        console.warn(
          `  [RECITATION TRIGGERED] Fallback to local OCR + schema transcription for ${item.slug}...`
        );
        return await extractWithOcrFallback(item, imagePaths, syllabus);
      }

      const responseText = response.text?.trim() || "";
      if (!responseText) {
        throw new Error("Gemini returned empty response text");
      }
      const parsed: unknown = parseModelJsonResponse(responseText);
      return parseExtractedPaperPayload(parsed);
    } catch (err: unknown) {
      console.warn(
        `[GEMINI ATTEMPT ${attempt} FAILED] for ${item.slug}:`,
        errorMessage(err)
      );
      if (attempt < maxRetries) {
        const delay = attempt * 4000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }

  throw new Error(`Gemini extraction failed for ${item.slug}`);
}

function detectDiagramType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("dfa") || lower.includes("deterministic finite"))
    return "DFA State Transition Diagram";
  if (lower.includes("nfa") || lower.includes("non-deterministic finite"))
    return "NFA State Transition Diagram";
  if (lower.includes("pda") || lower.includes("pushdown"))
    return "PDA State Transition Diagram";
  if (lower.includes("turing machine"))
    return "Turing Machine Transition Diagram";
  if (
    lower.includes("e-r") ||
    lower.includes("entity relationship") ||
    lower.includes("er diagram")
  )
    return "Entity-Relationship (E-R) Diagram";
  if (
    lower.includes("b+ tree") ||
    lower.includes("b-tree") ||
    lower.includes("tree")
  )
    return "Tree Structure / Index Hierarchy";
  if (lower.includes("architecture") || lower.includes("block diagram"))
    return "System Architecture / Block Diagram";
  if (lower.includes("flowchart") || lower.includes("flow chart"))
    return "Algorithm Flowchart";
  if (
    lower.includes("circuit") ||
    lower.includes("logic diagram") ||
    lower.includes("flip flop")
  )
    return "Circuit / Logic Diagram";
  if (lower.includes("graph") || lower.includes("network"))
    return "Graph / Network Topology";
  if (lower.includes("state transition") || lower.includes("state chart"))
    return "State Transition Diagram";
  return "Technical Figure / Diagram";
}

async function runPipeline() {
  const stagingDir = path.join(process.cwd(), ".cms", "staging-csit");
  const downloadsDir = path.join(stagingDir, "downloads");
  const rastersDir = path.join(stagingDir, "rasters");
  const extractedDir = path.join(stagingDir, "extracted");
  const reportPath = path.join(stagingDir, "diagram-report.json");

  fs.mkdirSync(downloadsDir, { recursive: true });
  fs.mkdirSync(rastersDir, { recursive: true });
  fs.mkdirSync(extractedDir, { recursive: true });

  console.log(`=== STARTING RGPV CSIT PYQ BATCH INGESTION PIPELINE ===`);
  console.log(`Total missing papers in manifest: ${MANIFEST.length}`);

  const extractedPapersBySubject: Record<string, SubjectExtractionBucket> = {};
  const validationSummary: PaperValidationSummary[] = [];
  const diagramReport: DiagramReportEntry[] = [];

  for (let i = 0; i < MANIFEST.length; i++) {
    const item = MANIFEST[i];
    const bucketKey = `${item.semester}:${item.subjectCode}`;
    console.log(
      `\n[${i + 1}/${MANIFEST.length}] Processing ${item.slug} (${item.semester.toUpperCase()} / ${item.subjectCode.toUpperCase()})...`
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
      const syllabus = loadSyllabus(item.semester, item.subjectCode);
      console.log(`  Calling Gemini Vision for extraction...`);
      extractedData = await extractPaperWithGemini(item, images, syllabus);
      fs.writeFileSync(extractedFile, JSON.stringify(extractedData, null, 2));
      console.log(`  Saved extraction to ${extractedFile}`);
      // Polite delay between API calls
      await new Promise((r) => setTimeout(r, 2500));
    }

    // 4. Validate & scan diagrams
    const paperObj = normalizePaperIds(extractedData.paper);

    // Check questions for diagrams
    paperObj.questions.forEach((q) => {
      q.subQuestions.forEach((sq) => {
        const lower = sq.text.toLowerCase();
        const hasPlaceholder = sq.text.includes("alt=''");
        const mentionsVisual =
          lower.includes("diagram") ||
          lower.includes("figure") ||
          lower.includes("shown below") ||
          lower.includes("following circuit") ||
          lower.includes("following graph") ||
          lower.includes("following tree") ||
          lower.includes("following state");

        if (hasPlaceholder || mentionsVisual) {
          diagramReport.push({
            paperSlug: item.slug,
            branch: "csit",
            semester: item.semester,
            subjectCode: item.subjectCode,
            exam: paperObj.exam,
            questionId: sq.id,
            questionNumber: `${q.questionNumber} ${sq.label}`,
            label: sq.label,
            textSnippet: sq.text.slice(0, 140),
            diagramType: detectDiagramType(sq.text),
            actionRequired: hasPlaceholder
              ? "Placeholder alt='' already present in question text. Needs manual crop and asset replacement."
              : "Mentions diagram/figure. Verify PDF page if visual asset needs to be inserted.",
          });
        }
      });
    });

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
    if (!extractedPapersBySubject[bucketKey]) {
      extractedPapersBySubject[bucketKey] = {
        semester: item.semester,
        subjectCode: item.subjectCode,
        subject: extractedData.subject,
        papers: [],
      };
    }
    extractedPapersBySubject[bucketKey].papers.push(paperObj);
  }

  // Save diagram report
  fs.writeFileSync(reportPath, JSON.stringify(diagramReport, null, 2));
  console.log(
    `\nSaved Diagram Review Report to: ${reportPath} (${diagramReport.length} visual items detected)`
  );

  console.log(`\n=== EXTRACTION & VALIDATION PHASE COMPLETE ===`);
  const totalErrors = validationSummary.reduce((acc, v) => acc + v.errors, 0);
  console.log(`Total Validation Errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.error("Errors found in validation! Halting before write.");
    return;
  }

  // 5. Integrate & Merge into production directories
  console.log(`\n=== INTEGRATING INTO PRODUCTION CSIT DIRECTORIES ===`);
  const bucketKeys = Object.keys(extractedPapersBySubject);

  for (const bKey of bucketKeys) {
    const { semester, subjectCode, subject, papers } =
      extractedPapersBySubject[bKey];
    const targetDir = path.join(
      process.cwd(),
      "content",
      "rgpv",
      "csit",
      semester,
      subjectCode
    );
    const targetFile = path.join(targetDir, "pyqs.json");

    console.log(
      `\nSubject ${semester.toUpperCase()} / ${subjectCode.toUpperCase()} (${papers.length} new papers):`
    );
    // Load syllabus subject if available
    const syllabus = loadSyllabus(semester, subjectCode);
    const romanSemester = semesterRomanMap[semester] || "III";
    const cleanSubject: ProductionPyqSubject = {
      id: subjectCode,
      code: syllabus?.subject?.name
        ? subjectCode.toUpperCase()
        : subject.code || subjectCode.toUpperCase(),
      name: syllabus?.subject?.name || subject.name,
      title: syllabus?.subject?.title || subject.title,
      semester: romanSemester,
      gradingSystem: subject.gradingSystem || "Grading System (GS)",
      maxMarks: subject.maxMarks || 70,
      time: subject.time || "3 Hours",
      commonInstructions: subject.commonInstructions || [
        "Attempt any five questions.",
        "All questions carry equal marks.",
      ],
    };

    let existingPyqs: ProductionPyqsJson | null = null;
    let preExistingPaperCount = 0;

    if (fs.existsSync(targetFile)) {
      try {
        const rawExisting = JSON.parse(fs.readFileSync(targetFile, "utf8"));
        if (Array.isArray(rawExisting.papers)) {
          existingPyqs = rawExisting;
          preExistingPaperCount = existingPyqs?.papers?.length ?? 0;
        } else if (rawExisting.paper && Array.isArray(rawExisting.questions)) {
          // Normalize legacy single-paper file to ProductionPyqsJson format
          const legPaper = rawExisting.paper;
          const examStr = legPaper.exam || "";
          const monthMatch =
            examStr.match(
              /(June|December|May|November|Nov|Dec|Jun)\s+(\d{4})/i
            ) ||
            legPaper.id?.match(
              /(june|december|may|november|nov|dec|jun)[_-](\d{4})/i
            );
          let month = monthMatch
            ? monthMatch[1].charAt(0).toUpperCase() +
              monthMatch[1].slice(1).toLowerCase()
            : "June";
          if (month === "Jun") month = "June";
          if (month === "Dec") month = "December";
          if (month === "Nov") month = "November";
          const year = monthMatch ? parseInt(monthMatch[2], 10) : 2024;
          const cleanExam = `${month} ${year}`;

          const convertedPaper: ProductionPaper = {
            exam: cleanExam,
            year,
            month,
            questions: rawExisting.questions.map(
              (q: Record<string, unknown>, qIdx: number) => ({
                id: `q${qIdx + 1}`,
                questionNumber: `Q.${(q.number as number) || qIdx + 1}`,
                subQuestions: (
                  (q.parts as Record<string, unknown>[]) || []
                ).map((p: Record<string, unknown>, pIdx: number) => {
                  const label = typeof p.label === "string" ? p.label : "";
                  const cleanLabel = label.endsWith(")") ? label : `${label})`;
                  const text = typeof p.text === "string" ? p.text : "";
                  const unit =
                    typeof p.unit === "number"
                      ? `Unit ${p.unit}`
                      : typeof p.unit === "string"
                        ? p.unit
                        : "Unit 1";
                  const id =
                    typeof p.questionId === "string"
                      ? p.questionId
                      : `q${qIdx + 1}${label ? label.replace(/[^a-z0-9]/gi, "") : String.fromCharCode(97 + pIdx)}`;
                  return {
                    id,
                    label: cleanLabel || `${String.fromCharCode(97 + pIdx)})`,
                    text,
                    unit,
                  };
                }),
              })
            ),
          };
          existingPyqs = {
            subject: cleanSubject,
            papers: [convertedPaper],
          };
          preExistingPaperCount = 1;
        }
        console.log(
          `  Found existing pyqs.json with ${preExistingPaperCount} pre-existing papers.`
        );
      } catch {
        existingPyqs = null;
      }
    }

    const incoming: ProductionPyqsJson = {
      subject: cleanSubject,
      papers,
    };

    const { pyqs: mergedPyqs, stats } = mergePyqs(existingPyqs, incoming);
    console.log(
      `  Merged stats: +${stats.papersAdded} papers, +${stats.questionsAdded} questions, +${stats.subQuestionsAdded} subquestions (Total in file: ${mergedPyqs.papers.length})`
    );

    // Verify non-destructive assertion: preExistingPaperCount must not have decreased
    if (mergedPyqs.papers.length < preExistingPaperCount) {
      throw new Error(
        `CRITICAL: Pre-existing paper count reduced for ${subjectCode}! Aborting.`
      );
    }

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

  console.log(`\n=== ALL CSIT SUBJECTS INTEGRATED SUCCESSFULLY ===`);
}

runPipeline().catch((err) => {
  console.error("Pipeline failure:", err);
  process.exit(1);
});
