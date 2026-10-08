import type { Metadata } from "next";
import HireView from "@/components/sections/HireView";

export const metadata: Metadata = {
  title: "Hire me",
  description:
    "Ahmad Barkat, full-stack developer (Next.js, React, TypeScript). Open to full-time roles, remote or with visa sponsorship, and to freelance projects. Skills, availability, projects and how to reach him.",
  alternates: { canonical: "/hire" },
};

export default function HirePage() {
  return <HireView />;
}
