import fs from "fs/promises";
import path from "path";

export async function getSyllabus(subjectCode: string) {
  try {
    const filePath = path.join(
      process.cwd(),
      "content",
      "rgpv",
      "syllabus",
      `${subjectCode.toLowerCase()}.json`
    );

    const file = await fs.readFile(filePath, "utf8");

    return JSON.parse(file);
  } catch (error) {
    console.error(`Failed to load syllabus for ${subjectCode}`, error);

    return null;
  }
}