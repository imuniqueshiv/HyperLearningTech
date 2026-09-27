import fs from "fs/promises";
import path from "path";

/**
 * Atomically writes JSON: write `.tmp`, then rename over the target.
 * Never leaves a half-written JSON file at the destination path.
 */
export async function writeJsonAtomic(
  filePath: string,
  value: unknown
): Promise<void> {
  const directory = path.dirname(filePath);
  await fs.mkdir(directory, { recursive: true });

  const tempPath = `${filePath}.tmp`;
  const payload = JSON.stringify(value, null, 2) + "\n";

  await fs.writeFile(tempPath, payload, "utf8");
  await fs.rename(tempPath, filePath);
}

/**
 * Copies a file into a backup directory, preserving the basename.
 */
export async function backupFile(
  sourcePath: string,
  backupDir: string
): Promise<string> {
  await fs.mkdir(backupDir, { recursive: true });
  const destination = path.join(backupDir, path.basename(sourcePath));
  await fs.copyFile(sourcePath, destination);
  return destination;
}
