"use client";

import React, { useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import ButtonWithIcon from "@/components/ui/button-with-icon";
import { usePageTransition } from "@/components/ui/TransitionProvider";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface Phase {
  index: string;
  phase: string;
  title: string;
  body: string;
  deliverables: string[];
}

const PHASES: Phase[] = [
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

/* ── Tuning ─────────────────────────────────────────────────────────────── */
/** Spacing of the resampled route, in world px. Lookups index it directly. */
const STEP = 4;
/** Scroll px spent per (weighted) px of route while drawing. */
const DRAW_RATIO = 0.5;
/** U-turns carry no content, so they scroll by faster than the rest. */
const TURN_WEIGHT = 0.55;
/** How much the pen slows into each checkpoint: 0 = constant speed, 1 = full stop. */
const SETTLE = 0.78;
/** Scroll spent diving in from the overview, and pulling back out, in viewports. */
const DIVE = 0.9;
const OUTRO = 1.15;
/** Gap between a checkpoint node and its card, in screen px. Mirrors --prc-gap-c. */
const CARD_GAP = 34;

type V = { x: number; y: number };
type Cam = { x: number; y: number; z: number; fx: number; fy: number };

interface Route {
  X: Float32Array;
  Y: Float32Array;
  /** Cumulative scroll weight at each sample: turns count for less. */
  Wc: Float64Array;
  n: number;
  L: number;
  d: string;
  nodes: { x: number; y: number; len: number; w: number; side: 1 | -1 }[];
  start: V;
  end: V;
  box: { x0: number; y0: number; x1: number; y1: number };
  hump: number;
}

const f1 = (n: number) => n.toFixed(1);
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The road, laid out as three rows that sweep the full width and join with
 * U-turns: gentle waves whose crests are the checkpoints, with a cursive loop
 * in every row. Built from analytic pieces whose ends all meet with matching
 * tangents, then resampled evenly so any point can be looked up by length.
 */
function buildRoute(vw: number, vh: number, cardH: number): Route {
  const hump = Math.min(Math.max(vw * 0.6, 340), 980);
  const amp = Math.min(Math.max(vh * 0.12, 60), 120);
  const loopLen = hump * 0.42;
  const loopR = loopLen / 3.3; // 2πR > loopLen, so the stroke circles back over itself
  // Rows sit far enough apart that a card on one never covers the next row's road.
  const rowGap = Math.max(vh * 0.9, 2 * amp + cardH + CARD_GAP + 120);
  const rho = rowGap / 2;

  const raw: number[] = [0, 0];
  const turnFlag: number[] = [0];
  const nodeRaw: number[] = [];
  const sides: (1 | -1)[] = [];
  let x = 0;
  let y = 0;
  let dir = 1;

  const run = (n: number, f: (v: number) => [number, number], turn = 0) => {
    for (let k = 1; k <= n; k++) {
      const [px, py] = f(k / n);
      raw.push(px, py);
      turnFlag.push(turn);
    }
  };

  const flat = (len: number) => {
    const xa = x;
    run(Math.ceil(len / 2), (v) => [xa + dir * len * v, y]);
    x += dir * len;
  };

  // A crest with a checkpoint on top. Each side either continues the wave (sine)
  // or eases flat (sine²) to meet a loop, a turn or the ends of the road.
  const crest = (flatIn: boolean, flatOut: boolean) => {
    const xa = x;
    const s: 1 | -1 = nodeRaw.length % 2 === 0 ? -1 : 1;
    const n = 2 * Math.ceil(hump / 4);
    run(n, (v) => {
      const sv = Math.sin(Math.PI * v);
      const g = (v < 0.5 ? flatIn : flatOut) ? sv * sv : sv;
      return [xa + dir * hump * v, y + s * amp * g];
    });
    nodeRaw.push(turnFlag.length - 1 - n / 2);
    sides.push(s);
    x += dir * hump;
  };

  // A prolate trochoid: the pen runs forward, circles back and crosses its own
  // stroke, leaving flat and level just as it arrived.
  const loop = (s: 1 | -1) => {
    const xa = x;
    const n = Math.ceil((loopLen + 2 * Math.PI * loopR) / 2);
    run(n, (v) => [
      xa + dir * (loopLen * v + loopR * Math.sin(2 * Math.PI * v)),
      y + s * loopR * (1 - Math.cos(2 * Math.PI * v)),
    ]);
    x += dir * loopLen;
  };

  const turn = () => {
    const xa = x;
    const ya = y;
    const d = dir;
    run(
      Math.ceil((Math.PI * rho) / 2),
      (v) => {
        const th = -Math.PI / 2 + Math.PI * v;
        return [xa + d * rho * Math.cos(th), ya + rho + rho * Math.sin(th)];
      },
      1
    );
    y += rowGap;
    dir = -dir;
  };

  flat(hump * 0.3);
  crest(true, false);
  crest(false, true);
  loop(-1);
  crest(true, true);
  turn();
  crest(true, true);
  loop(1);
  crest(true, true);
  turn();
  crest(true, true);
  loop(-1);
  crest(true, true);
  flat(hump * 0.3);

  // Resample evenly by arc length.
  const rn = turnFlag.length;
  const rawLen = new Float64Array(rn);
  for (let i = 1; i < rn; i++) {
    rawLen[i] = rawLen[i - 1] + Math.hypot(raw[2 * i] - raw[2 * i - 2], raw[2 * i + 1] - raw[2 * i - 1]);
  }
  const L = rawLen[rn - 1];
  const n = Math.floor(L / STEP) + 1;
  const X = new Float32Array(n);
  const Y = new Float32Array(n);
  const Wc = new Float64Array(n);
  let j = 0;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < n; i++) {
    const s = i * STEP;
    while (j < rn - 2 && rawLen[j + 1] < s) j++;
    const t = clamp01((s - rawLen[j]) / Math.max(1e-6, rawLen[j + 1] - rawLen[j]));
    X[i] = lerp(raw[2 * j], raw[2 * j + 2], t);
    Y[i] = lerp(raw[2 * j + 1], raw[2 * j + 3], t);
    if (i > 0) Wc[i] = Wc[i - 1] + STEP * (turnFlag[j + 1] ? TURN_WEIGHT : 1);
    x0 = Math.min(x0, X[i]);
    y0 = Math.min(y0, Y[i]);
    x1 = Math.max(x1, X[i]);
    y1 = Math.max(y1, Y[i]);
  }

  let d = `M${f1(X[0])} ${f1(Y[0])}`;
  for (let i = 2; i < n; i += 2) d += `L${f1(X[i])} ${f1(Y[i])}`;
  d += `L${f1(raw[2 * rn - 2])} ${f1(raw[2 * rn - 1])}`;

  const nodes = nodeRaw.map((ri, k) => {
    const len = rawLen[ri];
    return { x: raw[2 * ri], y: raw[2 * ri + 1], len, w: Wc[Math.min(n - 1, Math.round(len / STEP))], side: sides[k] };
  });

  return {
    X,
    Y,
    Wc,
    n,
    L,
    d,
    nodes,
    start: { x: raw[0], y: raw[1] },
    end: { x: raw[2 * rn - 2], y: raw[2 * rn - 1] },
    box: { x0, y0, x1, y1 },
    hump,
  };
}

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradRef = useRef<SVGLinearGradientElement>(null);
  const gridRef = useRef<SVGRectElement>(null);
  const ghostRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const hudLabelRef = useRef<HTMLSpanElement>(null);
  const hudBarRef = useRef<HTMLSpanElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `prc-grad-${uid}`;
  const dotsId = `prc-dots-${uid}`;
  const { transitionTo } = usePageTransition();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      const view = viewRef.current;
      const svg = svgRef.current;
      const grad = gradRef.current;
      const grid = gridRef.current;
      const ghost = ghostRef.current;
      const glow = glowRef.current;
      const line = lineRef.current;
      const tip = tipRef.current;
      const startPin = startRef.current;
      const endPin = endRef.current;
      const probe = probeRef.current;
      const hudLabel = hudLabelRef.current;
      const hudBar = hudBarRef.current;
      const steps = stepRefs.current as HTMLLIElement[];
      const cards = cardRefs.current as HTMLElement[];
      if (!section || !track || !view || !svg || !grad || !grid || !ghost || !glow || !line || !tip) return;
      if (!startPin || !endPin || !probe || !hudLabel || !hudBar) return;
      if (steps.some((s) => !s) || cards.some((c) => !c)) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        section.classList.add("prc-armed");

        let route: Route | null = null;
        let vw = 1;
        let vh = 1;
        let nav = 60;
        let cardW = 360;
        let cardH = 260;
        let pDive = 0.1;
        let pDraw = 0.85;
        let progress = 0;

        // Per-element write caches, so an idle frame touches nothing
        const shown: boolean[] = [];
        const reached: boolean[] = [];
        let lastPhase = "";
        let lastHud = -2;
        let lastOv = -1;
        let lastStroke = -1;

        const build = () => {
          vw = view.clientWidth;
          vh = view.clientHeight;
          nav = probe.offsetHeight;
          cardW = cards[0].offsetWidth;
          cardH = Math.max(...cards.map((c) => c.offsetHeight));
          route = buildRoute(vw, vh, cardH);

          ghost.setAttribute("d", route.d);
          glow.setAttribute("d", route.d);
          line.setAttribute("d", route.d);
          const dash = `${f1(route.L)} ${f1(route.L + 40)}`;
          glow.style.strokeDasharray = dash;
          line.style.strokeDasharray = dash;

          const { box } = route;
          grad.setAttribute("x1", f1(box.x0));
          grad.setAttribute("x2", f1(box.x1));
          grad.setAttribute("y1", f1(box.y0));
          grad.setAttribute("y2", f1(box.y1));
          grid.setAttribute("x", f1(box.x0 - 4000));
          grid.setAttribute("y", f1(box.y0 - 4000));
          grid.setAttribute("width", f1(box.x1 - box.x0 + 8000));
          grid.setAttribute("height", f1(box.y1 - box.y0 + 8000));

          const dive = vh * DIVE;
          const draw = route.Wc[route.n - 1] * DRAW_RATIO;
          const outro = vh * OUTRO;
          const total = dive + draw + outro;
          pDive = dive / total;
          pDraw = (dive + draw) / total;
          track.style.height = `${Math.round(total + vh)}px`;
          lastStroke = -1;
          lastOv = -1;
          render();
        };

        // ── Route lookups ──
        const at = (len: number): V => {
          const r = route as Route;
          const f = Math.min(Math.max(len / STEP, 0), r.n - 1);
          const i = Math.min(Math.floor(f), r.n - 2);
          const t = f - i;
          return { x: lerp(r.X[i], r.X[i + 1], t), y: lerp(r.Y[i], r.Y[i + 1], t) };
        };

        // Scroll → length. Between checkpoints the pen speeds up, and it settles
        // into each one, so every card gets a moment of calm to be read.
        const lengthAt = (u: number) => {
          const r = route as Route;
          const Wt = r.Wc[r.n - 1];
          const bounds = [0, ...r.nodes.map((nd) => nd.w), Wt];
          const w = clamp01(u) * Wt;
          let k = 0;
          while (k < bounds.length - 2 && w > bounds[k + 1]) k++;
          const span = Math.max(1e-6, bounds[k + 1] - bounds[k]);
          const t = (w - bounds[k]) / span;
          const eased = t - (SETTLE * Math.sin(2 * Math.PI * t)) / (2 * Math.PI);
          const target = bounds[k] + eased * span;
          let lo = 0;
          let hi = r.n - 1;
          while (hi - lo > 1) {
            const m = (lo + hi) >> 1;
            if (r.Wc[m] < target) lo = m;
            else hi = m;
          }
          const f = (target - r.Wc[lo]) / Math.max(1e-6, r.Wc[hi] - r.Wc[lo]);
          return (lo + clamp01(f)) * STEP;
        };

        // ── Cameras ──
        const travelCam = (len: number): Cam => {
          const r = route as Route;
          // Averaging a window just ahead of the pen damps the loops and turns,
          // so the view glides round them instead of spinning with the stroke.
          let sx = 0;
          let sy = 0;
          const offs = [-110, -40, 30, 100, 170, 240];
          for (const o of offs) {
            const p = at(len + o);
            sx += p.x;
            sy += p.y;
          }
          const cx = sx / offs.length;
          let cy = sy / offs.length;
          // Nearing a checkpoint, lean towards the side its card opens on and
          // push in a touch, so node and card frame together.
          let best = 0;
          let side = 0;
          for (const nd of r.nodes) {
            const c = Math.exp(-(((len - nd.len) / (r.hump * 0.42)) ** 2));
            if (c > best) {
              best = c;
              side = nd.side;
            }
          }
          cy += side * (cardH + CARD_GAP) * 0.32 * best;
          return { x: cx, y: cy, z: 1 + 0.06 * best, fx: vw / 2, fy: nav + (vh - nav) / 2 };
        };

        const overviewCam = (top: number, bottom: number): Cam => {
          const { box } = route as Route;
          // Padding in screen px, so the map labels and pins always fit
          const pad = 44;
          const z = Math.min((vw * 0.92 - pad * 2) / (box.x1 - box.x0), (bottom - top - pad * 2) / (box.y1 - box.y0));
          return { x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2, z, fx: vw / 2, fy: (top + bottom) / 2 };
        };

        const mix = (a: Cam, b: Cam, t: number): Cam => ({
          x: lerp(a.x, b.x, t),
          y: lerp(a.y, b.y, t),
          // Zoom interpolates geometrically, which reads as a steady dolly
          z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t)),
          fx: lerp(a.fx, b.fx, t),
          fy: lerp(a.fy, b.fy, t),
        });

        const render = () => {
          if (!route) return;
          const r = route;
          const p = clamp01(progress);

          let cam: Cam;
          let len: number;
          let phase: string;
          let finale = false;
          if (p < pDive) {
            const e = easeInOut(p / pDive);
            cam = mix(overviewCam(nav + 16, vh - 96), travelCam(0), e);
            len = 0;
            phase = p < 0.004 ? "idle" : "intro";
          } else if (p <= pDraw) {
            len = lengthAt((p - pDive) / (pDraw - pDive));
            cam = travelCam(len);
            phase = "draw";
          } else {
            const t = (p - pDraw) / (1 - pDraw);
            cam = mix(travelCam(r.L), overviewCam(nav + 24, vh * 0.6), easeInOut(Math.min(1, t * 1.25)));
            len = r.L;
            phase = "outro";
            finale = t > 0.6;
          }

          const { z, fx, fy } = cam;
          const vx = cam.x - fx / z;
          const vy = cam.y - fy / z;
          svg.setAttribute("viewBox", `${f1(vx)} ${f1(vy)} ${f1(vw / z)} ${f1(vh / z)}`);
          const sx = (wx: number) => (wx - vx) * z;
          const sy = (wy: number) => (wy - vy) * z;

          // Strokes thin out as the camera pulls back, but never to a hairline
          const zq = Math.round(z * 200) / 200;
          if (zq !== lastStroke) {
            lastStroke = zq;
            const k = Math.pow(zq, -0.55);
            line.style.strokeWidth = f1(3.6 * k);
            glow.style.strokeWidth = f1(18 * k);
            ghost.style.strokeWidth = f1(2.4 / zq);
            ghost.style.strokeDasharray = `0.1 ${f1(9 / zq)}`;
            grid.style.opacity = String(clamp01((zq - 0.32) / 0.5).toFixed(2));
          }

          const offset = f1(r.L - len);
          line.style.strokeDashoffset = offset;
          glow.style.strokeDashoffset = offset;
          const drawn = len > 0.5;
          line.style.opacity = drawn ? "1" : "0";
          glow.style.opacity = drawn ? "0.2" : "0";

          const tp = at(len);
          tip.style.transform = `translate3d(${f1(sx(tp.x))}px, ${f1(sy(tp.y))}px, 0)`;
          startPin.style.transform = `translate3d(${f1(sx(r.start.x))}px, ${f1(sy(r.start.y))}px, 0)`;
          endPin.style.transform = `translate3d(${f1(sx(r.end.x))}px, ${f1(sy(r.end.y))}px, 0)`;

          // Overview factor: labels on the map fade in as the camera pulls back
          const ov = Math.round(clamp01((0.72 - z) / 0.28) * 100) / 100;
          if (ov !== lastOv) {
            lastOv = ov;
            view.style.setProperty("--prc-ov", String(ov));
          }

          const lead = r.hump * 0.4;
          const leave = r.hump * 0.62;
          let current = -1;
          for (let i = 0; i < r.nodes.length; i++) {
            const nd = r.nodes[i];
            const nx = sx(nd.x);
            const ny = sy(nd.y);
            steps[i].style.transform = `translate3d(${f1(nx)}px, ${f1(ny)}px, 0)`;

            const isReached = len >= nd.len - 1;
            if (isReached) current = i;
            if (isReached !== reached[i]) {
              reached[i] = isReached;
              steps[i].dataset.reached = String(isReached);
            }
            const isShown = phase === "draw" && len >= nd.len - lead && len < nd.len + leave;
            if (isShown !== shown[i]) {
              shown[i] = isShown;
              steps[i].dataset.show = String(isShown);
            }
            if (isShown) {
              // Centre the card on its node, but keep it inside the viewport
              const left = Math.min(Math.max(nx - cardW / 2, 16), vw - 16 - cardW);
              steps[i].style.setProperty("--prc-dx", `${f1(left - nx)}px`);
            }
          }

          const hud = phase === "draw" ? current : -2;
          if (hud !== lastHud) {
            lastHud = hud;
            const ph = PHASES[Math.max(0, current)];
            hudLabel.textContent =
              current < 0 ? "Departing · Your idea" : `${ph.index} / ${String(PHASES.length).padStart(2, "0")} · ${ph.phase}`;
          }
          hudBar.style.transform = `scaleX(${(len / r.L).toFixed(4)})`;

          if (phase !== lastPhase) {
            lastPhase = phase;
            section.dataset.phase = phase;
          }
          const started = String(len > 0.5);
          if (section.dataset.started !== started) section.dataset.started = started;
          const done = String(len >= r.L - 1);
          if (section.dataset.done !== done) section.dataset.done = done;
          const fin = String(finale);
          if (section.dataset.finale !== fin) section.dataset.finale = fin;
        };

        build();

        gsap.from(section.querySelectorAll("[data-prc-fade]"), {
          y: 32,
          opacity: 0,
          duration: 0.95,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 78%", once: true },
        });

        const state = { p: 0 };
        gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate() {
            progress = state.p;
            render();
          },
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        });

        // Viewport size, fonts settling into the cards: rebuild the road, then
        // re-measure every trigger on the page, since the track height moved.
        let timer = 0;
        let sig = `${vw}|${vh}|${cardW}|${cardH}`;
        const ro = new ResizeObserver(() => {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            const next = `${view.clientWidth}|${view.clientHeight}|${cards[0].offsetWidth}|${Math.max(...cards.map((c) => c.offsetHeight))}`;
            if (next === sig) return;
            sig = next;
            build();
            ScrollTrigger.refresh();
          }, 150);
        });
        ro.observe(view);
        cards.forEach((c) => ro.observe(c));

        return () => {
          ro.disconnect();
          window.clearTimeout(timer);
          section.classList.remove("prc-armed");
          track.style.height = "";
          for (const k of ["phase", "started", "done", "finale"]) delete section.dataset[k];
          steps.forEach((s) => {
            s.style.transform = "";
            s.style.removeProperty("--prc-dx");
            delete s.dataset.show;
            delete s.dataset.reached;
          });
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    transitionTo("/contact", e.currentTarget, "#3BA7F2", "CONTACT");
  };

  return (
    <section
      ref={sectionRef}
      id="process"
      aria-labelledby="process-title"
      className="prc-section relative w-full bg-[#072A5E] text-[#E8F6FF]"
    >
      <div aria-hidden="true" className="prc-bg" />
      <span ref={probeRef} aria-hidden="true" className="prc-probe" />

      {/* ── Header ── */}
      <header className="prc-head">
        <div data-prc-fade className="flex items-center gap-3 mb-4 sm:mb-5">
          <span className="w-8 h-[1px] bg-[#3BA7F2]" />
          <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#3BA7F2] font-bold">
            Process // How I work
          </span>
        </div>

        <div className="prc-head__row">
          <HeadingReveal
            as="h2"
            id="process-title"
            className="prc-title font-sans font-black uppercase tracking-tighter leading-none text-[#E8F6FF]"
          >
            {["From idea to launch", <span key="dot" style={{ color: "#7FE7D6" }}>.</span>]}
          </HeadingReveal>
          <p data-prc-fade className="prc-head__intro">
            One clear road from the first call to long after go-live. Seven
            checkpoints, no guesswork — scroll to walk it.
          </p>
        </div>
      </header>

      {/* ── Track: its height is the scroll the journey takes; the view sticks inside it ── */}
      <div ref={trackRef} className="prc-track">
        <div ref={viewRef} className="prc-view">
          <svg ref={svgRef} aria-hidden="true" className="prc-svg" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient ref={gradRef} id={gradId} gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#3BA7F2" />
                <stop offset="0.55" stopColor="#5FC7E4" />
                <stop offset="1" stopColor="#7FE7D6" />
              </linearGradient>
              <pattern id={dotsId} width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.3" fill="rgba(232,246,255,0.12)" />
              </pattern>
            </defs>
            {/* The ground the camera flies over: it zooms with the road */}
            <rect ref={gridRef} className="prc-grid" fill={`url(#${dotsId})`} />
            <path ref={ghostRef} className="prc-ghost" />
            <path ref={glowRef} className="prc-glow" stroke={`url(#${gradId})`} />
            <path ref={lineRef} className="prc-line" stroke={`url(#${gradId})`} />
          </svg>

          <div ref={startRef} aria-hidden="true" className="prc-pin prc-pin--start">
            <span className="prc-dot prc-dot--start" />
            <span className="prc-sticker">Start · Your idea</span>
          </div>
          <div ref={endRef} aria-hidden="true" className="prc-pin prc-pin--end">
            <span className="prc-dot prc-dot--end" />
            <span className="prc-sticker prc-sticker--end">Live · And growing</span>
          </div>

          <ol className="prc-steps">
            {PHASES.map((p, i) => (
              <li
                key={p.index}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="prc-step"
                data-side={i % 2 === 0 ? "up" : "down"}
              >
                <span aria-hidden="true" className="prc-node" />
                <span aria-hidden="true" className="prc-link" />
                <span aria-hidden="true" className="prc-label">
                  <b>{p.index}</b>
                  <span>{p.phase}</span>
                </span>

                <article
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="prc-card"
                  aria-labelledby={`process-step-${p.index}`}
                >
                  <span aria-hidden="true" className="prc-card__ghost">
                    {p.index}
                  </span>
                  <div className="prc-card__top">
                    <span className="prc-card__bar" />
                    <span>
                      Phase {p.index} — {p.phase}
                    </span>
                  </div>
                  <h3 id={`process-step-${p.index}`} className="prc-card__title">
                    {p.title}
                  </h3>
                  <p className="prc-card__body">{p.body}</p>
                  <ul className="prc-card__chips" aria-label="Deliverables">
                    {p.deliverables.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>

          <div ref={tipRef} aria-hidden="true" className="prc-tip" />

          <div aria-hidden="true" className="prc-hint">
            <span>Scroll to start the journey</span>
            <span className="prc-hint__line" />
          </div>

          <div aria-hidden="true" className="prc-hud">
            <span ref={hudLabelRef} className="prc-hud__label">
              Departing · Your idea
            </span>
            <span className="prc-hud__track">
              <span ref={hudBarRef} className="prc-hud__bar" />
            </span>
          </div>

          <div className="prc-finale">
            <p className="prc-finale__title">
              Your project could be next<span style={{ color: "#7FE7D6" }}>.</span>
            </p>
            <p className="prc-finale__text">
              Every project I take on travels this road. Tell me where yours
              starts and I&apos;ll map the rest.
            </p>
            <ButtonWithIcon onClick={handleStart}>Start your project</ButtonWithIcon>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProcessSection;
