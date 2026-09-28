/**
 * CMS role model (Phase 1).
 * Roles are assigned via allowlisted Clerk user IDs or a service token.
 */

export type CmsRole = "ADMIN" | "REVIEWER";

export const CMS_ROLE_RANK: Record<CmsRole, number> = {
  REVIEWER: 1,
  ADMIN: 2,
};

export function roleSatisfies(actual: CmsRole, required: CmsRole): boolean {
  return CMS_ROLE_RANK[actual] >= CMS_ROLE_RANK[required];
}

export function parseAllowlist(raw: string | undefined | null): Set<string> {
  if (!raw?.trim()) {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  );
}
