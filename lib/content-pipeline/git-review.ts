/**
 * Read-only Git inspection for the CMS Review workflow.
 * NEVER runs mutating git commands.
 */

import { execFile } from "child_process";
import { promisify } from "util";

import type { GitFileChange, GitReviewSnapshot } from "./review-types";

const execFileAsync = promisify(execFile);

const ALLOWED_GIT_ARGS: ReadonlyArray<ReadonlyArray<string>> = [
  ["status", "--porcelain=v1", "-b"],
  ["status"],
  ["diff"],
  ["diff", "--stat"],
  ["branch", "--show-current"],
  ["rev-parse", "--abbrev-ref", "HEAD"],
];

export class GitReviewError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GitReviewError";
    this.code = code;
  }
}

/**
 * Captures a read-only git review snapshot for the repository.
 */
export async function captureGitReview(
  cwd: string = process.cwd()
): Promise<GitReviewSnapshot> {
  const [branch, porcelain, statusText, diffText] = await Promise.all([
    runGitReadOnly(cwd, ["branch", "--show-current"]),
    runGitReadOnly(cwd, ["status", "--porcelain=v1", "-b"]),
    runGitReadOnly(cwd, ["status"]),
    runGitReadOnly(cwd, ["diff"]),
  ]);

  const files = parsePorcelain(porcelain);
  const modifiedFiles = files.filter((file) => file.kind === "modified");
  const untrackedFiles = files.filter((file) => file.kind === "untracked");
  const deletedFiles = files.filter((file) => file.kind === "deleted");

  const allPaths = files.map((file) => file.path);
  const changedJsonFiles = allPaths.filter((filePath) =>
    filePath.toLowerCase().endsWith(".json")
  );
  const changedDiagramFiles = allPaths.filter((filePath) =>
    /\.(webp|png|jpe?g|gif|svg)$/i.test(filePath)
  );

  const branchName = branch.trim() || "HEAD";

  return {
    branch: branchName,
    statusText: statusText.trimEnd(),
    diffText: diffText.trimEnd(),
    modifiedFiles,
    untrackedFiles,
    deletedFiles,
    changedJsonFiles,
    changedDiagramFiles,
    nextCommands: buildManualGitCommands(branchName),
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Builds copyable manual git commands — never executed by the CMS.
 */
export function buildManualGitCommands(branch: string): string[] {
  const safeBranch = branch.trim() || "<branch>";
  return [
    "git status",
    "git diff -- content/rgpv",
    "git add -- content/rgpv",
    'git commit -m "content: update approved CMS import"',
    `git push origin ${safeBranch}`,
  ];
}

async function runGitReadOnly(cwd: string, args: string[]): Promise<string> {
  assertReadOnlyGitArgs(args);

  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });
    return `${stdout}${stderr}`;
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    if (typeof err.stdout === "string" || typeof err.stderr === "string") {
      return `${err.stdout ?? ""}${err.stderr ?? ""}`;
    }
    throw new GitReviewError(
      "GIT_COMMAND_FAILED",
      err.message ?? "Failed to run read-only git command."
    );
  }
}

function assertReadOnlyGitArgs(args: string[]): void {
  const normalized = args.map((arg) => arg.trim());
  const allowed = ALLOWED_GIT_ARGS.some(
    (candidate) =>
      candidate.length === normalized.length &&
      candidate.every((value, index) => value === normalized[index])
  );

  if (!allowed) {
    throw new GitReviewError(
      "GIT_MUTATION_BLOCKED",
      `Blocked non-readonly git invocation: git ${normalized.join(" ")}`
    );
  }

  const joined = normalized.join(" ").toLowerCase();
  const blocked = [
    "add",
    "commit",
    "push",
    "restore",
    "checkout",
    "reset",
    "merge",
    "rebase",
    "pull",
    "clean",
    "rm",
    "mv",
  ];

  for (const verb of blocked) {
    if (normalized[0] === verb) {
      throw new GitReviewError(
        "GIT_MUTATION_BLOCKED",
        `Blocked mutating git command: git ${joined}`
      );
    }
  }
}

function parsePorcelain(output: string): GitFileChange[] {
  const lines = output.split(/\r?\n/).filter(Boolean);
  const files: GitFileChange[] = [];

  for (const line of lines) {
    if (line.startsWith("##")) {
      continue;
    }

    const status = line.slice(0, 2);
    const filePath = line.slice(3).trim().replace(/\\/g, "/");
    if (!filePath) {
      continue;
    }

    let kind: GitFileChange["kind"] = "other";
    if (status.includes("?")) {
      kind = "untracked";
    } else if (status.includes("D")) {
      kind = "deleted";
    } else if (
      status.includes("M") ||
      status.includes("A") ||
      status.includes("R") ||
      status.includes("C")
    ) {
      kind = "modified";
    }

    files.push({
      path: filePath.includes(" -> ")
        ? filePath.split(" -> ").pop()!.trim()
        : filePath,
      status: status.trim(),
      kind,
    });
  }

  return files;
}
