import Stats from "@/features/landing/stats";
import Features from "@/features/landing/features";
import AIDemo from "@/features/landing/ai-demo";
import Testimonials from "@/features/landing/testimonials";
import FAQ from "@/features/landing/faq";
import CgpaFeature from "@/features/landing/cgpa-feature";
import { Suspense } from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Hyper Learning Tech",
  description:
    "Learn about Hyper Learning Tech — the AI-powered platform and mission behind syllabus-mapped RGPV subjects, PYQs, and study tools.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <Suspense fallback={<div className="h-40" />}>
        <Stats />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <CgpaFeature />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <Features />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <AIDemo />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <Testimonials />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <FAQ />
      </Suspense>
    </>
  );
}
