/**
 * How a project runs, phase by phase: shown by the Process section and read
 * by the site's chat assistant.
 */
export interface Phase {
  index: string;
  phase: string;
  title: string;
  body: string;
  deliverables: string[];
}

export const PHASES: Phase[] = [
  {
    index: "01",
    phase: "Discover",
    title: "Requirement Gathering",
    body: "We start with a conversation, not a quote. Goals, audience and constraints get mapped out until we both know exactly what success looks like.",
    deliverables: ["Discovery call", "Goals & KPIs", "Scope document"],
  },
  {
    index: "02",
    phase: "Plan",
    title: "Planning & Strategy",
    body: "The idea becomes a blueprint: sitemap, user flows, tech stack and a timeline with real milestones, so nothing arrives as a surprise.",
    deliverables: ["Sitemap & flows", "Tech stack", "Milestones"],
  },
  {
    index: "03",
    phase: "Design",
    title: "UI/UX Design",
    body: "Wireframes first, then high-fidelity screens and motion concepts. You click through the product before a single line of code exists.",
    deliverables: ["Wireframes", "Figma prototype", "Motion concepts"],
  },
  {
    index: "04",
    phase: "Build",
    title: "Development",
    body: "Clean, typed, component-driven code. Regular preview links let you watch the product come alive and steer it while it grows.",
    deliverables: ["Next.js & React", "CMS & APIs", "Preview builds"],
  },
  {
    index: "05",
    phase: "Refine",
    title: "Testing & QA",
    body: "Every screen checked across browsers and devices, tuned for speed and audited for accessibility — polished until it feels effortless.",
    deliverables: ["Cross-device QA", "Performance", "Accessibility"],
  },
  {
    index: "06",
    phase: "Launch",
    title: "Deployment",
    body: "Domain, hosting, CI/CD, analytics and SEO wired up, then a calm, zero-downtime go-live with a handover you can actually use.",
    deliverables: ["CI/CD & hosting", "SEO & analytics", "Go-live"],
  },
  {
    index: "07",
    phase: "Evolve",
    title: "Maintenance & Growth",
    body: "Launch is the start line. Updates, monitoring and data-led improvements keep the product fast, secure and growing.",
    deliverables: ["Monitoring", "Updates", "Iterations"],
  },
];
