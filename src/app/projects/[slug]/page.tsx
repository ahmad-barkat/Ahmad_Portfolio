import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/sections/ProjectDetail";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { NextPage } from "@/components/ui/next-page";
import { PROJECTS, projectPath } from "@/data/projects";
import { PROJECT_DETAILS } from "@/data/project-details";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return PROJECTS.filter((p) => PROJECT_DETAILS[p.slug]).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: `${project.title} · Case study`,
    description: project.summary,
    openGraph: { title: project.title, description: project.summary, images: [project.cover] },
  };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { slug } = await params;
  if (!PROJECTS.some((p) => p.slug === slug) || !PROJECT_DETAILS[slug]) notFound();
  // The next project, round to the first after the last
  const index = PROJECTS.findIndex((p) => p.slug === slug);
  const next = PROJECTS[(index + 1) % PROJECTS.length];

  return (
    <div className="min-h-screen bg-[#041B3F] text-[#E8F6FF]">
      {/* Image to background, then the case: glance, case study, problem,
          challenge, process, result, the client's words, testimonials */}
      <ProjectDetail slug={slug} />

      {/* Footer // curtain reveal with the closing call to action */}
      <CinematicFooter />

      {/* Keep scrolling // the next project rises over the footer and opens */}
      <NextPage
        href={projectPath(next.slug)}
        project={next.slug}
        eyebrow="Next project"
        title={next.title}
        meta={`${next.kind} · ${next.year}`}
        image={next.cover}
      />
    </div>
  );
}
