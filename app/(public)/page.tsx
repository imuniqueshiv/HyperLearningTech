import Hero from "@/features/landing/hero";
import Stats from "@/features/landing/stats";
import Features from "@/features/landing/features";
import AIDemo from "@/features/landing/ai-demo";
import Universities from "@/features/landing/universities";
import Testimonials from "@/features/landing/testimonials";
import FAQ from "@/features/landing/faq";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<div className="h-40" />}>
        <Stats />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <Features />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <AIDemo />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <Universities />
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
