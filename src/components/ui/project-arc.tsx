"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PROJECTS } from "@/data/projects";

/** Small 16:10 crops of each cover (480x300), made for this reel */
const thumbOf = (cover: string) => cover.replace("/projects/", "/projects/thumbs/");

/* The reel rides a U: it comes in raised on the left, dips through the
   middle behind the figure, and climbs out on the right, a touch higher.
   Each card leans with the curve, turns a little in perspective (facing in
   towards the figure) and carries its own fixed tilt, and cards are larger
   out at the ends than down in the dip, so the line reads as a ribbon in
   space rather than a flat arc. */
const SPEED = 40; // px per second along the curve
const LEAN = 0.85; // share of the curve's slope a card leans by
const TURN = 18; // degrees a card at the screen edge turns to face the middle
const JITTER = 6; // each card's own extra tilt, degrees (fixed per card)
const DEPTH = 0.18; // how much larger a card is at the ends than in the dip
/** Clear space kept between any card and the box the reel steers around, px */
const CLEARANCE = 18;
const LUT_STEPS = 480;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Reel {
  w: number;
  card: number;
  count: number;
  length: number;
  /** Points along the curve at equal distances: x, y, slope (deg) */
  lut: Float32Array;
}

const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));
const rad = (d: number) => (d * Math.PI) / 180;
const SVG_NS = "http://www.w3.org/2000/svg";

/** Samples a path into equal steps along its length, with the slope at each */
function sample(d: string) {
  const el = document.createElementNS(SVG_NS, "path");
  el.setAttribute("d", d);
  const length = el.getTotalLength();
  const lut = new Float32Array((LUT_STEPS + 1) * 3);
  for (let i = 0; i <= LUT_STEPS; i++) {
    const p = el.getPointAtLength((length * i) / LUT_STEPS);
    lut[i * 3] = p.x;
    lut[i * 3 + 1] = p.y;
  }
  for (let i = 0; i <= LUT_STEPS; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(LUT_STEPS, i + 1);
    lut[i * 3 + 2] = (Math.atan2(lut[b * 3 + 1] - lut[a * 3 + 1], lut[b * 3] - lut[a * 3]) * 180) / Math.PI;
  }
  return { length, lut };
}

/** Where along the curve, and how a card sits there */
function place(reel: Reel, s: number) {
  const f = ((((s % reel.length) + reel.length) % reel.length) / reel.length) * LUT_STEPS;
  const i = Math.min(LUT_STEPS - 1, Math.floor(f));
  const t = f - i;
  const L = reel.lut;
  const x = L[i * 3] + (L[i * 3 + 3] - L[i * 3]) * t;
  const y = L[i * 3 + 1] + (L[i * 3 + 4] - L[i * 3 + 1]) * t;
  const slope = L[i * 3 + 2] + (L[i * 3 + 5] - L[i * 3 + 2]) * t;
  const off = clamp(-1, (x - reel.w / 2) / (reel.w / 2), 1); // -1 left edge, 1 right edge
  return { x, y, slope, scale: 1 - DEPTH + DEPTH * Math.abs(off), turn: -off * TURN };
}

/** Does any card on the curve come within CLEARANCE of `box`? */
function hits(reel: Reel, box: Box) {
  const ch = reel.card * 0.625;
  for (let s = 0; s < reel.length; s += 12) {
    const p = place(reel, s);
    const a = rad(p.slope * LEAN);
    const cos = Math.abs(Math.cos(a));
    const sin = Math.abs(Math.sin(a));
    const hx = ((reel.card / 2) * cos + (ch / 2) * sin) * p.scale + CLEARANCE;
    const hy = ((reel.card / 2) * sin + (ch / 2) * cos) * p.scale + CLEARANCE;
    if (p.x + hx > box.left && p.x - hx < box.right && p.y + hy > box.top && p.y - hy < box.bottom) return true;
  }
  return false;
}

function finish(w: number, card: number, d: string): Reel {
  const { length, lut } = sample(d);
  let count = Math.max(PROJECTS.length, Math.floor(length / (card * 1.16)));
  // The last card meets the first at the wrap: never the same project twice
  if (count % PROJECTS.length === 1) count -= 1;
  return { w, card, count, length, lut };
}

/**
 * Builds the U for the box it fills, clear of `avoid` (the AHMAD wordmark).
 * Desktop: the ends sit level with the wordmark, beside it, and the dip runs
 * beneath it (behind the figure). Where the wordmark spans the screen
 * (phones, portrait tablets) the whole U rides above it, beside the face.
 */
