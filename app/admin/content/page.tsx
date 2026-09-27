import type { Metadata } from "next";

import { ContentDashboard } from "@/components/admin/content-dashboard";

export const metadata: Metadata = {
  title: "Content CMS",
  description:
    "Local-first content management dashboard for Hyper Learning Tech.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminContentPage() {
  return (
    <main className="min-h-screen bg-background">
      <ContentDashboard />
    </main>
  );
}
