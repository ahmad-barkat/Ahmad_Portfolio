"use client";

import { useEffect, useRef, useState } from "react";

/* The ink drop: the site's cursor on mouse and trackpad screens.

   One filled drop in the site's colour that glides after the pointer and,
   like liquid, stretches along its path when moving fast (the trace) and
   rounds up again when it rests. Two plain elements moved only by
   transform, so the browser's compositor does the drawing: nothing is
   repainted per frame. Time-based easing keeps the feel the same on 60Hz
   and 144Hz screens. What is under the pointer changes its shape:

     text fields, iframes        hidden; the system cursor comes back
     [data-cursor="view"]        a bubble with a label (data-cursor-label)
                                 in a colour (data-cursor-color)
     [data-magnetic]             the element leans towards the pointer and
                                 the drop wraps it as a hairline outline,
                                 in its shape; springs back on leave
     links and buttons           the drop opens into a soft ring
     [data-cursor="minimal"]     a small dot (sections that already have
                                 their own pointer effect)

   Sky on dark backgrounds, ice on the bright blues, royal on light ones. A
   click squeezes the drop and sends one mint ring out. Off on touch screens
   and with reduced motion; the loop sleeps whenever nothing moves. */

const R = 14; // the drop's diameter at rest
const FOLLOW = 30; // how fast the drop catches the pointer (per second)
const MORPH = 18; // how fast it changes size and shape
const STRETCH_MAX = 0.5;
const PULL = 0.3; // magnetic pull, as a share of the pointer's offset
const PULL_MAX = 14; // ...capped, in px, so targets never feel unstable
const PAD = 7; // the outline's gap around a magnetic element

const TEXTISH =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select, [contenteditable="true"], iframe';
const INTERACTIVE = 'a[href], button, [role="button"], label[for], summary, input[type="checkbox"], input[type="radio"]';

type Mode = "default" | "link" | "magnet" | "view" | "minimal" | "hidden";
type Tone = "dark" | "mid" | "light";
type Spring = { x: number; y: number; vx: number; vy: number };

const INK: Record<Tone, string> = {
  dark: "59, 167, 242", // sky
  mid: "232, 246, 255", // ice, on the bright blues where sky would vanish
  light: "11, 61, 145", // royal
};

/** How bright the first solid background under an element is */
const tones = new WeakMap<Element, Tone>();
function toneOf(el: Element | null): Tone {
  if (!el) return "dark";
  const known = tones.get(el);
  if (known) return known;
  let tone: Tone = "dark";
  let n: Element | null = el;
  while (n && n !== document.documentElement) {
    const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
    n = n.parentElement;
    if (!m || (m.length > 3 && Number(m[3]) < 0.6)) continue;
    const [r, g, b] = m.map(Number);
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    tone = l > 0.62 ? "light" : l > 0.45 ? "mid" : "dark";
    break;
  }
  tones.set(el, tone);
  return tone;
}

