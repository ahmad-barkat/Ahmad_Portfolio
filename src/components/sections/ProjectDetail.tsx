"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import RevealText from "@/components/ui/RevealText";
import { TextRoll } from "@/components/ui/TextRoll";
import { StarRow, FACE_FILLS } from "@/components/ui/review-bits";
import { usePageReady } from "@/components/ui/page-ready";
import { peekArrival, finishArrival } from "@/components/ui/project-transition";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { PROJECTS } from "@/data/projects";
import { PROJECT_DETAILS, type Stat, type ProjectDetail as Detail } from "@/data/project-details";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const pad = (n: number) => String(n).padStart(2, "0");
/** Phase colours, from the palette */
const PHASE_COLORS = ["#3BA7F2", "#7FE7D6", "#5FC7E4", "#A5EEE2", "#2E93E8"];

const decimalsOf = (v: number) => (Number.isInteger(v) ? 0 : Number.isInteger(v * 10) ? 1 : 2);
const fmt = (v: number, decimals = decimalsOf(v)) => v.toFixed(decimals);

/** A number that counts up to its value when the page asks it to */
function Count({ stat }: { stat: Stat }) {
  return (
    <>
      {stat.prefix}
      <span data-count={stat.value} data-decimals={decimalsOf(stat.value)}>
        {fmt(stat.value)}
      </span>
      {stat.suffix && <small>{stat.suffix}</small>}
    </>
  );
}

function countTween(el: HTMLElement, duration = 1.6) {
  const end = Number(el.dataset.count);
  const decimals = Number(el.dataset.decimals || 0);
  const n = { v: 0 };
  el.textContent = fmt(0, decimals);
  return gsap.to(n, {
    v: end,
    duration,
    ease: "power3.out",
    onUpdate: () => {
      el.textContent = fmt(n.v, decimals);
    },
  });
}

function SecHead({ num, label, title, id }: { num: string; label: string; title: string; id: string }) {
  return (
    <header className="pd-sec-head">
      <p className="pd-eyebrow">
        <span>{num}</span>
        {label}
      </p>
      <HeadingReveal as="h2" id={id} className="pd-h2" scrollStart="top 85%">
        {title}
      </HeadingReveal>
    </header>
  );
}

/** A score ring (0–100) */
function Ring({ label, value }: { label: string; value: number }) {
  return (
    <li className="pd-ring" data-good={value >= 90}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="pd-ring__track" cx="50" cy="50" r="42" pathLength={100} />
        <circle
          className="pd-ring__arc"
          cx="50"
          cy="50"
          r="42"
          pathLength={100}
          style={{ strokeDashoffset: 100 - value }}
          data-value={value}
        />
      </svg>
      <b>
        <span data-count={value} data-decimals={0}>
          {value}
        </span>
      </b>
      <span className="pd-ring__label">{label}</span>
    </li>
  );
}

/** Before-and-after change, as the reader would say it */
function change(before: number, after: number, lowerIsBetter?: boolean) {
  const better = lowerIsBetter ? after < before : after > before;
  if (before === 0) return { text: "New", better: true };
  const ratio = after / before;
  if (!lowerIsBetter && ratio >= 2) return { text: `${fmt(Math.round(ratio * 10) / 10)}×`, better };
  const pct = Math.round(((after - before) / before) * 100);
  return { text: `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`, better };
}

