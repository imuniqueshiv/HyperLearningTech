import { createSlug } from "./slug";

export interface TopicIdentifierInput {
  subjectCode: string;
  moduleNumber: number;
  topicTitle: string;
}

/**
 * Generates a stable topic ID.
 *
 * Example:
 *
 * subjectCode : BT202
 * moduleNumber : 2
 * topicTitle : Binary Search Tree
 *
 * Returns:
 *
 * bt202-u2-binary-search-tree
 */

export function createTopicId({
  subjectCode,
  moduleNumber,
  topicTitle,
}: TopicIdentifierInput): string {
  if (!subjectCode.trim()) {
    throw new Error("Subject code is required.");
  }

  if (moduleNumber < 1) {
    throw new Error("Module number must be greater than zero.");
  }

  if (!topicTitle.trim()) {
    throw new Error("Topic title is required.");
  }

  const normalizedSubject = subjectCode
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  const slug = createSlug(topicTitle);

  return `${normalizedSubject}-u${moduleNumber}-${slug}`;
}
