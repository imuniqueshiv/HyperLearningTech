import Hero from "@/features/landing/hero";
import Stats from "@/features/landing/stats";
import Features from "@/features/landing/features";
import AIDemo from "@/features/landing/ai-demo";
import Universities from "@/features/landing/universities";
import Testimonials from "@/features/landing/testimonials";
import FAQ from "@/features/landing/faq";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <AIDemo />
      <Universities />
      <Testimonials />
      <FAQ />
    </>
  );
}