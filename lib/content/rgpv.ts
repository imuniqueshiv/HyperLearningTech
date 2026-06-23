import fs from "fs/promises";
import path from "path";

export async function getSyllabus(
  branch: string,
  semester: string,
  subject: string
) {
  const filePath = path.join(
    process.cwd(),
    "content",
    "rgpv",
    branch,
    semester,
    subject,
    "syllabus.json"
  );

  const data = await fs.readFile(filePath, "utf8");

  return JSON.parse(data);
}

export async function getPYQs(
  branch: string,
  semester: string,
  subject: string
) {
  const filePath = path.join(
    process.cwd(),
    "content",
    "rgpv",
    branch,
    semester,
    subject,
    "pyqs.json"
  );

  const data = await fs.readFile(filePath, "utf8");

  return JSON.parse(data);
}
