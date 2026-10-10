"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import ButtonWithIcon from "@/components/ui/button-with-icon";
import { usePageTransition } from "@/components/ui/TransitionProvider";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/* Promises about the work, not invented client figures. When there are real
   results (enquiries up, load times, rankings), they belong here as numbers. */
const OUTCOMES = [
  {
    key: "found",
    label: "Found",
    title: "Search-ready from day one.",
    text: "Clean structure, fast pages and metadata search engines understand, so the right people find you first.",
  },
  {
    key: "fast",
    label: "Fast",
    title: "Loads before they lose interest.",
    text: "Light pages, sized images and no bloat. Every second you save keeps a visitor on the page.",
  },
  {
    key: "chosen",
    label: "Chosen",
    title: "Built to turn visitors into enquiries.",
    text: "One clear message, an obvious next step and a design people remember when they compare.",
  },
] as const;

function FoundVisual() {
  return (
    <div className="oc-vis oc-vis--found" aria-hidden="true">
      <div className="oc-search">
        <i />
        <span>best web studio near me</span>
      </div>
      <ul className="oc-results">
        <li className="oc-result oc-result--you">
          <b>yourbrand.com</b>
          <span>Your Brand · Be the one they remember</span>
        </li>
        <li className="oc-result">
          <b />
          <span />
        </li>
        <li className="oc-result">
          <b />
          <span />
        </li>
      </ul>
    </div>
  );
}

function FastVisual() {
  return (
    <div className="oc-vis oc-vis--fast" aria-hidden="true">
      <svg viewBox="0 0 120 120" className="oc-gauge">
        <circle cx="60" cy="60" r="50" className="oc-gauge__track" />
        <circle cx="60" cy="60" r="50" className="oc-gauge__fill" pathLength={1} />
      </svg>
      <div className="oc-gauge__label">
        <b>&lt;2s</b>
        <span>Load goal</span>
      </div>
    </div>
  );
}

function ChosenVisual() {
  return (
    <div className="oc-vis oc-vis--chosen" aria-hidden="true">
      {["New enquiry", "Call booked", "New enquiry"].map((t, i) => (
        <div key={i} className="oc-note">
          <i />
          <span>
            <b>{t}</b>
            <small>from yourbrand.com</small>
          </span>
        </div>
      ))}
    </div>
  );
}

const VISUALS = { found: FoundVisual, fast: FastVisual, chosen: ChosenVisual };

/**
 * The solution, right after the problem and the proof: what standing out
 * actually gets a client. Three outcomes, each with a small picture that
 * plays once as it scrolls in, then the call to action again.
 */
export function OutcomesSection() {
  const root = useRef<HTMLElement>(null);
  const { transitionTo } = usePageTransition();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const s = root.current;
        if (!s) return;
        const once = (trigger: Element | string, start = "top 80%") => ({ trigger, start, once: true });

        gsap.from(".oc-fade", { y: 28, opacity: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", scrollTrigger: once(s, "top 75%") });
        gsap.from(".oc-card", { y: 48, opacity: 0, duration: 1, stagger: 0.12, ease: "power3.out", scrollTrigger: once(".oc-grid") });

        // Found: you rise to the top of the results
        gsap.from(".oc-result--you", { y: 64, duration: 1.1, ease: "power3.inOut", scrollTrigger: once(".oc-vis--found", "top 78%") });
        // Fast: the gauge sweeps round
        gsap.fromTo(".oc-gauge__fill", { strokeDashoffset: 1 }, { strokeDashoffset: 0.08, duration: 1.4, ease: "power2.out", scrollTrigger: once(".oc-vis--fast", "top 78%") });
        // Chosen: the enquiries arrive one after another
        gsap.from(".oc-note", { y: 26, opacity: 0, scale: 0.94, duration: 0.6, stagger: 0.35, ease: "back.out(1.6)", scrollTrigger: once(".oc-vis--chosen", "top 78%") });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="outcomes" className="oc" aria-labelledby="oc-title">
      <div className="oc-wrap">
        <header className="oc-head">
          <p className="oc-eyebrow oc-fade">
            <span aria-hidden="true" />
            The result
          </p>
          <HeadingReveal as="h2" id="oc-title" className="oc-title">
            {["What standing out gets ", <em key="you">you.</em>]}
          </HeadingReveal>
          <p className="oc-intro oc-fade">
            A site people notice is only the start. Here is what it does for your business once it is live.
          </p>
        </header>

        <div className="oc-grid">
          {OUTCOMES.map((o) => {
            const Visual = VISUALS[o.key];
            return (
              <article key={o.key} className="oc-card">
                <Visual />
                <div className="oc-card__body">
                  <span className="oc-card__label">{o.label}</span>
                  <h3 className="oc-card__title">{o.title}</h3>
                  <p className="oc-card__text">{o.text}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="oc-close oc-fade">
          <p>
            Your goals, <em>built into every page.</em>
          </p>
          <ButtonWithIcon onClick={(e) => transitionTo("/contact", e.currentTarget, "#3BA7F2", "CONTACT")}>
            Start your project
          </ButtonWithIcon>
        </div>
      </div>
    </section>
  );
}

export default OutcomesSection;