/** The trend either side of launch, with launch marked; the line draws itself in */
function TrendChart({ trend }: { trend: Detail["results"]["trend"] }) {
  const W = 600;
  const H = 240;
  const top = 16;
  const bottom = 24;
  const max = Math.max(...trend.values) * 1.12 || 1;
  const n = trend.values.length;
  const pts = trend.values.map((v, i) => [(i / (n - 1)) * W, top + (1 - v / max) * (H - top - bottom)] as const);
  const line = (from: number, to: number) =>
    pts
      .slice(from, to + 1)
      .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
  const lx = pts[trend.launch][0];
  const area = `${line(trend.launch, n - 1)} L${W} ${H - bottom} L${lx.toFixed(1)} ${H - bottom} Z`;
  const last = pts[n - 1];

  return (
    <div className="pd-trend__chart">
      <div className="pd-trend__plot">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${trend.label}, before and after launch (${trend.months[trend.launch]})`}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} className="pd-trend__grid" x1="0" x2={W} y1={top + f * (H - top - bottom)} y2={top + f * (H - top - bottom)} />
        ))}
        <line className="pd-trend__launch" x1={lx} x2={lx} y1={top - 8} y2={H - bottom} />
        <path className="pd-trend__area" d={area} />
        <path className="pd-trend__line pd-trend__line--before" d={line(0, trend.launch)} pathLength={1} />
        <path className="pd-trend__line pd-trend__line--after" d={line(trend.launch, n - 1)} pathLength={1} />
      </svg>
      <span className="pd-trend__tag" style={{ left: `${(lx / W) * 100}%` }}>
        Launch
      </span>
      <span className="pd-trend__dot" style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }}>
        <b>
          {fmt(trend.values[n - 1])}
          {trend.unit}
        </b>
      </span>
      </div>
      <ol className="pd-trend__months" aria-hidden="true">
        {trend.months.map((m, i) => (
          <li key={m + i} data-launch={i === trend.launch || undefined}>
            {m}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * A project's own page. Arrives in one of two ways:
 *  - from a click: the clicked image has already grown to fill the screen
 *    (project-transition.ts); the hero paints the same frame beneath it, the
 *    overlay lifts, and the text reveals;
 *  - directly (a link, a reload): the image appears as a small rounded tile
 *    in the middle of the screen and zooms out to become the background, as
 *    in the reference, and then the text reveals.
 * The image stays behind the hero and the "at a glance" panel as you scroll,
 * darkening, until the case study slides up over it. The next project
 * follows after the footer (NextPage, in the route's page.tsx).
 */
export function ProjectDetail({ slug }: { slug: string }) {
  const project = PROJECTS.find((p) => p.slug === slug)!;
  const d = PROJECT_DETAILS[slug];
  const cs = project.caseStudy;
  // Every screenshot we have: the cover, then the rest of the gallery
  const gallery = [{ src: project.cover, caption: "The first screen" }, ...(project.gallery ?? [])];
  const index = PROJECTS.indexOf(project);

  const rootRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [arriving] = useState(() => peekArrival(slug));
  const [intro, setIntro] = useState<"pending" | "arrive" | "done">(arriving ? "arrive" : "pending");
  const started = useRef(false);
  const pageReady = usePageReady();

  const totalWeeks = Math.max(...d.process.map((p) => p.start + p.weeks));
  const totalHours = d.process.reduce((s, p) => s + p.hours, 0);

  /** The hero's text entrance, once the image is in place */
  const playText = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const tl = gsap.timeline({ onComplete: () => setIntro("done") });
    tl.to(q(".pd-bg__img"), { filter: "blur(6px)", scale: 1.05, duration: 1.6, ease: "power2.out" }, 0)
      .set(q(".pd-title"), { opacity: 1 }, 0)
      .to(q(".pd-title .hr-reveal-char"), { yPercent: 0, duration: 1.25, stagger: 0.02, ease: "expo.out" }, 0)
      .fromTo(q(".pd-lede .rw-i"), { yPercent: 110 }, { yPercent: 0, duration: 1.05, stagger: 0.01, ease: "expo.out" }, 0.25)
      .set(q(".pd-lede"), { opacity: 1 }, 0.25)
      .fromTo(
        q(".pd-hero .pd-h-in"),
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.07, ease: "power3.out" },
        0.1,
      );
    q(".pd-hero [data-count]").forEach((el, i) => tl.add(countTween(el as HTMLElement), 0.55 + i * 0.07));
    root.dataset.text = "true";
  }, []);

  const showAll = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.set(root.querySelectorAll(".pd-title .hr-reveal-char"), { yPercent: 0 });
    gsap.set(mediaRef.current, { autoAlpha: 1, clearProps: "clipPath,scale" });
    gsap.set(imgRef.current, { scale: 1.05, filter: "blur(6px)" });
    gsap.set(root.querySelectorAll(".pd-shade"), { opacity: 1 });
    root.dataset.text = "true";
    setIntro("done");
  }, []);

  // Direct visits: hold the image as a tile in the middle until the zoom
  useIsoLayoutEffect(() => {
    if (arriving) return;
    const media = mediaRef.current;
    const img = imgRef.current;
    if (!media || !img || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const W = media.clientWidth;
    const H = media.clientHeight;
    const tw = W < 640 ? W * 0.62 : Math.min(W * 0.3, 440);
    const th = (tw * 10) / 16;
    const x = (W - tw) / 2;
    const y = (H - th) / 2;
    gsap.set(media, {
      clipPath: `inset(${y}px ${W - x - tw}px ${H - y - th}px ${x}px round 28px)`,
      autoAlpha: 0,
      scale: 0.92,
    });
    gsap.set(img, { scale: Math.max(tw / W, th / H) });
    gsap.set(media.querySelector(".pd-shade"), { opacity: 0 });
  }, []);

  // From a click: lift the overlay once the hero has painted, then reveal
  useEffect(() => {
    if (!arriving || started.current) return;
    started.current = true;
    const img = imgRef.current;
    const loaded = new Promise<void>((resolve) => {
      if (!img || img.complete) return resolve();
      img.addEventListener("load", () => resolve(), { once: true });
      img.addEventListener("error", () => resolve(), { once: true });
      window.setTimeout(resolve, 2500);
    });
    loaded
      .then(() => img?.decode().catch(() => {}))
      .then(() => finishArrival(slug))
      .then(playText);
  }, [arriving, slug, playText]);

  // Direct visits: the tile zooms out into the background, then the text
  useEffect(() => {
    if (arriving || !pageReady || started.current) return;
    started.current = true;
    const media = mediaRef.current;
    const img = imgRef.current;
    if (!media || !img || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showAll();
      return;
    }
    const tl = gsap.timeline({ onComplete: playText });
    tl.to(media, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power3.out" })
      .to(media, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 1.35, ease: "power3.inOut" }, 0.75)
      .to(img, { scale: 1, duration: 1.35, ease: "power3.inOut" }, 0.75)
      .to(media.querySelector(".pd-shade"), { opacity: 1, duration: 0.8, ease: "power1.inOut" }, 1.25)
      .set(media, { clearProps: "clipPath,scale" });
  }, [arriving, pageReady, playText, showAll]);

  // If anything stalls the entrance, show the page anyway
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!rootRef.current?.dataset.text) showAll();
    }, 9000);
    return () => window.clearTimeout(id);
  }, [showAll]);

  // -- Scroll: the background darkens; sections, charts and numbers arrive --
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".pd-bg__dark",
          { opacity: 0 },
          { opacity: 0.84, ease: "none", scrollTrigger: { trigger: ".pd-hero", start: "top top", end: "bottom top", scrub: true } },
        );
        gsap.fromTo(
          ".pd-bg__zoom",
          { scale: 1 },
          { scale: 1.12, ease: "none", scrollTrigger: { trigger: ".pd-top", start: "top top", end: "bottom bottom", scrub: true } },
        );

        const once = (trigger: Element, start = "top 86%") => ({ trigger, start, once: true });

        gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((el) => {
          gsap.fromTo(el, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 1.05, ease: "power3.out", scrollTrigger: once(el) });
        });
        gsap.utils.toArray<HTMLElement>(".pd-rt").forEach((el) => {
          gsap.fromTo(
            el.querySelectorAll(".rw-i"),
            { yPercent: 110 },
            { yPercent: 0, duration: 1.05, stagger: 0.01, ease: "expo.out", scrollTrigger: once(el) },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          if (el.closest(".pd-hero")) return;
          const tw = countTween(el);
          tw.pause(0);
          ScrollTrigger.create({ ...once(el, "top bottom-=40"), onEnter: () => void tw.play() });
        });

        // Score rings fill
        gsap.utils.toArray<SVGCircleElement>(".pd-ring__arc").forEach((arc) => {
          gsap.fromTo(
            arc,
            { strokeDashoffset: 100 },
            { strokeDashoffset: 100 - Number(arc.dataset.value), duration: 1.6, ease: "power3.out", scrollTrigger: once(arc, "top 90%") },
          );
        });

        // Bars grow from the left
        const grow = (sel: string, stagger = 0.08) =>
          gsap.utils.toArray<HTMLElement>(sel).forEach((group) => {
            gsap.fromTo(
              group.querySelectorAll("[data-bar]"),
              { scaleX: 0 },
              { scaleX: 1, duration: 1.2, stagger, ease: "power3.out", scrollTrigger: once(group, "top 85%") },
            );
          });
        grow(".pd-funnel", 0.12);
        grow(".pd-timecard");
        grow(".pd-effort");
        grow(".pd-table", 0.05);

        // Difficulty meters fill segment by segment
        gsap.utils.toArray<HTMLElement>(".pd-meter").forEach((m) => {
          gsap.fromTo(
            m.querySelectorAll("i[data-on]"),
            { scaleY: 0.2, opacity: 0.2 },
            { scaleY: 1, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", scrollTrigger: once(m, "top 90%") },
          );
        });

        // The process chart draws itself as you scroll through it
        gsap.fromTo(
          ".pd-gantt__bar",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            stagger: 0.18,
            scrollTrigger: { trigger: ".pd-gantt", start: "top 82%", end: "bottom 50%", scrub: 0.6 },
          },
        );

        // Trend line draws in, the area fades up under it
        const chart = document.querySelector(".pd-trend__chart");
        if (chart) {
          const tl = gsap.timeline({ scrollTrigger: once(chart, "top 82%") });
          tl.fromTo(".pd-trend__line--before", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" })
            .fromTo(".pd-trend__line--after", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.out" })
            .fromTo(".pd-trend__area", { opacity: 0 }, { opacity: 1, duration: 0.8 }, "-=0.7")
            .fromTo([".pd-trend__dot", ".pd-trend__tag"], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.4");
        }

        // The result screenshot unfolds from a window
        const shot = document.querySelector(".pd-shot__frame");
        if (shot) {
          const tl = gsap.timeline({ scrollTrigger: { trigger: shot, start: "top 95%", end: "top 30%", scrub: 0.8 } });
          tl.fromTo(shot, { clipPath: "inset(10% 12% 10% 12% round 32px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "power2.out" }, 0).fromTo(
            ".pd-shot__img",
            { scale: 1.18 },
            { scale: 1, ease: "power2.out" },
            0,
          );
        }
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  const solved = d.problem.statement.split(/(?<=\.)\s/)[0];

  return (
    <div ref={rootRef} className="pd" data-intro={intro}>
      {/* ── Hero and the at-a-glance panel, over the image ── */}
      <div className="pd-top">
        <div className="pd-bg" aria-hidden="true">
          <div ref={mediaRef} className="pd-bg__media">
            <div className="pd-bg__zoom">
              {/* The original file, the same one the zoom overlay ends on */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} className="pd-bg__img" src={project.cover} alt="" fetchPriority="high" />
            </div>
            <div className="pd-shade" />
            <div className="pd-bg__dark" />
          </div>
        </div>

        <header className="pd-hero">
          <div className="pd-wrap pd-hero__inner">
            <div className="pd-hero__top pd-h-in">
              <Link href="/projects" className="ftr-link pd-back">
                <ArrowLeft aria-hidden="true" strokeWidth={2} />
                <TextRoll className="ftr-link__roll" style={{ lineHeight: 1.25 }}>
                  All projects
                </TextRoll>
              </Link>
              <span className="pd-index">
                Case {pad(index + 1)} <i>/ {pad(PROJECTS.length)}</i>
              </span>
            </div>

            <div className="pd-hero__copy">
              <p className="pd-kind pd-h-in">
                <span>{project.kind}</span>
                <i aria-hidden="true" />
                <span>{project.year}</span>
              </p>
              <HeadingReveal as="h1" manual className="pd-title">
                {project.title}
              </HeadingReveal>
              <div className="pd-hero__row">
                <p className="pd-lede">
                  <RevealText>{project.summary}</RevealText>
                </p>
                {project.href && (
                  <a className="ftr-link pd-live pd-h-in" href={project.href} target="_blank" rel="noreferrer">
                    <TextRoll className="ftr-link__roll" style={{ lineHeight: 1.25 }}>
                      Visit live site
                    </TextRoll>
                    <ArrowUpRight aria-hidden="true" strokeWidth={2} />
                  </a>
                )}
              </div>
            </div>

            <dl className="pd-stats">
              {d.headline.map((s) => (
                <div key={s.label} className="pd-stat pd-h-in">
                  <dt>{s.label}</dt>
                  <dd>
                    <Count stat={s} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="pd-cue pd-h-in" aria-hidden="true">
            <span>Scroll</span>
            <i />
          </p>
        </header>

        {/* ── At a glance ── */}
        <section className="pd-sec pd-glance" aria-labelledby="pd-glance-title">
          <div className="pd-wrap">
            <SecHead num="00" label="At a glance" title="The project in numbers" id="pd-glance-title" />
            <div className="pd-glance__grid">
              <div className="pd-panel pd-facts" data-rise>
                <h3 className="pd-panel__title">The essentials</h3>
                <dl>
                  <div>
                    <dt>Client</dt>
                    <dd>{d.client}</dd>
                  </div>
                  <div>
                    <dt>Timeline</dt>
                    <dd>{d.timeline}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>{project.role}</dd>
                  </div>
                  <div>
                    <dt>Team</dt>
                    <dd>{d.team}</dd>
                  </div>
                  <div className="pd-facts__wide">
                    <dt>Services</dt>
                    <dd>{d.services.join(" · ")}</dd>
                  </div>
                  <div className="pd-facts__wide">
                    <dt>Built with</dt>
                    <dd>
                      <ul className="pd-chips">
                        {project.stack.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="pd-panel pd-timecard" data-rise>
                <h3 className="pd-panel__title">Time it took</h3>
                <p className="pd-big">
                  <span data-count={totalWeeks} data-decimals={0}>
                    {totalWeeks}
                  </span>
                  <small>weeks</small>
                </p>
                <p className="pd-sub">
                  <span data-count={totalHours} data-decimals={0}>
                    {totalHours}
                  </span>{" "}
                  hours across {d.process.length} phases
                </p>
                <div className="pd-stack-bar" role="img" aria-label="Hours by phase">
                  {d.process.map((p, i) => (
                    <i
                      key={p.name}
                      data-bar
                      style={{ flexGrow: p.hours, background: PHASE_COLORS[i % PHASE_COLORS.length] }}
                      title={`${p.name}: ${p.hours} hours`}
                    />
                  ))}
                </div>
                <ul className="pd-legend">
                  {d.process.map((p, i) => (
                    <li key={p.name}>
                      <i style={{ background: PHASE_COLORS[i % PHASE_COLORS.length] }} />
                      {p.name}
                      <b>{Math.round((p.hours / totalHours) * 100)}%</b>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pd-panel pd-scores" data-rise>
                <h3 className="pd-panel__title">Lighthouse at launch</h3>
                <ul>
                  {d.scores.map((s) => (
                    <Ring key={s.label} {...s} />
                  ))}
                </ul>
              </div>

              <div className="pd-panel pd-solved" data-rise>
                <h3 className="pd-panel__title">The problem it solved</h3>
                <p className="pd-solved__text">{solved}</p>
                <ul className="pd-solved__kpis">
                  {d.results.kpis.map((k) => (
                    <li key={k.label}>
                      <b>
                        <Count stat={k} />
                      </b>
                      <span>{k.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── 01 The case study: slides up over the image ── */}
        <section className="pd-sec pd-case" aria-labelledby="pd-case-title">
          <div className="pd-wrap">
            <SecHead num="01" label="The case study" title="The short version" id="pd-case-title" />
            <div className="cs-story">
              <div className="cs-block">
                <h3 className="cs-label">
                  <span>A</span> The brief
                </h3>
                <p className="cs-text pd-rt">
                  <RevealText>{cs.brief}</RevealText>
                </p>
              </div>
              <div className="cs-block">
                <h3 className="cs-label">
                  <span>B</span> What I built
                </h3>
                <ul className="cs-built">
                  {cs.built.map((line) => (
                    <li key={line} className="pd-rt">
                      <RevealText>{line}</RevealText>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="cs-block">
                <h3 className="cs-label">
                  <span>C</span> The outcome
                </h3>
                <ul className="cs-results">
                  {cs.results.map((r) => (
                    <li key={r.label} data-rise>
                      <b className="cs-num">
                        <Count stat={r} />
                      </b>
                      <span className="cs-result-label">{r.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Every screenshot of the project: the cover, then the rest of the gallery */}
            <div className="cs-gallery" data-count={gallery.length}>
              {gallery.map((g) => (
                <figure key={g.src} className="cs-shot">
                  <div className="cs-shot__view">
                    <img src={g.src} alt={`${project.title}: ${g.caption.toLowerCase()}`} loading="lazy" decoding="async" />
                  </div>
                  <figcaption>{g.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── 02 The problem ── */}
        <section className="pd-sec pd-problem" aria-labelledby="pd-problem-title">
          <div className="pd-wrap">
            <SecHead num="02" label="The problem" title="What wasn't working" id="pd-problem-title" />
            <div className="pd-split">
              <p className="pd-statement pd-rt">
                <RevealText>{d.problem.statement}</RevealText>
              </p>
              <div className="pd-panel pd-funnel" data-rise>
                <h3 className="pd-panel__title">Where visitors dropped off, before</h3>
                <ol>
                  {d.problem.funnel.map((f) => (
                    <li key={f.label}>
                      <span className="pd-funnel__label">{f.label}</span>
                      <span className="pd-bar">
                        <i data-bar style={{ width: `${Math.max(1.2, f.value)}%` }} />
                      </span>
                      <b>
                        <span data-count={f.value} data-decimals={decimalsOf(f.value)}>
                          {fmt(f.value)}
                        </span>
                        %
                      </b>
                    </li>
                  ))}
                </ol>
                <p className="pd-note">Share of everyone who arrived</p>
              </div>
            </div>
            <ul className="pd-pains">
              {d.problem.pains.map((p) => (
                <li key={p.label} className="pd-pain" data-rise>
                  <b className="pd-num">
                    <Count stat={p} />
                  </b>
                  <span className="pd-pain__label">{p.label}</span>
                  <p>{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* ── 03 The challenge ── */}
      <section className="pd-sec pd-challenge" aria-labelledby="pd-challenge-title">
        <div className="pd-wrap">
          <SecHead num="03" label="The challenge" title="What made it hard" id="pd-challenge-title" />
          <p className="pd-statement pd-statement--wide pd-rt">
            <RevealText>{d.challenge.statement}</RevealText>
          </p>
          <div className="pd-challenge__grid">
            <ol className="pd-hard">
              {d.challenge.items.map((c, i) => (
                <li key={c.title} data-rise>
                  <span className="pd-hard__num">{pad(i + 1)}</span>
                  <div className="pd-hard__body">
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                  </div>
                  <div className="pd-hard__level">
                    <span className="pd-meter" role="img" aria-label={`Difficulty ${c.level} of 5`}>
                      {Array.from({ length: 5 }, (_, k) => (
                        <i key={k} data-on={k < c.level || undefined} />
                      ))}
                    </span>
                    <small>Difficulty {c.level}/5</small>
                  </div>
                </li>
              ))}
            </ol>
            <div className="pd-panel pd-constraints" data-rise>
              <h3 className="pd-panel__title">Constraints</h3>
              <table>
                <tbody>
                  {d.challenge.constraints.map((c) => (
                    <tr key={c.label}>
                      <th scope="row">{c.label}</th>
                      <td>{c.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── 04 The process ── */}
      <section className="pd-sec pd-process" aria-labelledby="pd-process-title">
        <div className="pd-wrap">
          <SecHead num="04" label="The process" title="How it came together" id="pd-process-title" />
          <p className="pd-intro pd-rt">
            <RevealText>{`${totalWeeks} weeks and ${totalHours} hours in ${d.process.length} phases, overlapping wherever it saved time.`}</RevealText>
          </p>

          <div className="pd-panel pd-gantt" style={{ "--weeks": totalWeeks } as React.CSSProperties} data-rise>
            <div className="pd-gantt__head" aria-hidden="true">
              <span />
              <ol className="pd-gantt__axis">
                {Array.from({ length: totalWeeks }, (_, w) => (
                  <li key={w}>{totalWeeks > 10 && w % 2 ? "" : `W${w + 1}`}</li>
                ))}
              </ol>
            </div>
            <ol className="pd-gantt__rows">
              {d.process.map((p, i) => (
                <li key={p.name} className="pd-gantt__row">
                  <span className="pd-gantt__label">
                    <b>{pad(i + 1)}</b>
                    {p.name}
                    <small>
                      {p.weeks} {p.weeks === 1 ? "week" : "weeks"}
                    </small>
                  </span>
                  <span className="pd-gantt__track">
                    <span
                      className="pd-gantt__bar"
                      style={{
                        left: `${(p.start / totalWeeks) * 100}%`,
                        width: `${(p.weeks / totalWeeks) * 100}%`,
                        background: PHASE_COLORS[i % PHASE_COLORS.length],
                      }}
                    >
                      <i>{p.hours}h</i>
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="pd-note">Weeks from kick-off to launch · bar labels are hours spent</p>
          </div>

          <ol className="pd-phases">
            {d.process.map((p, i) => (
              <li key={p.name} className="pd-phase" data-rise style={{ "--c": PHASE_COLORS[i % PHASE_COLORS.length] } as React.CSSProperties}>
                <span className="pd-phase__num">{pad(i + 1)}</span>
                <h3>{p.name}</h3>
                <p>{p.summary}</p>
                <ul className="pd-chips">
                  {p.deliverables.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 05 The result ── */}
      <section className="pd-sec pd-results" aria-labelledby="pd-results-title">
        <div className="pd-wrap">
          <SecHead num="05" label="The result" title="What changed" id="pd-results-title" />

          <figure className="pd-shot">
            <div className="pd-shot__frame">
              <div className="cs-chrome" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>{project.href ? new URL(project.href).host : project.title}</span>
              </div>
              <div className="pd-shot__view">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="pd-shot__img" src={project.cover} alt={`${project.title}, as launched`} loading="lazy" />
              </div>
            </div>
          </figure>

          <p className="pd-statement pd-statement--wide pd-rt">
            <RevealText>{d.results.statement}</RevealText>
          </p>

          <ul className="pd-kpis">
            {d.results.kpis.map((k) => (
              <li key={k.label} data-rise>
                <b className="pd-num pd-num--xl">
                  <Count stat={k} />
                </b>
                <span>{k.label}</span>
              </li>
            ))}
          </ul>

          <div className="pd-results__grid">
            <div className="pd-panel pd-table-wrap" data-rise>
              <h3 className="pd-panel__title">Before and after</h3>
              <table className="pd-table">
                <thead>
                  <tr>
                    <th scope="col">Metric</th>
                    <th scope="col">Before</th>
                    <th scope="col">After</th>
                    <th scope="col">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {d.results.table.map((r) => {
                    const c = change(r.before, r.after, r.lowerIsBetter);
                    const max = Math.max(r.before, r.after) || 1;
                    return (
                      <tr key={r.metric}>
                        <th scope="row">
                          {r.metric}
                          <span className="pd-duo" aria-hidden="true">
                            <i data-bar style={{ width: `${(r.before / max) * 100}%` }} />
                            <i data-bar data-after style={{ width: `${(r.after / max) * 100}%` }} />
                          </span>
                        </th>
                        <td data-label="Before">
                          {fmt(r.before)}
                          {r.unit}
                        </td>
                        <td data-label="After">
                          <b>
                            {fmt(r.after)}
                            {r.unit}
                          </b>
                        </td>
                        <td data-label="Change">
                          <span className="pd-change" data-better={c.better}>
                            {c.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pd-panel pd-trend" data-rise>
              <h3 className="pd-panel__title">{d.results.trend.label}</h3>
              <TrendChart trend={d.results.trend} />
            </div>
          </div>
        </div>
      </section>

      {/* ── What the client said ── */}
      <section className="pd-sec pd-review" aria-label="Client review">
        <div className="pd-wrap">
          <figure className="pd-quote">
            <p className="pd-eyebrow">
              <span>06</span>
              In their words
            </p>
            <StarRow n={d.review.rating} className="pd-stars" />
            <blockquote className="pd-quote__text pd-rt">
              <RevealText>{`“${d.review.quote}”`}</RevealText>
            </blockquote>
            <figcaption className="pd-quote__by" data-rise>
              <em style={{ background: FACE_FILLS[index % FACE_FILLS.length] }}>{d.review.initials}</em>
              <span>
                <b>{d.review.name}</b>
                <span>{d.review.role}</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Testimonials, as on the home page ── */}
      <TestimonialsSection />
    </div>
  );
}

export default ProjectDetail;
