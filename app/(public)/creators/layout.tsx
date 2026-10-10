import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Creators",
  description:
    "Meet the creators behind Hyper Learning Tech — the team building AI-powered RGPV learning tools for engineering students.",
  path: "/creators",
});

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
