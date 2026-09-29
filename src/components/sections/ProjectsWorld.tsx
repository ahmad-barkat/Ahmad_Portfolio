"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type Lenis from "lenis";
import ScrollExpandMedia, { type ScrollExpandMediaHandle } from "@/components/ui/scroll-expansion-hero";
import { useLenis } from "@/components/ui/LenisProvider";
import { usePageReady } from "@/components/ui/page-ready";
import { useOpenProject } from "@/components/ui/project-transition";
import { PROJECTS, projectPath } from "@/data/projects";
import { ProjectHelix, LOOP_SECONDS, REST_PHASE, type HelixState } from "./projects-helix";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const COUNT = PROJECTS.length;
const pad = (n: number) => String(n).padStart(2, "0");

/*
 * One pinned stage. The intro is one scrubbed timeline, in scroll "beats"
 * (1 beat = 85vh):
 *   0.00  the media window opens to fill the screen. It plays a recording of
 *         the world's idle loop (dust streaming towards a speck of a logo)
 *   1.15  the hand-off: the caption leaves and the video gives way to the
 *         live world beneath, synced to the video's frame, so nothing jumps
 *   1.55  the camera falls towards the logo
 *   2.35  the project cards rush in past the viewer onto the helix
 *   3.05  the top row and captions fade up
 *   3.40  the carousel: from here scroll turns the helix, endlessly
 *
 * The carousel. Every STEP_VH of scroll moves the cards one place, so a
 * flick moves two, three or more depending on its size, and every scroll
 * settles with four cards in front. Wheel and trackpad input is taken in
 * whole steps and eased by Lenis; touch and keys scroll natively and snap
 * when they stop. Past the intro the page has LOOPS loops of scroll room,
 * and whenever it is two loops in, it jumps back by one: the carousel repeats
 * every loop, so the jump is invisible and the scroll never ends. Scrolling
 * back up turns the carousel back, then replays the intro in reverse.
 */
const DIVE_AT = 1.15;
const DIVE_FOR = 0.4;
const DOLLY_AT = 1.55;
const CARDS_AT = 2.35;
const HUD_AT = 3.05;
const CAROUSEL_AT = 3.4;
const BEAT = 0.85;
const STEP_VH = 0.3;
const STEP_BEATS = STEP_VH / BEAT;
const LOOPS = 4;
const ZONE = LOOPS * COUNT * STEP_BEATS;

/** Lenis's own easing, for the carousel's steps */
const expoOut = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
const cubicOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Lenis's running animation (not in its public types) */
type LenisAnimate = { isRunning: boolean; from: number; to: number; value: number };