function buildReel(w: number, h: number, avoid: Box | null): Reel {
  const phone = w < 768;
  const card = phone ? clamp(88, w * 0.24, 130) : clamp(140, w * 0.12, 230);
  const ch = card * 0.625;
  const out = card * 0.8 + 24; // far enough off screen that the wrap is never seen
  const x0 = -out;
  const x1 = w + out;
  const f = (n: number) => n.toFixed(1);

  if (!avoid) {
    return finish(
      w,
      card,
      `M ${f(x0)} ${f(h * 0.48)} C ${f(w * 0.25)} ${f(h * 0.5)} ${f(w * 0.3)} ${f(h * 0.78)} ${f(w * 0.5)} ${f(h * 0.78)} S ${f(w * 0.78)} ${f(h * 0.44)} ${f(x1)} ${f(h * 0.42)}`,
    );
  }

  const B = avoid;
  const bw = B.right - B.left;

  if (bw > w * 0.8) {
    // Above a full-width wordmark: a shallow U, lifted until it clears
    let lift = 0;
    let reel: Reel;
    do {
      const low = B.top - CLEARANCE - ch * 0.6 - lift;
      const yL = low - ch * 1.1;
      const yR = yL - ch * 0.35;
      reel = finish(
        w,
        card,
        `M ${f(x0)} ${f(yL)} C ${f(w * 0.28)} ${f(yL)} ${f(w * 0.3)} ${f(low)} ${f(w * 0.5)} ${f(low)} S ${f(w * 0.74)} ${f(yR)} ${f(x1)} ${f(yR)}`,
      );
      lift += 6;
    } while (lift < h * 0.3 && hits(reel, B));
    return reel;
  }

  // Beside and beneath a wordmark that sits in a band: the ends run level
  // with it out at the screen edges, then dive just before its letters and
  // run beneath it, hidden behind the figure
  const low = B.bottom + CLEARANCE + ch * 0.6;
  const yL = B.top + (B.bottom - B.top) * 0.3;
  const yR = yL - ch * 0.3;
  let pull = 0; // how far out from the wordmark the dive starts
  let drop = 0; // last resort: lower the ends a little
  let reel: Reel;
  for (let n = 0; ; n++) {
    const sl = B.left - card * 1.15 - pull; // dive starts here...
    const sr = B.right + card * 1.15 + pull;
    const el = B.left - card * 0.1 - pull * 0.5; // ...and bottoms out here
    const er = B.right + card * 0.1 + pull * 0.5;
    reel = finish(
      w,
      card,
      `M ${f(x0)} ${f(yL + drop)} L ${f(Math.max(x0 + 1, sl))} ${f(yL + drop)}` +
        ` C ${f(sl + (el - sl) * 0.6)} ${f(yL + drop)} ${f(sl + (el - sl) * 0.4)} ${f(low)} ${f(el)} ${f(low)}` +
        ` L ${f(er)} ${f(low)}` +
        ` C ${f(sr - (sr - er) * 0.4)} ${f(low)} ${f(sr - (sr - er) * 0.6)} ${f(yR + drop)} ${f(Math.min(x1 - 1, sr))} ${f(yR + drop)}` +
        ` L ${f(x1)} ${f(yR + drop)}`,
    );
    if (n > 60 || !hits(reel, B)) break;
    if (pull < card * 0.6) pull += 8;
    else if (drop < ch * 1.2) drop += 6;
    else break;
  }
  return reel;
}

/**
 * The hero's reel of project cards on its U behind the portrait. One rAF
 * loop moves every card along the curve and writes its transform; it runs
 * only while the hero is on screen. `avoid` is a selector, looked up beside
 * the reel, for an element the cards must never cross (the AHMAD wordmark).
 * Decorative: the work itself is listed, with links, further down the page.
 */
export function ProjectArc({ className = "", avoid }: { className?: string; avoid?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [reel, setReel] = useState<Reel | null>(null);

  // Measure, and re-measure with the screen and when the wordmark's font lands
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const other = avoid ? root.parentElement?.querySelector<HTMLElement>(avoid) ?? null : null;
    let key = "";
    const measure = () => {
      // Layout size, and the parent as the origin: the reel's own entrance
      // moves it, and that must not shift where the wordmark seems to be
      const w = root.offsetWidth;
      const h = root.offsetHeight;
      if (!w || !h) return;
      let box: Box | null = null;
      const r = root.parentElement?.getBoundingClientRect();
      if (other && r) {
        const o = other.getBoundingClientRect();
        if (o.width && o.height) {
          box = { left: o.left - r.left, top: o.top - r.top, right: o.right - r.left, bottom: o.bottom - r.top };
        }
      }
      const next = [w, h, box?.left, box?.top, box?.right, box?.bottom].map((n) => Math.round(n ?? 0)).join(",");
      if (next === key) return;
      key = next;
      setReel(buildReel(w, h, box));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    if (other) ro.observe(other);
    return () => ro.disconnect();
  }, [avoid]);

  // Run the cards along the curve
  useEffect(() => {
    const root = rootRef.current;
    if (!reel || !root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tilt = Array.from({ length: reel.count }, (_, i) => Math.sin(i * 12.9898 + 1.3) * JITTER);
    const gap = reel.length / reel.count;
    let offset = 0;
    let raf = 0;
    let last = 0;

    const draw = () => {
      for (let i = 0; i < reel.count; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const p = place(reel, offset + i * gap);
        el.style.transform =
          `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${p.scale.toFixed(3)})` +
          ` rotateZ(${(p.slope * LEAN + tilt[i]).toFixed(2)}deg) perspective(900px) rotateY(${p.turn.toFixed(2)}deg)`;
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      offset = (offset + SPEED * dt) % reel.length;
      draw();
    };

    draw();
    if (reduce) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!e.isIntersecting && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reel]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`pa ${className}`.trim()}
      style={reel ? ({ "--pa-w": `${Math.round(reel.card)}px` } as CSSProperties) : undefined}
    >
      {reel &&
        Array.from({ length: reel.count }, (_, i) => {
          const p = PROJECTS[i % PROJECTS.length];
          return (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="pa-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbOf(p.cover)} alt="" width={480} height={300} decoding="async" fetchPriority="low" draggable={false} />
            </div>
          );
        })}
    </div>
  );
}

export default ProjectArc;
