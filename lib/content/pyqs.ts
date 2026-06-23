import fs from "fs/promises";
import path from "path";

export async function getPYQs(
  branch: string,
  semester: string,
  subjectCode: string
) {
  try {
    const filePath = path.join(
      process.cwd(),
      "content",
      "rgpv",
      branch.toLowerCase(),
      semester.toLowerCase(),
      subjectCode.toLowerCase(),
      "pyqs.json"
    );

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
