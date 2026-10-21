"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import ButtonWithIcon from "@/components/ui/button-with-icon";
import { LogoMark } from "@/components/ui/Logo";
import { usePageTransition } from "@/components/ui/TransitionProvider";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/* Promises about the work, not invented client figures. When there are real
   results (enquiries up, load times, rankings), they belong here as numbers. */
const OUTCOMES = [
  {
    key: "found",
    word: "Found",
    title: "Search-ready from day one.",
    text: "Clean structure, fast pages and metadata search engines understand, so the right people find you first.",
    spec: ["Semantic HTML", "Schema", "Sitemap"],
  },
  {
    key: "fast",
    word: "Fast",
    title: "Loads before they lose interest.",
    text: "Light pages, sized images and no bloat. Every second you save keeps a visitor on the page.",
    spec: ["Under 2 s goal", "Sized images", "No bloat"],
  },
  {
    key: "chosen",
    word: "Chosen",
    title: "Built to turn visitors into enquiries.",
    text: "One clear message, an obvious next step and a design people remember when they compare.",
    spec: ["One message", "One next step", "Phone first"],
  },
] as const;

/* Where each card lies in the pile before it is dealt (desktop) */
const PILE_TILT = [-7, 4, -2];

/**
 * The solution, right after the problem and the proof: what standing out
 * actually gets a client. Three outcomes as a deck of cards: they wait
 * face down in one pile and, as the section scrolls in, are dealt into a
 * row, turning over on the way. On phones each card turns over as it
 * arrives. With a mouse, a card leans towards the pointer.
 */
export function OutcomesSection() {
  const root = useRef<HTMLElement>(null);
  const { transitionTo } = usePageTransition();

  useGSAP(
    () => {
      const s = root.current;
      if (!s) return;
      const deck = s.querySelector<HTMLElement>(".oc-deck");
      const cards = gsap.utils.toArray<HTMLElement>(".oc-card", s);
      const faces = gsap.utils.toArray<HTMLElement>(".oc-card__inner", s);
      if (!deck || cards.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".oc-fade", {
          y: 28,
          opacity: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: s, start: "top 75%", once: true },
        });
      });

      // Desktop: one pile in the middle, dealt into the row as you scroll
      mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        const toPile = (i: number) => deck.offsetWidth / 2 - (cards[i].offsetLeft + cards[i].offsetWidth / 2);
        const tl = gsap.timeline({
          scrollTrigger: { trigger: deck, start: "top 90%", end: "top 25%", scrub: 0.7, invalidateOnRefresh: true },
        });
        tl.fromTo(
          cards,
          { x: toPile, y: (i) => 90 - i * 6, rotationZ: (i) => PILE_TILT[i] },
          { x: 0, y: 0, rotationZ: 0, duration: 1, stagger: 0.14, ease: "power3.inOut" },
          0,
        );
        tl.fromTo(
          faces,
          { rotationY: (i) => (i === 0 ? -180 : 180) },
          { rotationY: 0, duration: 0.75, stagger: 0.14, ease: "power2.inOut" },
          0.2,
        );
        // Each card lifts off the table while it turns over
        tl.to(cards, { z: 110, duration: 0.38, stagger: 0.14, ease: "sine.out" }, 0.2);
        tl.to(cards, { z: 0, duration: 0.42, stagger: 0.14, ease: "sine.in" }, 0.58);
      });

      // Phones and tablets: each card turns over as it arrives
      mm.add("(max-width: 899px) and (prefers-reduced-motion: no-preference)", () => {
        cards.forEach((card, i) => {
          const side = i % 2 ? 1 : -1;
          const tl = gsap.timeline({
            scrollTrigger: { trigger: card, start: "top 96%", end: "top 48%", scrub: 0.6 },
          });
          tl.fromTo(card, { x: 36 * side, y: 50, rotationZ: 6 * side }, { x: 0, y: 0, rotationZ: 0, ease: "power3.out" }, 0);
          tl.fromTo(faces[i], { rotationY: 180 * side }, { rotationY: 0, ease: "power2.inOut" }, 0);
        });
      });

      // Mouse: a card leans towards the pointer
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const offs = cards.map((card) => {
          const tilt = card.querySelector<HTMLElement>(".oc-card__tilt");
          if (!tilt) return () => {};
          const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.6, ease: "power3" });
          const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.6, ease: "power3" });
          let box: DOMRect | null = null;
          const enter = () => (box = card.getBoundingClientRect());
          const move = (e: PointerEvent) => {
            if (!box) box = card.getBoundingClientRect();
            ry(((e.clientX - box.left) / box.width - 0.5) * 14);
            rx(-((e.clientY - box.top) / box.height - 0.5) * 10);
          };
          const leave = () => {
            box = null;
            rx(0);
            ry(0);
          };
          card.addEventListener("pointerenter", enter);
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          return () => {
            card.removeEventListener("pointerenter", enter);
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
          };
        });
        return () => offs.forEach((off) => off());
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

        <div className="oc-deck">
          {OUTCOMES.map((o, i) => {
            const num = String(i + 1).padStart(2, "0");
            return (
              <article key={o.key} className="oc-card">
                <div className="oc-card__tilt">
                  <div className="oc-card__inner">
                    <div className="oc-face oc-face--front">
                      <span className="oc-face__pip" aria-hidden="true">
                        {num}
                      </span>
                      <div className="oc-face__top" aria-hidden="true">
                        <span>{num}</span>
                        <LogoMark className="oc-face__mark" />
                      </div>
                      <p className="oc-face__word" aria-hidden="true">
                        {o.word}
                        <span>.</span>
                      </p>
                      <div className="oc-face__body">
                        <h3 className="oc-face__title">{o.title}</h3>
                        <p className="oc-face__text">{o.text}</p>
                      </div>
                      <ul className="oc-face__spec" aria-label="Included">
                        {o.spec.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="oc-face oc-face--back" aria-hidden="true">
                      <LogoMark className="oc-back__mark" />
                      <span className="oc-back__name">Ahmad</span>
                      <span className="oc-back__num">{num} / 03</span>
                    </div>
                  </div>
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
