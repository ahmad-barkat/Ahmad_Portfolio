"use client";

/**
 * /hire: the page for a recruiter, hiring manager or AI assistant. Everything
 * it says comes from src/data/profile.ts and the project data, so it matches
 * the site's structured data and /llms.txt. Two equal paths: hire me for a
 * role, or start a project.
 */
import Link from "next/link";
import ButtonWithIcon from "@/components/ui/button-with-icon";
import { TextRoll } from "@/components/ui/TextRoll";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { PROFILE } from "@/data/profile";
import { PROJECTS, projectPath } from "@/data/projects";
import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from "@/data/contact";

const ROLE_EMAIL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Role at your company")}`;

// The site's one link style (.ftr-link with the letter roll)
function RollLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  const inner = (
    <TextRoll className="ftr-link__roll" style={{ lineHeight: 1.25 }}>
      {label}
    </TextRoll>
  );
  if (external) {
    return (
      <a href={href} className="ftr-link" target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className="ftr-link">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className="ftr-link">
      {inner}
    </Link>
  );
}

export default function HireView() {
  const p = PROFILE;
  return (
    <>
      <main className="hm">
        <section className="hm-hero">
          <div className="ct-wrap hm-hero__inner">
            <p className="ct-eyebrow">
              Open to work · {p.location.country} · {p.location.timeZone}
            </p>
            <h1 className="hm-title">
              {p.name}.
              <br />
              {p.jobTitle}.
            </h1>
            <p className="hm-lede">
              I build fast, polished websites and web apps with Next.js, React and TypeScript. I am
              looking for a full-time or contract role, remote or abroad with visa sponsorship, and I
              take on freelance projects too.
            </p>
            <div className="hm-paths">
              <div className="hm-path">
                <h2>Hire me for a role</h2>
                <p>Full-time or contract, remote, or on-site with visa sponsorship.</p>
                <ButtonWithIcon
                  onClick={() => {
                    window.location.href = ROLE_EMAIL;
                  }}
                >
                  Email me about a role
                </ButtonWithIcon>
              </div>
              <div className="hm-path">
                <h2>Start a project</h2>
                <p>A website or web app, scoped and priced in writing before work starts.</p>
                <Link href="/contact#contact-form" className="hm-path__cta">
                  <ButtonWithIcon tabIndex={-1}>Send a brief</ButtonWithIcon>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="ct-section hm-body">
          <div className="ct-wrap hm-grid">
            <div>
              <p className="ct-eyebrow">At a glance</p>
              <dl className="hm-facts">
                <div>
                  <dt>Role</dt>
                  <dd>{p.jobTitle}</dd>
                </div>
                <div>
                  <dt>Looking for</dt>
                  <dd>{p.seeking.employmentTypes.join(" · ")}</dd>
                </div>
                <div>
                  <dt>Work setup</dt>
                  <dd>Remote, or relocation with visa sponsorship</dd>
                </div>
                <div>
                  <dt>Target regions</dt>
                  <dd>{p.seeking.regions.join(" · ")}</dd>
                </div>
                <div>
                  <dt>Time zone</dt>
                  <dd>{p.location.timeZone}, overlaps UK, EU and Gulf hours</dd>
                </div>
                <div>
                  <dt>Languages</dt>
                  <dd>{p.languages.map((l) => l.name).join(" · ")}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <RollLink href={`mailto:${CONTACT_EMAIL}`} label={CONTACT_EMAIL} />
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <p className="ct-eyebrow">Skills</p>
              <ul className="hm-skills">
                {p.skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>

              <p className="ct-eyebrow hm-gap">Projects built in 2026</p>
              <ul className="hm-projects">
                {PROJECTS.map((pr) => (
                  <li key={pr.slug}>
                    <Link href={projectPath(pr.slug)} className="hm-project">
                      <span className="hm-project__title">{pr.title}</span>
                      <span className="hm-project__meta">
                        {pr.kind} · {pr.stack.join(", ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="ct-eyebrow hm-gap">Find me elsewhere</p>
              <div className="hm-links">
                <RollLink href={LINKEDIN_URL} label="LinkedIn" external />
                <RollLink href={GITHUB_URL} label="GitHub" external />
                <RollLink href="/contact#book" label="Book a 30-minute call" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <CinematicFooter />
    </>
  );
}