export function ProjectsWorld() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const heroRef = useRef<ScrollExpandMediaHandle>(null);
  const stateRef = useRef<HelixState>({ dolly: 0, spin: -Math.PI * 1.5, cards: 0, offset: REST_PHASE });
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  /** Where the carousel starts on the timeline (0 with reduced motion) */
  const carouselAtRef = useRef(CAROUSEL_AT);
  const worldOnRef = useRef(false);
  /** While the video still shows, the live world follows its clock */
  const videoOnRef = useRef(true);
  const [front, setFront] = useState(0);
  const [introState, setIntroState] = useState<"pending" | "running" | "done">("pending");
  const lenis = useLenis();
  const lenisRef = useRef<Lenis | null>(null);
  lenisRef.current = lenis;
  const ready = usePageReady();
  const helixRef = useRef<ProjectHelix | null>(null);
  const zoomInto = useOpenProject();

  /**
   * The carousel's scroll geometry, in px: where it starts (the first stop),
   * the scroll per step, and one loop (a step per project). Rounded, so
   * every stop is a whole pixel.
   */
  const geometry = () => {
    const tl = tlRef.current;
    const st = tl?.scrollTrigger;
    if (!tl || !st) return null;
    const perBeat = (st.end - st.start) / tl.duration();
    const step = Math.max(1, Math.round(STEP_BEATS * perBeat));
    return { y0: Math.round(st.start + carouselAtRef.current * perBeat), step, loop: step * COUNT };
  };

  // -- Scroll: the intro on one pinned, scrubbed timeline, then the carousel --
  useGSAP(
    () => {
      const section = sectionRef.current;
      const hero = heroRef.current;
      if (!section || !hero) return;
      const S = stateRef.current;
      const mm = gsap.matchMedia();

      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const reduce = Boolean(ctx.conditions?.reduce);
          const introAt = reduce ? 0 : CAROUSEL_AT;
          carouselAtRef.current = introAt;

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            onUpdate: () => {
              worldOnRef.current = reduce || tl.time() >= DIVE_AT + 0.1;
              videoOnRef.current = !reduce && tl.time() < DIVE_AT + DIVE_FOR;
            },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${(introAt + ZONE) * BEAT * window.innerHeight}`,
              pin: true,
              scrub: reduce ? true : 0.7,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          tlRef.current = tl;

          if (reduce) {
            hero.hide();
            S.dolly = 1;
            S.spin = 0;
            S.cards = 1;
            gsap.set(hudRef.current, { autoAlpha: 1 });
            tl.to({}, { duration: ZONE }, 0);
            return;
          }

          hero.expand(tl, 0, 1);
          hero.dive(tl, DIVE_AT, DIVE_FOR);
          tl.fromTo(S, { dolly: 0 }, { dolly: 1, duration: 1.05, ease: "power1.inOut" }, DOLLY_AT)
            .fromTo(S, { spin: -Math.PI * 1.5 }, { spin: 0, duration: 1.3, ease: "power2.out" }, DOLLY_AT)
            .fromTo(S, { cards: 0 }, { cards: 1, duration: 0.95 }, CARDS_AT)
            .fromTo(hudRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, HUD_AT)
            // The carousel's scroll room: the cards follow the scroll directly
            // (see the render loop), not this timeline
            .to({}, { duration: ZONE }, CAROUSEL_AT);
        },
      );
    },
    { scope: sectionRef },
  );

  // -- Entrance: waits for the preloader and page transition ----------------
  const introTlRef = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    if (!ready || introTlRef.current) return;
    const hero = heroRef.current;
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIntroState("done");
      return;
    }
    const tl = hero.intro();
    introTlRef.current = tl;
    tl.eventCallback("onComplete", () => setIntroState("done"));
    setIntroState("running");
    tl.play();
  }, [ready]);

  useEffect(() => () => void introTlRef.current?.kill(), []);

  // If something stalls the entrance, show the page anyway
  useEffect(() => {
    const id = window.setTimeout(() => setIntroState((s) => (s === "pending" ? "done" : s)), 6000);
    return () => window.clearTimeout(id);
  }, []);

  // -- The carousel: wheel steps, snapping, and the endless wrap -------------
  useEffect(() => {
    if (!lenis) return;
    const animate = (lenis as unknown as { animate?: LenisAnimate }).animate;
    let acc = 0;
    let lastWheel = 0;
    let busy = false;

    /** Move the whole scroll by `by` px mid-flight, momentum and all */
    const shift = (by: number) => {
      lenis.animatedScroll += by;
      lenis.targetScroll += by;
      if (animate?.isRunning) {
        animate.from += by;
        animate.to += by;
        animate.value += by;
      }
      window.scrollTo({ top: lenis.animatedScroll, behavior: "instant" });
      ScrollTrigger.update();
    };

    const stepTo = (y: number) => lenis.scrollTo(y, { programmatic: false, duration: 1.1, easing: expoOut });

    // Wheel and trackpad: whole steps, as many as the gesture is big
    const onWheel = (e: WheelEvent) => {
      const g = geometry();
      if (!g || e.ctrlKey || lenis.isStopped) return;
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 40;
      else if (e.deltaMode === 2) d *= window.innerHeight;
      if (Math.abs(e.deltaX) > Math.abs(d)) return;
      const dest = lenis.targetScroll;
      if (dest < g.y0 - 1) {
        acc = 0;
        return; // still in the intro: Lenis scrolls as usual
      }
      const base = g.y0 + Math.max(0, Math.round((dest - g.y0) / g.step)) * g.step;
      if (base <= g.y0 && d < 0) {
        acc = 0;
        return; // back up past the first stop, into the intro
      }
      e.preventDefault();
      (e as WheelEvent & { lenisStopPropagation?: boolean }).lenisStopPropagation = true;
      const now = performance.now();
      // A pause ends the gesture: drop what is left of it
      if (now - lastWheel > 500) acc = 0;
      lastWheel = now;
      acc += d;
      // The first ~30% of a step already commits to it, so one notch moves
      const n = Math.sign(acc) * Math.floor(Math.abs(acc) / g.step + 0.7);
      if (!n) return;
      acc -= n * g.step;
      stepTo(Math.max(g.y0, base + n * g.step));
    };

    // Keys: one card per arrow, two per page
    const onKey = (e: KeyboardEvent) => {
      const g = geometry();
      if (!g || e.metaKey || e.ctrlKey || e.altKey || lenis.isStopped) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("input, textarea, select, [contenteditable]")) return;
      if (e.key === " " && el?.closest?.("a, button")) return;
      const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 2, PageUp: -2, " ": e.shiftKey ? -2 : 2 };
      const n = moves[e.key];
      if (!n) return;
      const dest = lenis.targetScroll;
      if (dest < g.y0 - 1) return;
      const base = g.y0 + Math.max(0, Math.round((dest - g.y0) / g.step)) * g.step;
      if (base <= g.y0 && n < 0) return;
      e.preventDefault();
      stepTo(Math.max(g.y0, base + n * g.step));
    };

    const onScroll = () => {
      const g = geometry();
      if (!g || busy) return;
      const y = lenis.animatedScroll;

      // Two loops in: jump back one. Mid-flight when Lenis is easing, at
      // rest otherwise; a native (touch) scroll finishes first.
      if (y >= g.y0 + 2 * g.loop) {
        busy = true;
        if (lenis.isScrolling === "smooth" && animate) shift(-g.loop);
        else if (lenis.isScrolling === false) lenis.scrollTo(y - g.loop, { immediate: true, force: true });
        busy = false;
        return;
      }

      // At rest between stops (after touch, the scrollbar, or scrolling out
      // of the intro): settle on a stop, leaning the way it was going
      if (lenis.isScrolling !== false || lenis.isTouching || y < g.y0 - g.step * 0.5) return;
      if (y < g.y0 && lenis.direction < 0) return;
      const k = (y - g.y0) / g.step;
      const lean = lenis.direction > 0 ? Math.ceil(k - 0.25) : lenis.direction < 0 ? Math.floor(k + 0.25) : Math.round(k);
      const to = g.y0 + Math.max(0, lean) * g.step;
      if (Math.abs(to - y) > 1) lenis.scrollTo(to, { duration: 0.7, easing: cubicOut });
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("keydown", onKey);
    const off = lenis.on("scroll", onScroll);
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("keydown", onKey);
      off();
    };
  }, [lenis]);

  // -- The 3D world -----------------------------------------------------------
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    let helix: ProjectHelix;
    try {
      helix = new ProjectHelix(canvas, PROJECTS.map((p) => p.cover), stateRef.current);
    } catch {
      stage.dataset.fallback = "true";
      return;
    }

    helixRef.current = helix;
    const S = stateRef.current;
    let inView = false;
    const size = () => {
      const top = hudRef.current?.querySelector<HTMLElement>(".pw-hud__top");
      const clear = top ? top.offsetTop + top.offsetHeight + 12 : 0;
      helix.resize(stage.clientWidth, stage.clientHeight, clear);
    };
    size();

    // Captions follow their cards; the ticks show which projects are in front
    const fronts = PROJECTS.map(() => ({ card: -1, weight: 0 }));
    const hovered = { card: -1 };
    let lastMask = -1;
    const caption = () => {
      helix.frontCards(fronts);
      const { mode, labelRatio } = helix.frontLayout;
      const half = stage.clientWidth / 2;
      let mask = 0;
      fronts.forEach(({ card, weight }, p) => {
        const el = labelRefs.current[p];
        if (!el) return;
        const r = weight > 0.02 ? helix.cardRect(card) : null;
        if (!r) {
          el.style.visibility = "hidden";
          return;
        }
        if (weight > 0.5) mask |= 1 << p;
        let alpha = weight * weight;
        if (mode === "row") {
          el.style.width = `${r.width}px`;
          el.style.transform = `translate3d(${r.left}px, ${r.top + r.height + 12}px, 0)`;
          delete el.dataset.side;
        } else {
          // Beside the card, on the side with room; faded as the card swings across
          const cx = r.left + r.width / 2;
          const left = cx < half;
          el.style.width = `${r.width * labelRatio}px`;
          el.style.transform = left
            ? `translate3d(${r.left + r.width + 14}px, ${r.top + r.height / 2}px, 0) translateY(-50%)`
            : `translate3d(${r.left - 14}px, ${r.top + r.height / 2}px, 0) translate(-100%, -50%)`;
          el.dataset.side = left ? "right" : "left";
          alpha *= Math.min(1, Math.abs(cx - half) / (r.width * 0.3));
        }
        el.style.opacity = alpha.toFixed(3);
        el.style.visibility = alpha > 0.01 ? "visible" : "hidden";
        if (card === hovered.card) el.dataset.hover = "";
        else delete el.dataset.hover;
      });
      if (mask !== lastMask) {
        lastMask = mask;
        setFront(mask);
      }
    };

    const tick = (time: number) => {
      if (!inView || !worldOnRef.current) return;
      if (videoOnRef.current) {
        const video = heroRef.current?.video();
        if (video) helix.syncLoop(video.currentTime % LOOP_SECONDS);
      }
      // The carousel follows the scroll directly, so it moves with Lenis
      const g = geometry();
      const l = lenisRef.current;
      if (g) {
        const y = l ? l.animatedScroll : window.scrollY;
        S.offset = REST_PHASE + Math.max(0, y - g.y0) / g.step;
      }
      helix.render(time);
      caption();
    };
    gsap.ticker.add(tick);

    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), { threshold: 0 });
    io.observe(stage);
    const ro = new ResizeObserver(size);
    ro.observe(stage);

    const fine = window.matchMedia("(pointer: fine)").matches;
    const at = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return helix.pick(e.clientX - r.left, e.clientY - r.top);
    };
    const hover = (card: number) => {
      hovered.card = card;
      helix.setHover(card);
      if (card >= 0) stage.dataset.hover = "open";
      else delete stage.dataset.hover;
    };
    const onMove = (e: PointerEvent) => {
      helix.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      if (!inView) return;
      const label = (e.target as Element).closest?.<HTMLElement>(".pw-label");
      if (label) return hover(fronts[Number(label.dataset.project)]?.card ?? -1);
      if ((e.target as Element).closest?.("a, button")) return hover(-1);
      const hit = at(e);
      hover(hit?.front ? hit.card : -1);
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    // Click one of the four in front (or its caption) to open it
    const onClick = (e: MouseEvent) => {
      const label = (e.target as Element).closest<HTMLElement>(".pw-label");
      if (label) {
        const card = fronts[Number(label.dataset.project)]?.card ?? -1;
        if (card >= 0) openRef.current(card);
        return;
      }
      if ((e.target as Element).closest("a, button")) return;
      const hit = at(e);
      if (hit?.front) openRef.current(hit.card);
    };
    stage.addEventListener("click", onClick);

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
      if (fine) window.removeEventListener("pointermove", onMove);
      stage.removeEventListener("click", onClick);
      helixRef.current = null;
      helix.dispose();
    };
    // geometry reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** The card grows from where it is to fill the screen and becomes the project page */
  const openCard = (card: number) => {
    const helix = helixRef.current;
    const canvas = canvasRef.current;
    const rect = helix?.cardRect(card);
    if (!helix || !canvas || !rect) return;
    const r = canvas.getBoundingClientRect();
    zoomInto(PROJECTS[rect.project].slug, {
      rect: { left: r.left + rect.left, top: r.top + rect.top, width: rect.width, height: rect.height },
      radius: rect.radius,
      objectPosition: "50% 0%",
    });
  };

  // The canvas listeners are set up once; this keeps them current
  const openRef = useRef(openCard);
  openRef.current = openCard;

  return (
    <section
      ref={sectionRef}
      className="pw"
      aria-label="Projects"
      data-intro-state={introState}
    >
      <div ref={stageRef} className="pw-stage">
        <div className="pw-backdrop" aria-hidden="true" />
        <canvas ref={canvasRef} className="pw-canvas" aria-hidden="true" />
        <div className="pw-vignette" aria-hidden="true" />

        <ScrollExpandMedia
          ref={heroRef}
          mediaType="video"
          mediaSrc="/projects/world-loop.mp4"
          posterSrc="/projects/world-loop-poster.webp"
          title="Enter My World"
          date={`Selected work · ${pad(COUNT)} projects`}
          scrollToExpand="Scroll to dive in"
        >
          <p className="pw-lede">
            Every build here started as someone&rsquo;s idea.
            <br />
            Here is what they became.
          </p>
        </ScrollExpandMedia>

        <div ref={hudRef} className="pw-hud">
          <div className="pw-hud__top">
            <span className="pw-eyebrow">Selected work</span>
            <span className="pw-count" aria-hidden="true">
              <span className="pw-ticks">
                {PROJECTS.map((p, i) => (
                  <i key={p.slug} data-on={front & (1 << i) ? "" : undefined} />
                ))}
              </span>
              {pad(COUNT)} projects
            </span>
          </div>

          {/* Captions under (or beside) the four cards in front; they move with them */}
          <div className="pw-labels" aria-hidden="true">
            {PROJECTS.map((p, i) => (
              <div
                key={p.slug}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className="pw-label"
                data-project={i}
              >
                <span className="pw-label__meta">
                  <b>{pad(i + 1)}</b>
                  {p.kind.split(" · ")[0]}
                </span>
                <span className="pw-label__title">{p.title}</span>
              </div>
            ))}
          </div>

          <p className="pw-scroll" aria-hidden="true">
            <span>Scroll</span>
            <i />
          </p>
        </div>
      </div>

      {/* Every project in plain text, for screen readers, keyboards and search engines */}
      <ul className="sr-only">
        {PROJECTS.map((p) => (
          <li key={p.slug}>
            <h3>{p.title}</h3>
            <p>
              {p.kind}, {p.year}. {p.summary} Built with {p.stack.join(", ")}.
            </p>
            <a href={projectPath(p.slug)}>Read about {p.title}</a>
            {p.href && <a href={p.href}>Visit {p.title}</a>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ProjectsWorld;
