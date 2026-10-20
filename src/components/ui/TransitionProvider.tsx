"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLenis } from "./LenisProvider";
import { gsap } from "gsap";
import { TRANSITION_DONE_EVENT } from "./use-activate";

/** Fired on window once the brush covers the whole screen. The menu closes
 *  under it, so it never shows itself leaving. */
export const TRANSITION_COVERED_EVENT = "app:transition-covered";

/** The brush colour: sky, on every route, so the move between pages is one gesture */
const BRUSH = "#3BA7F2";

// Timings from the reference (osmo "draw SVG" transition, 30fps): the stroke
// covers the screen in about 0.8s, holds for a frame, and is wiped away
// from its start in about 1s while the new page fades in under it
const DRAW_IN = 0.85;
const DRAW_OUT = 1.1;
/** The stroke comes in thin, swells to cover, and leaves thin, as in the video */
const WIDTH_IN = 0.2;
const WIDTH_OUT = 0.42;
/** How far into the wipe the new page may start its entrance */
const READY_AT = 0.32;

interface Brush {
  d: string;
  length: number;
  width: number;
  w: number;
  h: number;
}

interface TransitionState {
  active: boolean;
  /** True while the brush still hides the page (the entrance waits for it) */
  covering: boolean;
  brush: Brush | null;
  label: string;
  targetHref: string;
}

const IDLE: TransitionState = { active: false, covering: false, brush: null, label: "", targetHref: "" };

interface TransitionContextType {
  /** Draws the brush over the screen and opens `href` under it. Returns false
   *  when no cover plays (a link to the open page, reduced motion), so callers
   *  such as the menu close themselves. The element, colour and label are kept
   *  for the callers' sake; only the label is shown, if the page is slow. */
  transitionTo: (href: string, triggerElement: HTMLElement, color: string, label: string) => boolean;
  /** True while the brush is covering the screen. Pages use this to hold
   *  their entrance animation back until the new page can be seen. */
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function usePageTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("usePageTransition must be used within a TransitionProvider");
  }
  return context;
}

// The brush's shape, as fractions of the screen. Traced from the reference
// and tuned with a coverage check (.lh-tools/brush): at these values the
// full-width stroke leaves at most a sliver of a corner open on any screen
// from 360×640 to 2560×1080, and the cover fill closes that.
const SHAPE = {
  /** Where the stroke comes in: low on the left, then up and round */
  start: 2.3,
  turns: 2.37,
  /** First loop's half-size (it hugs the edges) and the last loop's */
  rx0: 0.569, ry0: 0.542,
  rx1: 0.269, ry1: 0.124,
  /** The spiral's centre sinks this far as it winds in, as in the video */
  drop: 0.108,
  /** The first loops are squarish (to reach the corners), the last round */
  round0: 0.49, round1: 0.76,
  /** Full stroke width, as a share of the screen's diagonal */
  width: 0.164,
  /** Portrait screens need a fuller brush: their loops are further apart */
  portrait: 0.6,
};

/**
 * The brush's path for a w × h screen, after the reference video: the
 * stroke runs in round the edges, winds inwards in rounder, smaller loops
 * to a knot just below the middle (a flat loop with a hole the full stroke
 * still covers), then leaves for the bottom right. Drawn, it covers the
 * screen; wiped from its start while it thins, it opens the knot's hole
 * first, unwinds from the outside in, and the tail sweeps away last.
 */
