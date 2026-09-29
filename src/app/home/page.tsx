"use client";

import { LandoAboutHero } from "@/components/sections/LandoAboutHero";
import { AboutMeSection } from "@/components/sections/AboutMeSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { WorkSection } from "@/components/sections/WorkSection";
import { TechStackSection } from "@/components/sections/TechStackSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { NextPage } from "@/components/ui/next-page";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#072A5E] text-[#E8F6FF] page-enter">
      {/* Hero Section with Engaging Editorial Hook */}
      <LandoAboutHero />

      {/* About Me Section // Origin Story & Dual Persona */}
      <AboutMeSection />

      {/* Services // pinned horizontal showcase with the particle field */}
      <ServicesSection />

      {/* Process // scroll-drawn road map from idea to launch */}
      <ProcessSection />

      {/* Tech stack // the toolkit, pulled together by gravity */}
      <TechStackSection />

      {/* Work // stacked deck of selected projects */}
      <WorkSection />

      {/* Testimonials // client words drifting up in columns */}
      <TestimonialsSection />

      {/* Footer // curtain reveal with the closing call to action */}
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
