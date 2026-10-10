"use client";

import { LandoAboutHero } from "@/components/sections/LandoAboutHero";
import { NoiseSection } from "@/components/sections/NoiseSection";
import { OutcomesSection } from "@/components/sections/OutcomesSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { TechStackSection } from "@/components/sections/TechStackSection";
import { WorkSection } from "@/components/sections/WorkSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { AboutMeSection } from "@/components/sections/AboutMeSection";
import { WhyIBuildSection } from "@/components/sections/WhyIBuildSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { NextPage } from "@/components/ui/next-page";

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