export default function LiquidCursor() {
  const [on, setOn] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Only where there is a real pointer, and only for those who want motion
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const check = () => setOn(fine.matches && !calm.matches);
    check();
    fine.addEventListener("change", check);
    calm.addEventListener("change", check);
    return () => {
      fine.removeEventListener("change", check);
      calm.removeEventListener("change", check);
    };
  }, []);

  useEffect(() => {
    const box = rootRef.current;
    if (!on || !box) return;
    const blob = box.querySelector<HTMLElement>(".lc__blob")!;
    const text = box.querySelector<HTMLElement>(".lc__label")!;
    const ring = box.querySelector<HTMLElement>(".lc__ring")!;
    const root = document.documentElement;
    root.classList.add("lc-on");

    const ptr = { x: -100, y: -100, seen: false, moved: 0 };
    const pos = { x: -100, y: -100 }; // the drop's centre
    const shape = { w: R, h: R, r: R / 2, alpha: 0, stretch: 0, angle: 0, squish: 1 };
    const springs = new Map<HTMLElement, Spring>();
    let mode: Mode = "default";
    let tone: Tone = "dark";
    let under: Element | null = null;
    let magnet: HTMLElement | null = null;
    let magnetRadius = 0;
    let view: HTMLElement | null = null;
    let last = 0;
    let raf = 0;
    let awake = false;
    let painted = "";

    // Colours and the label change only when the mode or background does:
    // CSS eases them, the loop never touches them
    const paint = () => {
      const ink = INK[tone];
      const key = `${mode}|${tone}|${view?.dataset.cursorColor ?? ""}|${view?.dataset.cursorLabel ?? ""}`;
      if (key === painted) return;
      painted = key;
      box.dataset.mode = mode;
      let fill = `rgb(${ink})`;
      let line = `rgba(${ink}, 0)`;
      if (mode === "link") {
        fill = `rgba(${ink}, 0.14)`;
        line = `rgba(${ink}, 0.6)`;
      } else if (mode === "magnet") {
        fill = `rgba(${ink}, 0)`;
        line = `rgba(${ink}, 0.8)`;
      } else if (mode === "view") {
        fill = view?.dataset.cursorColor ?? "#3BA7F2";
        text.textContent = `${(view?.dataset.cursorLabel ?? "View").toUpperCase()} ↗`;
      }
      blob.style.backgroundColor = fill;
      blob.style.borderColor = line;
    };

    // Reads what is under the pointer and picks the drop's shape
    const sense = (el: Element | null) => {
      under = el;
      tone = toneOf(el);
      magnet = null;
      view = null;
      if (!el) mode = "default";
      else if (el.closest(TEXTISH)) mode = "hidden";
      else if ((view = el.closest<HTMLElement>('[data-cursor="view"]'))) mode = "view";
      else if ((magnet = el.closest<HTMLElement>("[data-magnetic]"))) {
        mode = "magnet";
        // The outline sits around the element, on what is behind it
        tone = toneOf(magnet.parentElement);
        if (!springs.has(magnet)) springs.set(magnet, { x: 0, y: 0, vx: 0, vy: 0 });
        const br = getComputedStyle(magnet).borderTopLeftRadius;
        magnetRadius = br.endsWith("%") ? Infinity : parseFloat(br) || 0;
      } else if (el.closest(INTERACTIVE)) mode = "link";
      else mode = el.closest('[data-cursor="minimal"]') ? "minimal" : "default";
      paint();
    };

    const wake = () => {
      if (awake) return;
      awake = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const ease = (rate: number) => 1 - Math.exp(-rate * dt);

      // Magnets: the hovered one leans towards the pointer; the rest spring home
      let busy = false;
      let mRect: DOMRect | null = null;
      springs.forEach((s, el) => {
        if (el === magnet) {
          const r = el.getBoundingClientRect();
          mRect = r;
          const cx = r.left + r.width / 2 - s.x;
          const cy = r.top + r.height / 2 - s.y;
          const cap = Math.min(PULL_MAX, Math.max(r.width, r.height) * 0.3);
          const tx = Math.max(-cap, Math.min(cap, (ptr.x - cx) * PULL));
          const ty = Math.max(-cap, Math.min(cap, (ptr.y - cy) * PULL));
          s.vx = 0;
          s.vy = 0;
          const dx = tx - s.x;
          const dy = ty - s.y;
          const k = ease(14);
          s.x += dx * k;
          s.y += dy * k;
          el.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`;
          if (Math.abs(dx) + Math.abs(dy) > 0.05) busy = true;
          return;
        }
        // A little overshoot on the way back
        const f = dt * 60;
        s.vx = (s.vx - s.x * 0.14 * f) * Math.pow(0.74, f);
        s.vy = (s.vy - s.y * 0.14 * f) * Math.pow(0.74, f);
        s.x += s.vx * f;
        s.y += s.vy * f;
        if (Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.vx) + Math.abs(s.vy) < 0.05) {
          el.style.translate = "";
          springs.delete(el);
          return;
        }
        el.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`;
        busy = true;
      });

      // Where the drop heads, and the size and shape it takes there
      let tx = ptr.x;
      let ty = ptr.y;
      let tw = R;
      let th = R;
      let tr = R / 2;
      const m = mRect as DOMRect | null;
      if (m) {
        tx = m.left + m.width / 2;
        ty = m.top + m.height / 2;
        tw = m.width + PAD * 2;
        th = m.height + PAD * 2;
        tr = Math.min(magnetRadius + PAD, Math.min(tw, th) / 2);
      } else if (mode === "link") tw = th = tr = 52;
      else if (mode === "view") tw = th = tr = 88;
      else if (mode === "minimal") tw = th = tr = 8;
      if (tw === th) tr = tw / 2;

      const px = pos.x;
      const py = pos.y;
      const kf = ease(m ? 22 : FOLLOW);
      pos.x += (tx - pos.x) * kf;
      pos.y += (ty - pos.y) * kf;

      // The trace: the faster the drop moves, the longer it draws out
      // along its path; only the plain drop and the dot stretch
      const vx = (pos.x - px) / dt;
      const vy = (pos.y - py) / dt;
      const speed = Math.hypot(vx, vy);
      const liquid = mode === "default" || mode === "minimal";
      const goal = liquid ? Math.min(STRETCH_MAX, speed / 2600) : 0;
      shape.stretch += (goal - shape.stretch) * ease(goal > shape.stretch ? 20 : 10);
      if (liquid && speed > 40) {
        // Turn the short way round
        let d = Math.atan2(vy, vx) - shape.angle;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        shape.angle += d * ease(24);
      } else if (!liquid) {
        // Square up for outlines: the nearest half turn looks the same
        shape.angle += (Math.round(shape.angle / Math.PI) * Math.PI - shape.angle) * ease(20);
      }

      const km = ease(MORPH);
      shape.w += (tw - shape.w) * km;
      shape.h += (th - shape.h) * km;
      shape.r += (tr - shape.r) * km;
      shape.squish += (1 - shape.squish) * ease(12);
      const wantAlpha = ptr.seen && mode !== "hidden" ? 1 : 0;
      shape.alpha += (wantAlpha - shape.alpha) * ease(14);

      const s = shape.stretch;
      const sx = (1 + s) * shape.squish;
      const sy = (1 - s * 0.45) * shape.squish;
      blob.style.width = `${shape.w.toFixed(2)}px`;
      blob.style.height = `${shape.h.toFixed(2)}px`;
      blob.style.borderRadius = `${shape.r.toFixed(2)}px`;
      blob.style.opacity = shape.alpha.toFixed(3);
      blob.style.transform =
        `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0) rotate(${shape.angle.toFixed(4)}rad) ` +
        `scale(${sx.toFixed(4)}, ${sy.toFixed(4)}) translate(-50%, -50%)`;
      if (mode === "view" || text.style.opacity !== "0") {
        text.style.transform = `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
        // The label shows once the bubble is big enough to hold it
        text.style.opacity = mode === "view" ? Math.min(shape.alpha, Math.max(0, (shape.w - 56) / 28)).toFixed(3) : "0";
      }

      // Sleep once everything has come to rest
      const settled =
        !busy &&
        Math.abs(tx - pos.x) + Math.abs(ty - pos.y) < 0.1 &&
        Math.abs(tw - shape.w) + Math.abs(th - shape.h) + Math.abs(tr - shape.r) < 0.1 &&
        shape.stretch < 0.002 &&
        (liquid || Math.abs(Math.round(shape.angle / Math.PI) * Math.PI - shape.angle) < 0.002) &&
        Math.abs(shape.squish - 1) < 0.002 &&
        Math.abs(wantAlpha - shape.alpha) < 0.005;
      if (settled) {
        awake = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.moved = performance.now();
      if (!ptr.seen) {
        // Appear under the pointer rather than sweeping in from a corner
        ptr.seen = true;
        pos.x = ptr.x;
        pos.y = ptr.y;
      }
      // The event already knows what is under the pointer: no hit test needed
      if (e.target !== under) sense(e.target instanceof Element ? e.target : null);
      wake();
    };
    const onDown = (e: PointerEvent) => {
      // A touch on a hybrid screen: step aside until the mouse is back
      if (e.pointerType === "touch") {
        ptr.seen = false;
        wake();
        return;
      }
      shape.squish = 0.78;
      ring.style.borderColor = tone === "light" ? "#0B3D91" : "#7FE7D6";
      ring.animate(
        [
          { transform: `translate3d(${ptr.x}px, ${ptr.y}px, 0) translate(-50%, -50%) scale(0.2)`, opacity: 0.9 },
          { opacity: 0.55, offset: 0.45 },
          { transform: `translate3d(${ptr.x}px, ${ptr.y}px, 0) translate(-50%, -50%) scale(1)`, opacity: 0 },
        ],
        { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      wake();
    };
    // Off the page, or into an iframe (which keeps its own cursor)
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      ptr.seen = false;
      wake();
    };
    // Content scrolls under a still pointer: look again, a few times a second
    let scrollTimer = 0;
    const onScroll = () => {
      if (!ptr.seen || scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = 0;
        sense(document.elementFromPoint(ptr.x, ptr.y));
        wake();
      }, 120);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("mouseout", onOut);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(scrollTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("scroll", onScroll);
      springs.forEach((_, el) => (el.style.translate = ""));
      root.classList.remove("lc-on");
    };
  }, [on]);

  if (!on) return null;
  return (
    <div ref={rootRef} className="lc" data-mode="default" aria-hidden="true">
      <div className="lc__ring" />
      <div className="lc__blob" />
      <span className="lc__label" style={{ opacity: 0 }} />
    </div>
  );
}
