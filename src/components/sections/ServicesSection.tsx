"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import { ParticleField, FIELD_FIT } from "@/components/ui/ParticleField";
import { useActivate, queueScrollRefresh } from "@/components/ui/use-activate";
import { useLenis } from "@/components/ui/LenisProvider";
import {
  drawBolt,
  drawCode,
  drawCube,
  drawCurve,
  drawNib,
  drawPhone,
  paintGlyph,
  type ShapeDrawer,
} from "@/components/ui/particle-shapes";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface Service {
  index: string;
  tag: string;
  title: string;
  body: string;
  points: string[];
  /** Name of the symbol the particle field forms for this service. */
  form: string;
  /** The word the particles spell under the symbol. */
  word: string;
  accent: string;
  shape: ShapeDrawer;
}

const SERVICES: Service[] = [
  {
    index: "01",
    tag: "Core Build",
    title: "Full-Stack Development",
    body: "Production web apps from database to pixel — typed end to end, fast by default, and architected to hold up well past launch day.",
    points: ["Next.js & React", "APIs & databases", "Auth & payments", "Headless CMS"],
    form: "Code",
    word: "CODE",
    accent: "#3BA7F2",
    shape: drawCode,
  },
  {
    index: "02",
    tag: "Design Systems",
    title: "UI/UX & Interface Design",
    body: "Interfaces with a point of view. From wireframes to a living design system, shaped around how people actually move through a product.",
    points: ["Wireframes & prototypes", "Design systems", "Accessibility (WCAG)", "Figma to code"],
    form: "Nib",
    word: "DESIGN",
    accent: "#7FE7D6",
    shape: drawNib,
  },
  {
    index: "03",
    tag: "GSAP // Motion",
    title: "Motion & Scroll Animation",
    body: "Motion that explains instead of decorates — scroll-driven stories, page transitions and micro-interactions tuned to hold 60–120 FPS.",
    points: ["ScrollTrigger stories", "Page transitions", "Micro-interactions", "SVG & Lottie"],
    form: "Curve",
    word: "MOTION",
    accent: "#5FC7E4",
    shape: drawCurve,
  },
  {
    index: "04",
    tag: "Three.js // Shaders",
    title: "3D & WebGL Experiences",
    body: "Real-time 3D in the browser without melting the laptop: interactive scenes, product viewers and custom shaders that load fast and stay smooth.",
    points: ["Three.js scenes", "Custom GLSL shaders", "3D product viewers", "Asset optimisation"],
    form: "Cube",
    word: "WEBGL",
    accent: "#3BA7F2",
    shape: drawCube,
  },
  {
    index: "05",
    tag: "Core Web Vitals",
    title: "Performance & SEO",
    body: "Speed is a feature. Audits and fixes that move Lighthouse and Core Web Vitals into the green — and the monitoring that keeps them there.",
    points: ["Core Web Vitals", "Technical SEO", "Bundle & image budgets", "Performance monitoring"],
    form: "Bolt",
    word: "SPEED",
    accent: "#7FE7D6",
    shape: drawBolt,
  },
  {
    index: "06",
    tag: "Every Screen",
    title: "Mobile & Responsive Apps",
    body: "One product, every screen. Responsive builds and installable PWAs that feel native on a phone and generous on a 4K display.",
    points: ["Responsive layouts", "Progressive Web Apps", "Touch & gesture UX", "Cross-device QA"],
    form: "Device",
    word: "MOBILE",
    accent: "#A5EEE2",
    shape: drawPhone,
  },
];

// Module-level so ParticleField sees stable arrays and never rebuilds.
const SHAPES = SERVICES.map((s) => s.shape);
const WORDS = SERVICES.map((s) => s.word);

// Kept in step with the matching media queries in globals.css (.svc-*).
// Every screen size scrolls through the cards; only reduced motion gets the
// plain swipe carousel.
const PINNED = "(prefers-reduced-motion: no-preference)";
const CAROUSEL = "(prefers-reduced-motion: reduce)";
// Phones travel the same six cards in less scroll than a desktop
const PHONE = "(max-width: 767px)";

const pad = (n: number) => String(n).padStart(2, "0");

