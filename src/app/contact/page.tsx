import type { Metadata } from "next";
import ContactView from "@/components/sections/ContactView";
import { FAQ } from "@/data/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start a project with AHMAD Barkat: send a short brief, email directly, or read the answers to common questions about cost, timelines and working together.",
  alternates: { canonical: "/contact" },
};

/** The FAQ as structured data, so search results can show the answers */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\u003c") }}
      />
      <ContactView />
    </>
  );
}
