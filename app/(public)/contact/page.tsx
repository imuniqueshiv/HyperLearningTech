import ContactSection from "@/components/contact/ContactSection";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description:
    "Get support from Hyper Learning Tech. Report issues, share feedback, or ask questions about RGPV subjects, PYQs, and AI learning tools.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main>
      <ContactSection />
    </main>
  );
}