function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Builds the per-frame focus pass. `visual` is the track position in card units
 * (0 = first card in focus, 1 = second, …), so every card's treatment follows its
 * real distance from focus rather than switching when an index flips. The same
 * number drives the particle field, so the symbol morphs in step with the cards.
 */
function makeFocusDriver(
  cards: HTMLElement[],
  onIndex: (i: number) => void,
  progressEl: HTMLElement | null,
  morph: React.MutableRefObject<number>
) {
  const n = cards.length;
  const setters = cards.map((card) => ({
    // Two setters, not "scale": that shorthand is only expanded into scaleX/scaleY
    // when a tween initialises, which quickSetter skips, so it silently no-ops.
    scaleX: gsap.quickSetter(card, "scaleX"),
    scaleY: gsap.quickSetter(card, "scaleY"),
    opacity: gsap.quickSetter(card, "opacity"),
    glow: gsap.quickSetter(card.querySelector(".svc-card__glow")!, "opacity"),
    shift: gsap.quickSetter(card.querySelector(".svc-card__content")!, "x", "px"),
  }));
  const bar = progressEl ? gsap.quickSetter(progressEl, "scaleX") : null;
  let last = -1;

  return (visual: number) => {
    morph.current = visual;
    for (let i = 0; i < n; i++) {
      const d = i - visual;
      const a = Math.min(Math.abs(d), 1);
      const scale = 1 - 0.09 * a;
      setters[i].scaleX(scale);
      setters[i].scaleY(scale);
      setters[i].opacity(1 - 0.52 * a);
      setters[i].glow(Math.max(0, 1 - Math.abs(d) * 1.8));
      // The copy trails the card slightly, so text settles a beat after the frame.
      setters[i].shift(Math.max(-1, Math.min(1, d)) * -26);
    }
    bar?.(n > 1 ? Math.min(1, Math.max(0, visual / (n - 1))) : 1);

    const idx = Math.max(0, Math.min(n - 1, Math.round(visual)));
    if (idx !== last) {
      last = idx;
      onIndex(idx);
    }
  };
}

/* ── The orbit ────────────────────────────────────────────────────────────────
   Pinned mode turns the cards on a tilted orbit, a mix of three ideas: a ring
   that blows open into a wheel (the opening), a cylinder that spins sideways,
   and a coverflow's flat front card with its neighbours turned away.

   One number drives it all: `u`, in scroll units. 0 is the closed ring, small
   cards set round a circle; 1 is the orbit with the first card at the front;
   every whole number after that turns one more card past. On the orbit each
   card sits on a circle seen slightly from above and rolled, so the next card
   waits low on the right, deeper in, and the last one leaves high on the
   left: scrolling down carries the cards up and across. */
const STEP = 40; // degrees between cards on the orbit
const ORBIT_R = 1.3; // orbit radius, in card widths
const TILT_X = 16; // degrees the orbit is tipped towards the viewer
const ROLL_Z = 15; // degrees the orbit is rolled, so it runs low right to high left
const FACE = 0.62; // share of the orbit angle a card turns (coverflow, not edge-on)
const RING_SCALE = 0.3; // card size in the closed ring
const RING_R = 0.44; // ring radius, in card widths

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (d: number) => (d * Math.PI) / 180;

