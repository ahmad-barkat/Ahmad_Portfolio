"use client";

import { ProjectsWorld } from "@/components/sections/ProjectsWorld";

export default function ProjectsPage() {
  return (
    <div className="projects-page min-h-screen text-[#E8F6FF]">
      {/* Enter my world // the media opens, you dive through it, and the
          projects wind round the logo in an endless carousel as you scroll.
          Nothing follows it: the scroll never reaches an end. */}
      <ProjectsWorld />
    </div>
  );
}
