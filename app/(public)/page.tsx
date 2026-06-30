import Hero from "@/features/landing/hero";
import Universities from "@/features/landing/universities";
import ContactSection from "@/components/contact/ContactSection";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<div className="h-96" />}>
        <Universities />
      </Suspense>
      <ContactSection />
    </>
  );
}