function makeOrbitDriver(
  cards: HTMLElement[],
  onIndex: (i: number) => void,
  progressEl: HTMLElement | null,
  morph: React.MutableRefObject<number>
) {
  const n = cards.length;
  const glow = cards.map((c) => c.querySelector<HTMLElement>(".svc-card__glow"));
  const bar = progressEl ? gsap.quickSetter(progressEl, "scaleX") : null;
  const sx = Math.sin(rad(TILT_X));
  const cx = Math.cos(rad(TILT_X));
  const sz = Math.sin(rad(ROLL_Z));
  const cz = Math.cos(rad(ROLL_Z));
  let last = -1;

  return (u: number) => {
    const w = cards[0].offsetWidth;
    const R = w * ORBIT_R;
    // The ring fits the stage's height too (phones give it a short one)
    const stageH = cards[0].parentElement?.clientHeight || w;
    const ringR = Math.min(w * RING_R, stageH * 0.3);
    const ringScale = Math.min(RING_SCALE, (stageH * 0.26) / (cards[0].offsetHeight || 1));
    const m = Math.min(1, Math.max(0, u)); // ring (0) to orbit (1)
    const e = m * m * (3 - 2 * m);
    const pos = Math.max(0, Math.min(n - 1, u - 1)); // which card is at the front
    morph.current = pos;

    for (let i = 0; i < n; i++) {
      const d = i - pos;
      const th = rad(d * STEP);
      // On the orbit's circle, front at z = 0, then tipped and rolled
      const X = R * Math.sin(th);
      const Z = R * (Math.cos(th) - 1);
      const Y1 = Z * sx; // further back sits higher
      const Z1 = Z * cx;
      const X2 = X * cz - Y1 * sz;
      const Y2 = X * sz + Y1 * cz;

      const ringDeg = i * (360 / n);
      const ad = Math.abs(d);
      cards[i].style.transform =
        `translate(-50%, -50%) translate3d(${(e * X2).toFixed(1)}px, ${(e * Y2).toFixed(1)}px, ${(e * Z1).toFixed(1)}px)` +
        ` rotateZ(${((1 - e) * ringDeg).toFixed(2)}deg) translateY(${(-(1 - e) * ringR).toFixed(1)}px)` +
        ` rotateZ(${(e * ROLL_Z * 0.5 * Math.max(-1.5, Math.min(1.5, d))).toFixed(2)}deg)` +
        ` rotateY(${(e * d * STEP * FACE).toFixed(2)}deg)` +
        ` scale(${lerp(ringScale, 1, e).toFixed(3)})`;

      // Neighbours dim; the far ones fade out before they could turn edge-on
      let o = 1 - 0.42 * Math.min(ad, 1);
      if (ad > 1.15) o *= Math.max(0, (1.85 - ad) / 0.7);
      cards[i].style.opacity = lerp(1, o, e).toFixed(3);
      cards[i].style.zIndex = String(Math.round(200 + e * Z1 - (1 - e) * i));
      cards[i].style.pointerEvents = e > 0.9 && ad < 0.5 ? "auto" : "none";
      const g = glow[i];
      if (g) g.style.opacity = String(e * Math.max(0, 1 - ad * 1.8));
    }
    bar?.(n > 1 ? pos / (n - 1) : 1);

    const idx = Math.round(pos);
    if (idx !== last) {
      last = idx;
      onIndex(idx);
    }
  };
}

