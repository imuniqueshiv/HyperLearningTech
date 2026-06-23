import fs from "fs/promises";
import path from "path";

export async function getPYQs(subjectCode: string) {
  try {
    const filePath = path.join(
      process.cwd(),
      "content",
      "rgpv",
      "pyqs",
      `${subjectCode.toLowerCase()}.json`
    );

    const file = await fs.readFile(filePath, "utf8");

    return JSON.parse(file);
  } catch (error) {
    console.error(error);
    return null;
  }
}
