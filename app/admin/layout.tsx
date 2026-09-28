import { redirect } from "next/navigation";

import { CmsAuthError, requireCmsPageAccess } from "@/lib/cms-auth";

export const dynamic = "force-dynamic";

/**
 * Server-enforced LOCAL CMS access for /admin pages.
 * Production / Vercel cannot open the authoring UI.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireCmsPageAccess("REVIEWER");
  } catch (error) {
    if (error instanceof CmsAuthError) {
      redirect(`/?cms_error=${encodeURIComponent(error.code)}`);
    }
    throw error;
  }

  return <>{children}</>;
}
