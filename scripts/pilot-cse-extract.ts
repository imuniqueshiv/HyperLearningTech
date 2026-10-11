import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { runValidationRules } from "../lib/content-pipeline/validation-rules.js";
import { validateJsonShapes } from "../lib/content-pipeline/json-validator.js";
import type {
  ProductionPaper,
  ProductionPyqSubject,
  ProductionPyqsJson,
  ProductionQuestion,
  ProductionSubQuestion,
} from "../lib/content-pipeline/schema-types.js";

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
  throw new Error("GEMINI_KEY_1 is not set in environment or .env.local");
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

function loadSyllabus(subjectCode: string) {
  const syllabusPath = path.join(
    process.cwd(),
    "content",
    "rgpv",
    "cse",
    "semester-5",
    subjectCode,
    "syllabus.json"
  );
  if (fs.existsSync(syllabusPath)) {
    return JSON.parse(fs.readFileSync(syllabusPath, "utf8"));
  }
  return null;
}

interface PilotSyllabusModule {
  number: number;
  title: string;
  topics?: string[];
}

interface PilotSyllabus {
  subject?: {
    name?: string;
    title?: string;
  };
  modules?: PilotSyllabusModule[];
}

function buildPrompt(
  subjectCode: string,
  examSession: string,
  year: number,
  month: string,
  syllabus: PilotSyllabus | null
): string {
  const syllabusModules = syllabus?.modules
    ? syllabus.modules
        .map(
          (m: PilotSyllabusModule) =>
            `Unit ${m.number}: ${m.title} (Topics: ${(m.topics || [])
              .slice(0, 8)
              .join("; ")})`
        )
        .join("\n")
    : "No syllabus modules available.";

  return `You are a high-precision academic examination digitization engine for Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV) engineering exams.
You are given high-resolution scanned pages of an examination paper.

TARGET SUBJECT: ${subjectCode.toUpperCase()}
EXPECTED EXAM: ${month} ${year}

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
   - For tables (such as transition tables, truth tables), format them as clean GitHub-flavored markdown tables in the question text.
5. DIAGRAM HANDLING:
   - Whenever a question contains, references, or requires a diagram, figure, graph, circuit, flowchart, architecture, state diagram, or other visual in the original paper:
     Preserve the original question wording and insert the literal placeholder alt='' at the appropriate location in the extracted question text where the diagram appears.
     Example: "Compute the Regular Expression for the DFA as shown below. alt=''"
   - Do NOT attempt to draw or render the visual as ascii art.
6. MATHEMATICAL NOTATION: Convert mathematical equations, symbols, formal grammar tuples, automata specifications, fractions, and matrices into clean LaTeX math notation using $...$ or $$...$$, and populate the optional 'latex' field if a subquestion contains notable math expressions.
7. UNIT MAPPING: Based on the syllabus modules provided above, map each subquestion to the most appropriate unit label (e.g. "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5").
8. TOPIC TYPE: Provide a concise kebab-case slug for the 'type' field describing the subquestion concept (e.g. "dfa-regular-expression", "nfa-to-dfa", "pumping-lemma", "turing-machine").
9. METADATA:
   - Extract subject code (e.g. "${subjectCode.toUpperCase()}"), title, exam session ("${month} ${year}"), year (${year}), month ("${month}").
   - Extract maximum marks (typically 70), duration (typically "3 Hours"), and common instructions.
10. OUTPUT FORMAT:
   Return a single JSON object strictly adhering to this schema (no markdown formatting, no backticks, raw JSON only):
{
  "subject": {
    "id": "${subjectCode}",
    "code": "${subjectCode.toUpperCase()}",
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
    "exam": "${month} ${year}",
    "year": ${year},
    "month": "${month}",
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

async function runPilot() {
  const slug = "cs-501-theory-of-computation-nov-2022";
  const subjectCode = "cs-501";
  const year = 2022;
  const month = "November";
  const rasterDir = path.join(
    process.cwd(),
    ".cms",
    "staging-cse-sem5",
    "rasters",
    slug
  );
  const stagingExtractedDir = path.join(
    process.cwd(),
    ".cms",
    "staging-cse-sem5",
    "extracted"
  );
  fs.mkdirSync(stagingExtractedDir, { recursive: true });

  const imageFiles = ["page-1.png", "page-2.png"].map((f) =>
    path.join(rasterDir, f)
  );
  for (const img of imageFiles) {
    if (!fs.existsSync(img)) {
      throw new Error(`Raster image missing: ${img}`);
    }
  }

  const syllabus = loadSyllabus(subjectCode);
  const prompt = buildPrompt(
    subjectCode,
    `${month} ${year}`,
    year,
    month,
    syllabus
  );

  console.log(`Extracting pilot paper: ${slug}...`);
  const imageParts = imageFiles.map((p) => ({
    inlineData: {
      data: fs.readFileSync(p).toString("base64"),
      mimeType: "image/png",
    },
  }));

  // Re-instantiate GoogleGenAI per attempt to avoid HTTP/2 socket drops
  const ai = new GoogleGenAI({ apiKey });

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
      () => reject(new Error("Gemini generateContent timed out after 75s")),
      75000
    )
  );

  const response = await Promise.race([callPromise, timeoutPromise]);
  const responseText = response.text?.trim() || "";

  const parsed: DraftExtractedPaperPayload = JSON.parse(responseText);
  const outputFile = path.join(stagingExtractedDir, `${slug}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(parsed, null, 2));
  console.log(`Saved raw extracted pilot to: ${outputFile}`);

  // Validate normalized output
  const paperObj = normalizePaperIds(parsed.paper);
  const container: ProductionPyqsJson = {
    subject: parsed.subject,
    papers: [paperObj],
  };

  let issueIndex = 0;
  const shapeValidation = validateJsonShapes({
    pyqs: container,
    syllabus: null,
    nextIndex: () => ++issueIndex,
  });

  const ruleValidation = runValidationRules({
    pyqs: container,
    syllabus: null,
    jobDir: rasterDir,
    existingPaths: new Set(),
    nextIndex: () => ++issueIndex,
    contract: "repository",
  });

  const allErrors = [...shapeValidation.errors, ...ruleValidation.errors];
  const allWarnings = [...shapeValidation.warnings, ...ruleValidation.warnings];

  console.log("\n=== PILOT VALIDATION RESULTS ===");
  console.log(`Total questions: ${paperObj.questions.length}`);
  const totalSubQuestions = paperObj.questions.reduce(
    (acc, q) => acc + q.subQuestions.length,
    0
  );
  console.log(`Total subquestions: ${totalSubQuestions}`);
  console.log(`Errors: ${allErrors.length}`);
  console.log(`Warnings: ${allWarnings.length}`);

  if (allErrors.length > 0) {
    console.error("Errors:", JSON.stringify(allErrors, null, 2));
  }
  if (allWarnings.length > 0) {
    console.warn("Warnings:", JSON.stringify(allWarnings, null, 2));
  }

  // Print extracted questions summary
  console.log("\n=== QUESTIONS EXTRACTED ===");
  paperObj.questions.forEach((q) => {
    console.log(`[${q.questionNumber}] (${q.subQuestions.length} parts):`);
    q.subQuestions.forEach((sq) => {
      const hasDiagram =
        sq.text.includes("alt=''") ||
        sq.text.toLowerCase().includes("diagram") ||
        sq.text.toLowerCase().includes("figure");
      console.log(
        `  - ${sq.label} [${sq.unit}] [${sq.type}] ${hasDiagram ? "🎨 (Diagram flagged)" : ""}`
      );
      console.log(`    Text snippet: ${sq.text.slice(0, 120)}...`);
    });
  });
}

runPilot().catch((err) => {
  console.error("Pilot execution failed:", err);
  process.exit(1);
});
