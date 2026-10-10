import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Target CGPA Calculator",
  description:
    "Plan your target CGPA with Hyper Learning Tech’s calculator for RGPV engineering students.",
  path: "/cgpa-calculator",
});

export default function CgpaCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
