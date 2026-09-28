import { ClerkProvider } from "@clerk/nextjs";

/**
 * Wraps the app with Clerk only when a publishable key is configured.
 * Public site continues to work without Clerk; CMS pages require it in production.
 */
export function ConditionalClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
  );
}