function brushPath(w: number, h: number): Brush {
  const S = SHAPE;
  const width = Math.round(S.width * Math.hypot(w, h) * (1 + S.portrait * Math.max(0, h / w - 1)));
  const ry1 = Math.min(S.ry1 * h, 0.42 * width);
  const sweep = S.turns * Math.PI * 2;
  // Coarse enough to redraw cheaply every frame; the round joins of a
  // stroke this wide hide the corners
  const steps = Math.ceil(sweep / 0.07);
  const pow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);

  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = S.start + t * sweep;
    // A superellipse: exponent ½ is a rounded square, 1 an ellipse
    const u = Math.min(1, Math.max(0, (t - S.round0) / (S.round1 - S.round0)));
    const e = 0.5 + 0.5 * u * u * (3 - 2 * u);
    const rx = w * (S.rx0 - (S.rx0 - S.rx1) * t);
    const ry = h * S.ry0 - (h * S.ry0 - ry1) * t;
    pts.push([w / 2 + rx * pow(Math.cos(a), e), h * (0.5 + S.drop * t) + ry * pow(Math.sin(a), e)]);
  }

  // The tail: on along the way it was going, turning a little further
  // clockwise, until it is off the screen
  const [ex, ey] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 4];
  const run = Math.hypot(ex - px, ey - py) || 1;
  const tx = (ex - px) / run;
  const ty = (ey - py) / run;
  const turn = 0.9;
  const ox = tx * Math.cos(turn) - ty * Math.sin(turn);
  const oy = tx * Math.sin(turn) + ty * Math.cos(turn);
  const reach = Math.hypot(w, h) * 0.9;
  const c1: [number, number] = [ex + tx * reach * 0.35, ey + ty * reach * 0.35];
  const end: [number, number] = [ex + ox * reach, ey + oy * reach];
  const c2: [number, number] = [end[0] - ox * reach * 0.4, end[1] - oy * reach * 0.4];
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const u = 1 - t;
    pts.push([
      u * u * u * ex + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * end[0],
      u * u * u * ey + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * end[1],
    ]);
  }

  let length = 0;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    d += `L${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
  }
  return { d, length: Math.ceil(length) + 2, width, w, h };
}

export default function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const prevPathname = useRef(pathname);

  const [state, setState] = useState<TransitionState>(IDLE);

  const pathRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGRectElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const isNavigating = useRef(false);
  const stuckTimer = useRef(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const transitionTo = (href: string, _triggerElement: HTMLElement, _color: string, label: string) => {
    if (isNavigating.current) return true;

    // A link to the page already open: the pathname would never change, so
    // the cover would never lift. Glide to the spot on this page instead.
    const url = new URL(href, window.location.href);
    const strip = (p: string) => p.replace(/\/+$/, "") || "/";
    if (url.origin === window.location.origin && strip(url.pathname) === strip(window.location.pathname)) {
      lenis?.start();
      const spot = url.hash ? document.querySelector<HTMLElement>(url.hash) : null;
      if (lenis) lenis.scrollTo(spot ?? 0, { duration: 1.2 });
      else (spot ?? document.documentElement).scrollIntoView({ behavior: "smooth" });
      return false;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return false;
    }

    isNavigating.current = true;
    // Section set-ups wait while this is on (use-activate.ts), so they never
    // stutter the brush
    document.documentElement.dataset.transition = "on";
    // Start fetching the page now, so it is ready when the cover is
    router.prefetch(href);
    lenis?.stop();

    setState({
      active: true,
      covering: true,
      brush: brushPath(window.innerWidth, window.innerHeight),
      label,
      targetHref: href,
    });
    return true;
  };

  // Draw: the brush runs in from off the left edge and winds inwards until
  // the screen is covered, then the router swaps pages under it
  useEffect(() => {
    const path = pathRef.current;
    const brush = state.brush;
    if (!state.active || !brush || !path || !labelRef.current || !fillRef.current) return;

    const label = labelRef.current;
    const fill = fillRef.current;
    const stroke = { offset: brush.length, width: brush.width * WIDTH_IN };
    const paint = () => {
      path.setAttribute("stroke-dashoffset", stroke.offset.toFixed(1));
      path.setAttribute("stroke-width", stroke.width.toFixed(1));
    };
    gsap.set(label, { autoAlpha: 0, y: 8 });
    gsap.set(fill, { opacity: 0 });
    paint();

    const href = state.targetHref;
    const tl = gsap.timeline({
      onComplete: () => {
        window.dispatchEvent(new Event(TRANSITION_COVERED_EVENT));
        router.push(href);
        // Only a slow page gets a word: where you are going
        gsap.to(label, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.35 });
        // Safety net: if the page has not arrived after a while (a failed
        // chunk, a lost connection), load it the plain way so the cover
        // never stays on screen
        stuckTimer.current = window.setTimeout(() => window.location.assign(href), 8000);
      },
    });
    tl.to(stroke, { offset: 0, duration: DRAW_IN, ease: "power2.inOut", onUpdate: paint }, 0);
    // Thin as it comes in, full by the time it reaches the middle
    tl.to(stroke, { width: brush.width, duration: DRAW_IN * 0.8, ease: "power2.inOut", onUpdate: paint }, 0);
    // The cover fill closes the last slivers as the stroke lands
    tl.to(fill, { opacity: 1, duration: 0.25, ease: "power1.in" }, DRAW_IN - 0.25);
    tlRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [state.active, state.brush, state.targetHref, router]);

  // Wipe: the new page is in. The brush is taken away from its start, so the
  // page shows from the outside in, and it thins as it goes, which opens its
  // middle too; the tail is the last to leave
  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;
    isNavigating.current = false;
    window.clearTimeout(stuckTimer.current);

    const path = pathRef.current;
    const brush = state.brush;
    if (!state.active || !brush || !path || !labelRef.current) return;

    const label = labelRef.current;
    let raf = 0;
    // Wait until the new page has painted and its first burst of set-up
    // work is over (two smooth frames in a row, or 450ms at most), so the
    // wipe does not share its first frames with it
    const begin = performance.now();
    let last = begin;
    let smooth = 0;
    const settle = (now: number) => {
      smooth = now - last < 24 ? smooth + 1 : 0;
      last = now;
      if (smooth < 2 && now - begin < 450) {
        raf = requestAnimationFrame(settle);
        return;
      }
      tlRef.current?.kill();
      const stroke = { offset: 0, width: brush.width };
      const paint = () => {
        path.setAttribute("stroke-dashoffset", stroke.offset.toFixed(1));
        path.setAttribute("stroke-width", stroke.width.toFixed(1));
      };
      const tl = gsap.timeline({
        onComplete: () => {
          setState(IDLE);
          lenis?.start();
          delete document.documentElement.dataset.transition;
          window.dispatchEvent(new Event(TRANSITION_DONE_EVENT));
        },
      });
      gsap.killTweensOf(label);
      tl.to(label, { autoAlpha: 0, duration: 0.2, ease: "power2.out" }, 0);
      tl.to(fillRef.current, { opacity: 0, duration: 0.1, ease: "none" }, 0);
      tl.to(stroke, { offset: -brush.length, duration: DRAW_OUT, ease: "power1.inOut", onUpdate: paint }, 0);
      // Thinning opens the knot's hole first, then the loops unwind
      tl.to(stroke, { width: brush.width * WIDTH_OUT, duration: DRAW_OUT * 0.7, ease: "power2.out", onUpdate: paint }, 0);
      tl.call(() => setState((s) => ({ ...s, covering: false })), [], DRAW_OUT * READY_AT);
      tlRef.current = tl;
    };
    raf = requestAnimationFrame(settle);

    return () => cancelAnimationFrame(raf);
  }, [pathname, state.active, state.brush, lenis]);

  const brush = state.brush;

  return (
    <TransitionContext.Provider value={{ transitionTo, isTransitioning: state.covering }}>
      {children}
      {state.active && brush && (
        <div className="dt" aria-hidden="true">
          <svg className="dt__svg" width={brush.w} height={brush.h} viewBox={`0 0 ${brush.w} ${brush.h}`}>
            <rect ref={fillRef} width={brush.w} height={brush.h} fill={BRUSH} opacity={0} />
            <path
              ref={pathRef}
              d={brush.d}
              fill="none"
              stroke={BRUSH}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${brush.length} ${brush.length}`}
              strokeDashoffset={brush.length}
              strokeWidth={brush.width * WIDTH_IN}
            />
          </svg>
          <span ref={labelRef} className="dt__label">
            {state.label}
          </span>
        </div>
      )}
    </TransitionContext.Provider>
  );
}
