"use client";

import dynamic from "next/dynamic";
import { LandoAboutHero } from "@/components/sections/LandoAboutHero";
import { NoiseSection } from "@/components/sections/NoiseSection";

/* Below the first screen, each section is its own chunk. They are still
   rendered on the server (the page arrives whole), but the browser downloads
   and wakes them one at a time instead of in one long task, so a phone stays
   responsive while the hero plays. */
const OutcomesSection = dynamic(() => import("@/components/sections/OutcomesSection").then((m) => m.OutcomesSection));
const ServicesSection = dynamic(() => import("@/components/sections/ServicesSection").then((m) => m.ServicesSection));
const TechStackSection = dynamic(() => import("@/components/sections/TechStackSection").then((m) => m.TechStackSection));
const WorkSection = dynamic(() => import("@/components/sections/WorkSection").then((m) => m.WorkSection));
const ProcessSection = dynamic(() => import("@/components/sections/ProcessSection").then((m) => m.ProcessSection));
const AboutMeSection = dynamic(() => import("@/components/sections/AboutMeSection").then((m) => m.AboutMeSection));
const WhyIBuildSection = dynamic(() => import("@/components/sections/WhyIBuildSection").then((m) => m.WhyIBuildSection));
const TestimonialsSection = dynamic(() => import("@/components/sections/TestimonialsSection").then((m) => m.TestimonialsSection));
const CinematicFooter = dynamic(() => import("@/components/ui/motion-footer").then((m) => m.CinematicFooter));
const NextPage = dynamic(() => import("@/components/ui/next-page").then((m) => m.NextPage));

/* The page is an argument, in this order (client-approved, 2026-10-10):
   the promise, the problem, the proof and who made it, the call to action,
   the outcome, how it is done, the work, the plan, the person behind it,
   what clients say, and a last call to action. */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#072A5E] text-[#E8F6FF] page-enter">
      {/* 1. The promise // headline, portrait, the reel of projects */}
      <LandoAboutHero />

      {/* 2-4. The problem, the one that stands out (built by Ahmad), the call
          to action // slides in sideways over the hero */}
      <NoiseSection from="hero" />

      {/* 5. The outcome // what standing out gets you */}
      <OutcomesSection />

      {/* 6. How // the services, then the toolkit */}
      <ServicesSection />
      <TechStackSection />

      {/* 7. The evidence // selected projects */}
      <WorkSection />

      {/* 8. The plan // from the first call to launch */}
      <ProcessSection />

      {/* 9. The person // who Ahmad is, and the year told through the projects */}
      <AboutMeSection />
      <WhyIBuildSection />

      {/* 10. Social proof // client words drifting up in columns */}
      <TestimonialsSection />

      {/* 11. The last call to action // curtain reveal */}
      <CinematicFooter />

      {/* Keep scrolling // the projects page rises over the footer and opens */}
      <NextPage
        href="/projects"
        title="Projects"
        meta="Build things that matter"
        image="/projects/world-loop-poster.webp"
      />
    </div>
  );
}
