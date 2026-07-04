/**
 * Converts a title into a canonical URL-safe slug.
 *
 * Examples:
 * "Binary Search Tree" -> "binary-search-tree"
 * "DFS/BFS" -> "dfs-bfs"
 * " Hash Table " -> "hash-table"
 * */

export function createSlug(value: string): string {
  if (!value || typeof value !== "string") {
    throw new Error("createSlug(): value must be a non-empty string.");
  }

  return (
    value
      .trim()
      .toLowerCase()

      // Replace "&" with "and"
      .replace(/&/g, " and ")

      // Replace "/" "\" "_" with spaces
      .replace(/[\/\\_]+/g, " ")

      // Remove apostrophes
      .replace(/['’]/g, "")

      // Remove all remaining special characters
      .replace(/[^a-z0-9\s-]/g, "")

      // Collapse whitespace
      .replace(/\s+/g, "-")

      // Collapse multiple dashes
      .replace(/-+/g, "-")

      // Remove leading/trailing dash
      .replace(/^-|-$/g, "")
  );
}