export function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const visualRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLCanvasElement>(null);
  // Track position in card units, written by the focus driver, read by the field.
  const morphRef = useRef(0);

  const [active, setActive] = useState(0);
  const [fieldFailed, setFieldFailed] = useState(false);
  const lenis = useLenis();
  // The pin, while the orbit is live: the index jumps through it
  const pinRef = useRef<ScrollTrigger | null>(null);
  const UNITS = SERVICES.length; // one to open the ring, then one per card after the first

  // ── WebGL fallback: the active symbol as a plain outline ─────────────────
  useEffect(() => {
    const visual = visualRef.current;
    const canvas = fallbackRef.current;
    if (!fieldFailed || !visual || !canvas) return;
    const svc = SERVICES[active];
    const paint = () => {
      const side = Math.min(visual.clientWidth, visual.clientHeight) * FIELD_FIT * 2;
      if (side > 0) paintGlyph(canvas, svc.shape, side, withAlpha(svc.accent, 0.7));
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(visual);
    return () => ro.disconnect();
  }, [fieldFailed, active]);

  const handleFieldReady = useCallback((live: boolean) => setFieldFailed(!live), []);

  const handleIndex = useCallback((i: number) => setActive(i), []);

  const sceneOn = useActivate(sectionRef, "200% 0px");
  useGSAP(
    () => {
      // Set up only once the visitor nears the section (see use-activate.ts)
      if (!sceneOn) return;
      queueScrollRefresh();
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;
      const cards = cardRefs.current.filter((c): c is HTMLElement => !!c);
      const n = cards.length;
      if (n < 2) return;

      const clear = () => {
        gsap.set(cards, { clearProps: "transform,opacity" });
        gsap.set(section.querySelectorAll(".svc-card__glow, .svc-card__content"), {
          clearProps: "transform,opacity",
        });
        if (progressRef.current) gsap.set(progressRef.current, { clearProps: "transform" });
      };

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(section.querySelectorAll("[data-svc-fade]"), {
          y: 32,
          opacity: 0,
          duration: 0.95,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 78%", once: true },
        });
      });

      // Pin the section and turn the orbit with the scroll: one unit opens the
      // ring, then each unit brings the next card to the front. Phones spend
      // less scroll per unit, so the pin never outstays its welcome. Snap
      // settles on whole units, so a card is always square to the reader.
      mm.add(PINNED, () => {
        const unit = () => window.innerHeight * (window.matchMedia(PHONE).matches ? 0.5 : 0.7);
        const update = makeOrbitDriver(cards, handleIndex, progressRef.current, morphRef);
        const proxy = { u: 0 };

        const tween = gsap.to(proxy, {
          u: UNITS,
          ease: "none",
          onUpdate: () => update(proxy.u),
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${unit() * UNITS}`,
            pin: true,
            scrub: 0.9,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: () => update(proxy.u),
            snap: {
              snapTo: 1 / UNITS,
              // Settle on the unit nearest to where scrolling stopped. The
              // default inertia projects the stop from velocity, so a hard
              // trackpad flick would fly past several cards.
              inertia: false,
              duration: { min: 0.25, max: 0.7 },
              delay: 0.06,
              ease: "power2.inOut",
            },
          },
        });
        pinRef.current = tween.scrollTrigger ?? null;
        update(0);
        return () => {
          pinRef.current = null;
          gsap.set(cards, { clearProps: "transform,opacity,zIndex,pointerEvents" });
          clear();
        };
      });

      // Reduced motion: a native swipe carousel. Nothing hijacks vertical
      // scrolling; focus is read from where the track has been swiped to.
      mm.add(CAROUSEL, () => {
        const update = makeFocusDriver(cards, handleIndex, null, morphRef);
        let raf = 0;
        const measure = () => {
          raf = 0;
          update(track.scrollLeft / (cards[1].offsetLeft - cards[0].offsetLeft));
        };
        const onScroll = () => {
          if (!raf) raf = requestAnimationFrame(measure);
        };
        track.addEventListener("scroll", onScroll, { passive: true });
        measure();
        return () => {
          track.removeEventListener("scroll", onScroll);
          cancelAnimationFrame(raf);
          clear();
        };
      });

      // The pin is measured at creation, but the page is still sliding in
      // (.page-enter) and web fonts can still reflow the header. Re-measure once
      // both have settled. A refresh re-measures every pin on the page (a ~50ms
      // task), so it waits until the hero's entrance has finished and then for
      // an idle moment, rather than landing mid-entrance as a dropped frame.
      // Nobody can scroll this far down before then.
      let idle = 0;
      const settle = window.setTimeout(() => {
        const ric = window.requestIdleCallback;
        if (ric) idle = ric(() => ScrollTrigger.refresh(), { timeout: 1200 });
        else ScrollTrigger.refresh();
      }, 2800);
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        window.clearTimeout(settle);
        if (idle) window.cancelIdleCallback?.(idle);
        mm.revert();
      };
    },
    { scope: sectionRef, dependencies: [sceneOn] }
  );

  const goTo = (i: number) => {
    const pin = pinRef.current;
    if (pin) {
      const y = pin.start + ((pin.end - pin.start) * (i + 1)) / UNITS;
      if (lenis) lenis.scrollTo(y, { duration: 1.2 });
      else window.scrollTo({ top: y, behavior: "smooth" });
      return;
    }
    const track = trackRef.current;
    const card = cardRefs.current[i];
    if (!track || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const current = SERVICES[active];

  // Hover spotlight: the light follows the cursor across the card. Percentages,
  // because the focused card is scaled and its rect is in scaled pixels.
  const spotlight = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  };

  return (
    <section
      ref={sectionRef}
      id="services"
      aria-labelledby="services-title"
      className="svc-section relative w-full overflow-hidden bg-[#072A5E] text-[#E8F6FF]"
    >
      <div aria-hidden="true" className="svc-bg" />

      <div className="svc-frame">
        {/* ── Header ── */}
        <header className="svc-head">
          <div data-svc-fade className="flex items-center gap-3 mb-4 sm:mb-5">
            <span className="w-8 h-[1px] bg-[#3BA7F2]" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#3BA7F2] font-bold">
              Services // What I forge
            </span>
          </div>

          <div className="svc-head__row">
            <HeadingReveal
              as="h2"
              id="services-title"
              className="svc-title font-sans font-black uppercase tracking-tighter leading-none text-[#E8F6FF]"
            >
              {["What I build", <span key="dot" style={{ color: "#7FE7D6" }}>.</span>]}
            </HeadingReveal>
            <p data-svc-fade className="svc-head__intro">
              Six disciplines, one standard — from the first wireframe to the last
              millisecond of load time.
            </p>
          </div>
        </header>

        {/* ── Stage: the particle field on the left, the cards on the right ── */}
        <div data-svc-fade className="svc-stage">
          <div ref={visualRef} className="svc-visual">
            <ParticleField
              className="svc-particles"
              shapes={SHAPES}
              words={WORDS}
              position={morphRef}
              onReady={handleFieldReady}
            />
            {fieldFailed && <canvas ref={fallbackRef} aria-hidden="true" className="svc-fallback" />}
            <div aria-hidden="true" className="svc-visual__label">
              <b>{current.index}</b>
              <span className="svc-visual__rule" />
              Form // {current.form}
            </div>
          </div>

          <div className="svc-rail">
            <div
              ref={trackRef}
              className="svc-track"
              role="region"
              aria-roledescription="carousel"
              aria-label="Services"
            >
              <div aria-hidden="true" className="svc-spacer" />

              {SERVICES.map((svc, i) => (
                <article
                  key={svc.index}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="svc-card"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${SERVICES.length}: ${svc.title}`}
                  style={{ "--svc-accent": svc.accent } as React.CSSProperties}
                  onPointerMove={spotlight}
                >
                  <div aria-hidden="true" className="svc-card__surface" />
                  <span aria-hidden="true" className="svc-card__num">
                    {svc.index}
                  </span>
                  <div aria-hidden="true" className="svc-card__glow" />

                  <div className="svc-card__content">
                    <div className="svc-card__head">
                      <span className="svc-card__tag">
                        <i aria-hidden="true" />
                        {svc.tag}
                      </span>
                      <span aria-hidden="true" className="svc-card__count">
                        <b>{svc.index}</b> / {pad(SERVICES.length)}
                      </span>
                    </div>

                    <div className="svc-card__main">
                      <h3 className="svc-card__title">{svc.title}</h3>
                      <p className="svc-card__body">{svc.body}</p>
                    </div>

                    <ul className="svc-card__chips" aria-label="Includes">
                      {svc.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}

              <div aria-hidden="true" className="svc-spacer" />
            </div>
          </div>
        </div>

        {/* ── Pinned mode: position readout ── */}
        <div data-svc-fade className="svc-foot svc-pinned-only">
          <span className="svc-foot__count">
            <span className="text-[#E8F6FF]">{pad(active + 1)}</span> / {pad(SERVICES.length)}
          </span>
          <div className="svc-progress">
            <div ref={progressRef} className="svc-progress__fill" />
            <ol className="svc-index" aria-label="Services">
              {SERVICES.map((svc, i) => (
                <li key={svc.index}>
                  <button
                    type="button"
                    className="svc-index__btn"
                    aria-label={`${svc.index}: ${svc.title}`}
                    aria-current={i === active}
                    onClick={() => goTo(i)}
                  >
                    <span className="svc-index__tip">{svc.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <span className="svc-foot__title">{current.title}</span>
        </div>

        {/* ── Carousel mode: controls ── */}
        <div className="svc-nav svc-carousel-only">
          <button
            type="button"
            className="svc-nav__btn"
            aria-label="Previous service"
            onClick={() => goTo(Math.max(0, active - 1))}
            disabled={active === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex items-center">
            {SERVICES.map((svc, i) => (
              <button
                key={svc.index}
                type="button"
                className="svc-dot"
                aria-label={`Go to ${svc.title}`}
                aria-current={i === active}
                onClick={() => goTo(i)}
              >
                <span />
              </button>
            ))}
          </div>

          <button
            type="button"
            className="svc-nav__btn"
            aria-label="Next service"
            onClick={() => goTo(Math.min(SERVICES.length - 1, active + 1))}
            disabled={active === SERVICES.length - 1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
