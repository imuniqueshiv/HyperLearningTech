import Hero from "@/features/landing/hero";
import Universities from "@/features/landing/universities";
import ContactSection from "@/components/contact/ContactSection";
import DashboardPage from "@/app/dashboard/page";
import { Suspense } from "react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getHomeStructuredData } from "@/lib/seo/structured-data";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={getHomeStructuredData()} />
      <Hero />
      <Suspense fallback={<div className="h-96" />}>
        <Universities />
      </Suspense>
      <section id="Dashboard">
        <DashboardPage />
      </section>
      <ContactSection />
    </>
  );
}
