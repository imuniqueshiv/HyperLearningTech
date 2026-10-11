import path from "node:path";

/**
 * Absolute `content/rgpv` root.
 * Marked so Turbopack does not expand process.cwd() into a whole-project NFT trace.
 */
export function getRgpvContentRoot(): string {
  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "content",
    "rgpv"
  );
}

/**
 * Join segments under an absolute root without `path.join(root, ...dynamics)`,
 * which Turbopack treats as an overly broad NFT pattern (tens of thousands of files).
 */
export function joinUnderAbsoluteRoot(
  absoluteRoot: string,
  ...segments: string[]
): string {
  const parts = segments.map((segment) =>
    segment.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "")
  );
  return [absoluteRoot, ...parts].join(path.sep);
}

export function getRgpvSubjectDir(
  branch: string,
  semester: string,
  subjectCode: string
): string {
  return joinUnderAbsoluteRoot(
    getRgpvContentRoot(),
    branch.toLowerCase(),
    semester.toLowerCase(),
    subjectCode.toLowerCase()
  );
}

export function getRgpvSubjectFile(
  branch: string,
  semester: string,
  subjectCode: string,
  filename: string
): string {
  return joinUnderAbsoluteRoot(
    getRgpvSubjectDir(branch, semester, subjectCode),
    filename
  );
}
