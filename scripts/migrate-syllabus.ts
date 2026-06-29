import fs from "node:fs";
import path from "node:path";

const ROOT_DIRECTORY = path.join(
  process.cwd(),
  "content",
  "rgpv",
  "common"
);

const SYLLABUS_FILE_NAME = "syllabus.json";

function findSyllabusFiles(directory: string, results: string[] = []): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

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

function main() {
  console.log("\n🔍 HyperLearningTech Syllabus Discovery Tool\n");

  if (!fs.existsSync(ROOT_DIRECTORY)) {
    console.error(`❌ Directory not found:\n${ROOT_DIRECTORY}`);
    process.exit(1);
  }

  const syllabusFiles = findSyllabusFiles(ROOT_DIRECTORY);

  if (syllabusFiles.length === 0) {
    console.log("⚠ No syllabus files found.");
    return;
  }

  console.log(`✅ Found ${syllabusFiles.length} syllabus files\n`);

  syllabusFiles
    .sort()
    .forEach((filePath, index) => {
      const relativePath = path.relative(ROOT_DIRECTORY, filePath);

      console.log(
        `${String(index + 1).padStart(2, "0")}. ${relativePath}`
      );
    });

  console.log("\n🎉 Discovery completed successfully.");
}

main();
