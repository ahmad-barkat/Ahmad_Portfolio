"use client";

import React from "react";
import { PUBLISHED_REVIEWS } from "@/data/reviews";
import { PROJECTS } from "@/data/projects";
import { ReviewAvatar as Avatar, FACE_FILLS } from "@/components/ui/review-bits";
import { TextRoll } from "@/components/ui/TextRoll";
import { RevealText } from "@/components/ui/RevealText";
import TextLoop from "@/components/ui/text-loop";
import { useLenis } from "@/components/ui/LenisProvider";
import { usePageTransition } from "@/components/ui/TransitionProvider";

/** Distinct people only, for the avatar stack and the count */
const REVIEWERS = PUBLISHED_REVIEWS.filter(
  (r, i, all) => all.findIndex((o) => o.initials === r.initials) === i,
);
const RATING = REVIEWERS.length
  ? REVIEWERS.reduce((sum, r) => sum + r.rating, 0) / REVIEWERS.length
  : 0;

function Star() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

/**
 * The hero's front layer, framing the portrait from its four corners:
 *
 *   top left      the one headline: what Ahmad does, in a sentence
 *   top right     a rotating "Open to work" badge that leads to /contact
 *   bottom left   client proof in a pill (reviews, or the shipped projects
 *                 while there are no published reviews)
 *   bottom right  a short line on how he works
 *
 * Everything else (the curved reel of projects, the portrait) sits behind.
 */
export function HeroFront() {
  const lenis = useLenis();
  const { transitionTo } = usePageTransition();

  const toReviews = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("reviews");
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 2.2 });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  const go = (href: string, color: string, label: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    transitionTo(href, e.currentTarget, color, label);
  };

  const faces = REVIEWERS.slice(0, 4);

  return (
    <div className="hx">
      <h1 className="hx-title">
        <span className="hx-line"><RevealText>Websites that</RevealText></span>{" "}
        <span className="hx-line"><RevealText>turn visitors</RevealText></span>{" "}
        <span className="hx-line"><RevealText>into <em>clients.</em></RevealText></span>
      </h1>

      <a
        href="/contact"
        className="hx-badge hx-in"
        aria-label="Open to work: get in touch"
        onClick={go("/contact", "#3BA7F2", "CONTACT")}
      >
        <TextLoop
          className="hx-badge__loop"
          text="Open to work"
          shape="circle"
          fit
          speed={55}
          direction="forward"
          separator="✦"
          curviness={70}
          fontSize={46}
          fontWeight={550}
          letterSpacing={1}
          uppercase
          color="#E8F6FF"
          ribbon={false}
          pauseOnHover={false}
        />
        <span className="hx-badge__core" aria-hidden="true">
          <Arrow />
        </span>
      </a>

      {REVIEWERS.length > 0 ? (
        <a href="#reviews" className="hx-proof hx-in" data-roll onClick={toReviews}>
          <span className="hx-proof__faces" aria-hidden="true">
            {faces.map((r, i) => (
              <span key={r.initials}>
                <Avatar review={r} fill={FACE_FILLS[i % FACE_FILLS.length]} />
              </span>
            ))}
          </span>
          <span className="hx-proof__text">
            <span className="hx-proof__rating" role="img" aria-label={`Rated ${RATING.toFixed(1)} out of 5`}>
              <span className="hx-proof__stars" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => <Star key={i} />)}
              </span>
              <b aria-hidden="true">{RATING.toFixed(1)}</b>
            </span>
            <TextRoll className="hx-proof__label">{`${REVIEWERS.length} client reviews`}</TextRoll>
          </span>
          <span className="hx-proof__go" aria-hidden="true">
            <Arrow />
          </span>
        </a>
      ) : (
        // No published reviews yet: the same pill shows the work instead
        <a href="/projects" className="hx-proof hx-in" data-roll onClick={go("/projects", "#0B3D91", "PROJECTS")}>
          <span className="hx-proof__faces hx-proof__faces--work" aria-hidden="true">
            {PROJECTS.slice(0, 3).map((p) => (
              <span key={p.slug}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.cover.replace("/projects/", "/projects/thumbs/")} alt="" decoding="async" />
              </span>
            ))}
          </span>
          <span className="hx-proof__text">
            <b className="hx-proof__count">{PROJECTS.length} projects shipped</b>
            <TextRoll className="hx-proof__label">See the work</TextRoll>
          </span>
          <span className="hx-proof__go" aria-hidden="true">
            <Arrow />
          </span>
        </a>
      )}

      <p className="hx-note hx-in">
        Websites and web apps, designed and built by one developer, not an agency.
      </p>
    </div>
  );
}

export default HeroFront;
