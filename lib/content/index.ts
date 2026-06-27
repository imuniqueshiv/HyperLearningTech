import fs from "fs/promises";
import path from "path";

export async function getSyllabus(
  branch: string,
  semester: string,
  subjectCode: string
) {
  try {
    const baseDir = path.join(process.cwd(), "content", "rgpv");
    const filePath = path.join(
      baseDir,
      branch.toLowerCase(),
      semester.toLowerCase(),
      subjectCode.toLowerCase(),
      "syllabus.json"
    );

    if (!filePath.startsWith(baseDir)) {
      throw new Error("Invalid path parameter");
    }

    const file = await fs.readFile(filePath, "utf8");

    return JSON.parse(file);
  } catch (error) {
    console.error(
      `Failed to load syllabus for ${branch}/${semester}/${subjectCode}`,
      error
    );

    return null;
  }
}

export async function getPYQs(
  branch: string,
  semester: string,
  subjectCode: string
) {
  try {
    const baseDir = path.join(process.cwd(), "content", "rgpv");
    const filePath = path.join(
      baseDir,
      branch.toLowerCase(),
      semester.toLowerCase(),
      subjectCode.toLowerCase(),
      "pyqs.json"
    );

    if (!filePath.startsWith(baseDir)) {
      throw new Error("Invalid path parameter");
    }

    const file = await fs.readFile(filePath, "utf8");

    return JSON.parse(file);
  } catch (error) {
    console.error(
      `Failed to load PYQs for ${branch}/${semester}/${subjectCode}`,
      error
    );

    return null;
  }
}
