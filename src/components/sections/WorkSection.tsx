"use client";

import React, { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import ButtonWithIcon from "@/components/ui/button-with-icon";
import { usePageTransition } from "@/components/ui/TransitionProvider";
import { useLenis } from "@/components/ui/LenisProvider";
import { TextRoll } from "@/components/ui/TextRoll";
import { useOpenProject } from "@/components/ui/project-transition";
import { PROJECTS as ALL_PROJECTS, projectPath } from "@/data/projects";
import { useActivate, queueScrollRefresh } from "@/components/ui/use-activate";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** The first four projects; the rest live on /projects */
const PROJECTS = ALL_PROJECTS.slice(0, 4);
type Project = (typeof PROJECTS)[number];

/** How far each covered sheet sinks back, per sheet stacked on top of it */
const SINK = 0.035;

export function WorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLOListElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const pillLabelRef = useRef<HTMLSpanElement>(null);
  // Scroll position at which each sheet settles, refreshed with ScrollTrigger
  const settleRef = useRef<number[]>([]);
  const lenis = useLenis();
  const { transitionTo } = usePageTransition();
  const zoomInto = useOpenProject();

  const sceneOn = useActivate(sectionRef, "200% 0px");
  useGSAP(
    () => {
      // Set up only once the visitor nears the section (see use-activate.ts)
      if (!sceneOn) return;
      queueScrollRefresh();
      const section = sectionRef.current;
      const deck = deckRef.current;
      if (!section || !deck) return;

      const sheets = gsap.utils.toArray<HTMLElement>(".wrk-sheet", deck);
      const n = sheets.length;
      const cards = sheets.map((s) => s.querySelector<HTMLElement>(".wrk-card")!);
      const shades = sheets.map((s) => s.querySelector<HTMLElement>(".wrk-shade")!);
      const frames = sheets.map((s) => s.querySelector<HTMLElement>(".wrk-media__frame")!);

      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const reduce = Boolean(ctx.conditions?.reduce);
          const tops: number[] = [];
          const sticks: number[] = [];
          const p = new Array<number>(n).fill(0);
          const lastP = new Array<number>(n).fill(NaN);
          const lastCover = new Array<number>(n).fill(NaN);
          let vh = window.innerHeight;
          let stacked = false;
          let front = -1;

          section.classList.add("wrk-armed");
          if (reduce) sheets.forEach((s) => (s.dataset.in = "true"));

          // Sticky boxes report their stuck offset, so each sheet's resting top is
          // rebuilt from the deck's top plus the heights and gaps before it.
          const measure = () => {
            vh = window.innerHeight;
            stacked = getComputedStyle(sheets[0]).position === "sticky";
            let y = deck.getBoundingClientRect().top + window.scrollY;
            sheets.forEach((s, j) => {
              const cs = getComputedStyle(s);
              if (j) y += parseFloat(cs.marginTop) || 0;
              tops[j] = y;
              sticks[j] = stacked ? parseFloat(cs.top) || 0 : vh * 0.3;
              y += s.offsetHeight;
            });
            // Tabs only jump while the deck is stacked; in the plain list they are headers
            settleRef.current = stacked ? tops.map((t, j) => t - sticks[j]) : [];
          };

          const update = () => {
            const y = window.scrollY;
            let next = 0;
            for (let j = 0; j < n; j++) {
              const span = Math.max(1, vh - sticks[j]);
              p[j] = gsap.utils.clamp(0, 1, (y - (tops[j] - vh)) / span);
              if (p[j] >= 0.5) next = j;
              if (p[j] > 0.28 && !sheets[j].dataset.in) sheets[j].dataset.in = "true";
            }

            if (next !== front) {
              if (front >= 0) delete sheets[front].dataset.front;
              sheets[next].dataset.front = "true";
              front = next;
            }

            if (reduce) return;

            // Walk from the back so each sheet knows how much sits on top of it.
            // Writes are skipped when nothing moved, which is most sheets most frames.
            let cover = 0;
            for (let i = n - 1; i >= 0; i--) {
              if (p[i] !== lastP[i]) {
                const e = 1 - Math.pow(1 - p[i], 3);
                gsap.set(frames[i], { scale: 1.16 - 0.16 * e, yPercent: (1 - e) * 6 });
                lastP[i] = p[i];
              }
              if (stacked && cover !== lastCover[i]) {
                gsap.set(cards[i], { scale: 1 - SINK * Math.min(cover, 3) });
                shades[i].style.opacity = String(Math.min(cover, 1) * 0.62);
                lastCover[i] = cover;
              }
              cover += p[i];
            }
          };

          measure();
          update();

          const st = ScrollTrigger.create({
            trigger: deck,
            start: "top bottom",
            end: "bottom top",
            onUpdate: update,
            onRefresh: () => {
              measure();
              lastP.fill(NaN);
              lastCover.fill(NaN);
              // Resized out of the stacked layout: drop the sink and shade
              if (!stacked) {
                gsap.set(cards, { clearProps: "transform" });
                shades.forEach((s) => (s.style.opacity = ""));
              }
              update();
            },
          });

          return () => {
            st.kill();
            section.classList.remove("wrk-armed");
            gsap.set([...cards, ...frames], { clearProps: "transform" });
            shades.forEach((s) => (s.style.opacity = ""));
            sheets.forEach((s) => {
              delete s.dataset.in;
              delete s.dataset.front;
            });
          };
        }
      );

      // Cursor pill over the previews; mouse and trackpad only
      mm.add("(hover: hover) and (pointer: fine)", () => {
        const pill = pillRef.current;
        const label = pillLabelRef.current;
        if (!pill || !label) return;

        gsap.set(pill, { xPercent: -50, yPercent: -50 });
        const xTo = gsap.quickTo(pill, "x", { duration: 0.5, ease: "power3" });
        const yTo = gsap.quickTo(pill, "y", { duration: 0.5, ease: "power3" });
        let on = false;

        const move = (e: PointerEvent) => {
          if (!on) return;
          xTo(e.clientX);
          yTo(e.clientY);
        };
        const enter = (e: PointerEvent) => {
          const media = e.currentTarget as HTMLElement;
          pill.style.setProperty("--wrk-pill", media.dataset.accent ?? "#3BA7F2");
          label.textContent = media.dataset.label ?? "View";
          // Appear under the pointer rather than sweeping in from the last spot
          if (!on) {
            xTo(e.clientX, e.clientX);
            yTo(e.clientY, e.clientY);
          }
          on = true;
          pill.dataset.on = "true";
        };
        const leave = () => {
          on = false;
          delete pill.dataset.on;
        };

        const medias = gsap.utils.toArray<HTMLElement>(".wrk-media", section);
        medias.forEach((m) => {
          m.addEventListener("pointerenter", enter);
          m.addEventListener("pointerleave", leave);
        });
        window.addEventListener("pointermove", move, { passive: true });

        return () => {
          medias.forEach((m) => {
            m.removeEventListener("pointerenter", enter);
            m.removeEventListener("pointerleave", leave);
          });
          window.removeEventListener("pointermove", move);
          leave();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [sceneOn] }
  );

  const goTo = (i: number) => {
    const target = settleRef.current[i];
    if (target === undefined) return;
    if (lenis) lenis.scrollTo(target + 1, { duration: 1.1 });
    else window.scrollTo({ top: target + 1, behavior: "smooth" });
  };

  /** The card's preview grows to fill the screen and becomes the project page */
  const openProject = (e: React.MouseEvent<HTMLAnchorElement>, project: Project) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const card = e.currentTarget.closest(".wrk-card");
    const frame = card?.querySelector<HTMLElement>(".wrk-media__frame");
    zoomInto(project.slug, frame ?? e.currentTarget);
  };

  const handleAll = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    transitionTo("/projects", e.currentTarget, "#3BA7F2", "WORK");
  };

  const total = String(PROJECTS.length).padStart(2, "0");

  return (
    <section
      ref={sectionRef}
      id="work"
      aria-labelledby="work-title"
      className="wrk-section relative w-full bg-[#072A5E] text-[#E8F6FF]"
    >
      {/* ── Header ── */}
      <header className="wrk-head">
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          <span className="w-8 h-[1px] bg-[#3BA7F2]" />
          <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#3BA7F2] font-bold">
            Work // Selected projects
          </span>
        </div>

        <div className="wrk-head__row">
          <HeadingReveal
            as="h2"
            id="work-title"
            className="wrk-title font-sans font-black uppercase tracking-tighter leading-none text-[#E8F6FF]"
          >
            {["Selected work", <span key="dot" style={{ color: "#7FE7D6" }}>.</span>]}
          </HeadingReveal>
          <div className="wrk-head__aside">
            <p className="wrk-head__intro">
              A few recent builds, each taken from first sketch to production. Pick
              one to see how it came together.
            </p>
            <span className="wrk-head__count" aria-hidden="true">
              ({total})
            </span>
          </div>
        </div>
      </header>

      {/* ── The deck: each sheet pins, the next slides over it ── */}
      <ol
        ref={deckRef}
        className="wrk-deck"
        style={{ "--wrk-n": PROJECTS.length } as React.CSSProperties}
      >
        {PROJECTS.map((project, i) => {
          const index = String(i + 1).padStart(2, "0");
          const linkProps = {
            href: projectPath(project.slug),
            onClick: (e: React.MouseEvent<HTMLAnchorElement>) => openProject(e, project),
          };

          return (
            <li
              key={project.slug}
              className="wrk-sheet"
              style={
                { "--i": i, "--wrk-accent": project.accent } as React.CSSProperties
              }
            >
              <article className="wrk-card" aria-labelledby={`wrk-${project.slug}`}>
                <button
                  type="button"
                  className="wrk-tab"
                  onClick={() => goTo(i)}
                >
                  <span className="wrk-tab__idx">
                    <i aria-hidden="true" />
                    {index}
                  </span>
                  <span className="wrk-tab__name">{project.title}</span>
                  <span className="wrk-tab__kind">{project.kind}</span>
                  <span className="wrk-tab__year">{project.year}</span>
                </button>

                <div className="wrk-body">
                  <div className="wrk-info">
                    <span className="wrk-num" aria-hidden="true">
                      {index}
                    </span>
                    <div className="wrk-info__count">
                      <span>
                        {index} <b>/ {total}</b>
                      </span>
                      <span className="wrk-tags">
                        <i>{project.kind}</i>
                        <i>{project.year}</i>
                      </span>
                    </div>
                    <h3 id={`wrk-${project.slug}`} className="wrk-name">
                      {project.title}
                    </h3>
                    <p className="wrk-summary">{project.summary}</p>
                    <div className="wrk-meta">
                      <p className="wrk-role">
                        <span>Role</span>
                        {project.role}
                      </p>
                      <ul className="wrk-stack" aria-label="Built with">
                        {project.stack.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <a className="ftr-link wrk-cta" {...linkProps}>
                      <TextRoll className="ftr-link__roll" style={{ lineHeight: 1.25 }}>
                        View project
                      </TextRoll>
                      {/* Four "View project" links: say which one */}
                      <span className="sr-only">: {project.title}</span>
                      <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                    </a>
                  </div>

                  <a
                    className="wrk-media"
                    aria-label={`Open ${project.title}`}
                    data-accent={project.accent}
                    data-label="View"
                    tabIndex={-1}
                    {...linkProps}
                  >
                    {/* A slim browser bar frames the preview as the site it is */}
                    <div className="wrk-chrome" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <span>{project.href ? new URL(project.href).host : project.title}</span>
                    </div>
                    <div className="wrk-media__frame">
                      <Image
                        src={project.cover}
                        alt={`${project.title} preview`}
                        fill
                        sizes="(min-width: 1024px) 60vw, 100vw"
                        className="wrk-media__img"
                      />
                    </div>
                  </a>
                </div>

                <div className="wrk-shade" aria-hidden="true" />
              </article>
            </li>
          );
        })}
        {/* Lets the last sheet rest before the stack scrolls away */}
        <li className="wrk-tail" aria-hidden="true" />
      </ol>

      {/* ── Footer ── */}
      <div className="wrk-foot">
        <p>More builds, experiments and client work live in the archive.</p>
        <ButtonWithIcon onClick={handleAll}>All projects</ButtonWithIcon>
      </div>

      {/* Follows the pointer over the previews */}
      <div ref={pillRef} className="wrk-pill" aria-hidden="true">
        <span className="wrk-pill__inner">
          <span ref={pillLabelRef}>View</span>
          <ArrowUpRight strokeWidth={2.25} />
        </span>
      </div>
    </section>
  );
}

export default WorkSection;
