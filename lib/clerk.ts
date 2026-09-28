/**
 * Clerk configuration helpers for the public application.
 * Local CMS uses CMS_LOCAL_MODE (see lib/cms-auth.ts) — not Clerk.
 */

export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim()
  );
}

export function getClerkPublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || null;
}
