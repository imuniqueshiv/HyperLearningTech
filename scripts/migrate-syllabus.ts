import fs from "node:fs";
import path from "node:path";

const ROOT_DIRECTORY = path.join(process.cwd(), "content", "rgpv", "common");

const SYLLABUS_FILE_NAME = "syllabus.json";

interface Subject {
  id: string;
  code: string;
  name: string;
  title: string;
}

interface Module {
  id: string;
  number: number;
  title: string;
  hours: number;
  topics: string[];
  questionIds: string[];
  predictedQuestionIds: string[];
}

interface Syllabus {
  subject: Subject;
  modules: Module[];
}

interface ValidationReport {
  file: string;
  subjectCode: string;
  subjectName: string;
  moduleCount: number;
  topicCount: number;
  questionCount: number;
  predictedQuestionCount: number;
  valid: boolean;
  errors: string[];
}

function findSyllabusFiles(
  directory: string,
  results: string[] = []
): string[] {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      findSyllabusFiles(fullPath, results);
      continue;
    }

    if (entry.isFile() && entry.name === SYLLABUS_FILE_NAME) {
      results.push(fullPath);
    }
  }

  return results;
}

function readSyllabus(filePath: string): Syllabus {
  const raw = fs.readFileSync(filePath, "utf8");

  return JSON.parse(raw);
}

function validateSyllabus(
  syllabus: Syllabus,
  filePath: string
): ValidationReport {
  const errors: string[] = [];

  if (!syllabus.subject) {
    errors.push("Missing subject object.");
  }

  if (!syllabus.subject?.code) {
    errors.push("Missing subject.code");
  }

  if (!syllabus.subject?.name) {
    errors.push("Missing subject.name");
  }

  if (!syllabus.subject?.title) {
    errors.push("Missing subject.title");
  }

  if (!Array.isArray(syllabus.modules)) {
    errors.push("modules must be an array.");
  }

  let moduleCount = 0;
  let topicCount = 0;
  let questionCount = 0;
  let predictedQuestionCount = 0;

  if (Array.isArray(syllabus.modules)) {
    moduleCount = syllabus.modules.length;

    syllabus.modules.forEach((module, moduleIndex) => {
      if (!module.id) {
        errors.push(`Module ${moduleIndex + 1}: missing id`);
      }

      if (typeof module.number !== "number") {
        errors.push(`Module ${moduleIndex + 1}: invalid number`);
      }

      if (!module.title) {
        errors.push(`Module ${moduleIndex + 1}: missing title`);
      }

      if (typeof module.hours !== "number") {
        errors.push(`Module ${moduleIndex + 1}: invalid hours`);
      }

      if (!Array.isArray(module.topics)) {
        errors.push(`Module ${moduleIndex + 1}: topics must be an array`);
      } else {
        topicCount += module.topics.length;

        const topicSet = new Set<string>();

        module.topics.forEach((topic) => {
          if (typeof topic !== "string") {
            errors.push(`Module ${moduleIndex + 1}: topic must be string`);
            return;
          }

          if (!topic.trim()) {
            errors.push(`Module ${moduleIndex + 1}: empty topic detected`);
          }

          if (topicSet.has(topic.trim())) {
            errors.push(
              `Module ${moduleIndex + 1}: duplicate topic "${topic}"`
            );
          }

          topicSet.add(topic.trim());
        });
      }

      if (!Array.isArray(module.questionIds)) {
        errors.push(`Module ${moduleIndex + 1}: questionIds must be an array`);
      } else {
        questionCount += module.questionIds.length;
      }

      if (!Array.isArray(module.predictedQuestionIds)) {
        errors.push(
          `Module ${moduleIndex + 1}: predictedQuestionIds must be an array`
        );
      } else {
        predictedQuestionCount += module.predictedQuestionIds.length;
      }
    });
  }

  return {
    file: path.relative(ROOT_DIRECTORY, filePath),
    subjectCode: syllabus.subject?.code ?? "UNKNOWN",
    subjectName: syllabus.subject?.name ?? "Unknown Subject",
    moduleCount,
    topicCount,
    questionCount,
    predictedQuestionCount,
    valid: errors.length === 0,
    errors,
  };
}

function printReport(report: ValidationReport) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log(report.subjectCode);
  console.log(report.subjectName);

  console.log("");

  console.log(`Modules                : ${report.moduleCount}`);
  console.log(`Topics                 : ${report.topicCount}`);
  console.log(`Question IDs           : ${report.questionCount}`);
  console.log(`Predicted Question IDs : ${report.predictedQuestionCount}`);

  console.log(
    `Status                 : ${report.valid ? "✅ VALID" : "❌ INVALID"}`
  );

  if (!report.valid) {
    console.log("");

    console.log("Errors:");

    report.errors.forEach((error) => {
      console.log(`  • ${error}`);
    });
  }

  console.log("");
}

function main() {
  interface MigrationSummary {
    files: number;
    valid: number;
    invalid: number;
    modules: number;
    topics: number;
    questions: number;
    predicted: number;
  }

  function main(): MigrationSummary {
    console.log("\n🔍 HyperLearningTech Migration Validator\n");

    if (!fs.existsSync(ROOT_DIRECTORY)) {
      throw new Error(`Directory not found:\n${ROOT_DIRECTORY}`);
    }

    const files = findSyllabusFiles(ROOT_DIRECTORY).sort();

    if (files.length === 0) {
      throw new Error("No syllabus files found.");
    }

    const reports: ValidationReport[] = [];

    for (const file of files) {
      const syllabus = readSyllabus(file);

      const report = validateSyllabus(syllabus, file);

      reports.push(report);

      printReport(report);
    }

    const summary: MigrationSummary = reports.reduce(
      (acc, report) => {
        acc.files++;

        if (report.valid) {
          acc.valid++;
        } else {
          acc.invalid++;
        }

        acc.modules += report.moduleCount;
        acc.topics += report.topicCount;
        acc.questions += report.questionCount;
        acc.predicted += report.predictedQuestionCount;

        return acc;
      },
      {
        files: 0,
        valid: 0,
        invalid: 0,
        modules: 0,
        topics: 0,
        questions: 0,
        predicted: 0,
      }
    );

    console.log("========================================");
    console.log("Migration Summary");
    console.log("========================================");

    console.log(`Files                  : ${summary.files}`);
    console.log(`Valid                  : ${summary.valid}`);
    console.log(`Invalid                : ${summary.invalid}`);
    console.log(`Modules                : ${summary.modules}`);
    console.log(`Topics                 : ${summary.topics}`);
    console.log(`Question IDs           : ${summary.questions}`);
    console.log(`Predicted Question IDs : ${summary.predicted}`);

    console.log("\n🎉 Validation completed.");

    return summary;
  }

  try {
    const summary = main();

    if (summary.invalid > 0) {
      console.error(
        `\n❌ Validation failed. ${summary.invalid} syllabus file(s) contain errors.`
      );

      process.exit(1);
    }

    console.log("\n✅ All syllabus files are valid.");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration validator crashed.");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

main();
