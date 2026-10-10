/**
 * Ahmad's profile as facts: the one source for the site's metadata, the
 * Person structured data (JSON-LD) and /llms.txt, so search engines, AI
 * assistants and recruiters all read the same thing.
 *
 * Only put true statements here. TODO(client): fill the fields marked TODO.
 */
import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from "./contact";
import { PROJECTS } from "./projects";

export const SITE_URL = "https://ahmadbarkat.dev";

export const PROFILE = {
  name: "Ahmad Barkat",
  jobTitle: "Full-Stack Developer",
  headline: "Full-stack developer (Next.js, React, TypeScript) open to remote work and relocation",
  summary:
    "Ahmad Barkat is a full-stack developer based in Pakistan (UTC+5) who designs and builds fast, polished websites and web apps with Next.js, React and TypeScript. He is open to full-time roles, remote or on-site abroad with visa sponsorship, and to freelance projects.",
  location: { city: "", country: "Pakistan", timeZone: "UTC+5, PKT" },
  skills: [
    "Next.js", "React", "TypeScript", "JavaScript", "Node.js", "Tailwind CSS",
    "GSAP", "Three.js", "REST APIs", "HTML", "CSS",
  ],
  /** TODO(client): confirm each, and add degree/certificates under `education` */
  seeking: {
    employmentTypes: ["Full-time", "Contract"],
    arrangements: ["Remote", "Relocation with visa sponsorship"],
    regions: ["United States", "United Kingdom", "Germany", "Canada", "Japan", "Europe", "Gulf"],
  },
  education: [] as { school: string; degree: string; years: string }[], // TODO(client)
  languages: [{ name: "English" }], // TODO(client): add more if relevant
  email: CONTACT_EMAIL,
  sameAs: [LINKEDIN_URL, GITHUB_URL],
} as const;

/** schema.org Person + ProfilePage, rendered once in the root layout */
export function personJsonLd() {
  const person = {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: PROFILE.name,
    jobTitle: PROFILE.jobTitle,
    description: PROFILE.summary,
    url: SITE_URL,
    email: `mailto:${PROFILE.email}`,
    image: `${SITE_URL}/opengraph-image`,
    nationality: { "@type": "Country", name: "Pakistan" },
    homeLocation: { "@type": "Place", name: PROFILE.location.country },
    knowsAbout: PROFILE.skills,
    knowsLanguage: PROFILE.languages.map((l) => l.name),
    sameAs: PROFILE.sameAs,
    seeks: {
      "@type": "Demand",
      name: "Full-stack developer roles, remote or with relocation",
      eligibleRegion: PROFILE.seeking.regions.map((name) => ({ "@type": "Place", name })),
    },
    ...(PROFILE.education.length
      ? { alumniOf: PROFILE.education.map((e) => ({ "@type": "EducationalOrganization", name: e.school })) }
      : {}),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/#profile`,
        url: SITE_URL,
        name: `${PROFILE.name}: ${PROFILE.jobTitle}`,
        mainEntity: { "@id": `${SITE_URL}/#person` },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: `${PROFILE.name} Portfolio`,
        publisher: { "@id": `${SITE_URL}/#person` },
      },
    ],
  };
}

/** The plain-text brief served at /llms.txt for AI assistants and crawlers */
export function llmsText(): string {
  const p = PROFILE;
  const lines = [
    `# ${p.name}`,
    "",
    `> ${p.summary}`,
    "",
    "## At a glance",
    `- Role: ${p.jobTitle}`,
    `- Based in: ${p.location.country} (${p.location.timeZone}); works with international teams remotely`,
    `- Looking for: ${p.seeking.employmentTypes.join(", ")} roles. ${p.seeking.arrangements.join("; ")}`,
    `- Target regions: ${p.seeking.regions.join(", ")}`,
    `- Skills: ${p.skills.join(", ")}`,
    `- Email: ${p.email}`,
    `- LinkedIn: ${LINKEDIN_URL}`,
    `- GitHub: ${GITHUB_URL}`,
    "",
    "## Pages",
    `- [Home](${SITE_URL}/home): about, services, process and tech stack`,
    `- [Projects](${SITE_URL}/projects): six projects built in 2026`,
    `- [Hire me](${SITE_URL}/hire): availability, location, skills and how to reach me`,
    `- [Contact](${SITE_URL}/contact): project brief form and a 30-minute call booking`,
    "",
    "## Projects",
    ...PROJECTS.map((pr) => `- [${pr.title}](${SITE_URL}/projects/${pr.slug}): ${pr.kind}. Stack: ${pr.stack.join(", ")}`),
    "",
  ];
  return lines.join("\n");
}
