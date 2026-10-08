"use client";

import React, { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { DRAGON_REVEAL, useDragonBrushPx } from "@/components/ui/reveal-presets";

interface Point {
  x: number;
  y: number;
  /** Seconds (performance clock); may lie in the future for a queued tap wipe */
  born: number;
}

/* ── The dragon's brush, rebuilt as an SVG mask ─────────────────────────────
   The dragon's shader reveals where
       smoothstep(0.35, 0.55, noise * strength + (density * boost)^1.5)
   with noise that only ever subtracts. Dense ink is solid; as ink fades the
   noise wins, so the reveal shreds into torn fibres instead of shrinking.
   Here the density is a trail of soft discs, the noise is fractal turbulence
   drifting over time, and one arithmetic composite does the sum and the
   ramp. The constants below are the shader's, for texture 0.7. */

/** Ink fades to 1% over this long, as the dragon's density does */
const SHRINK = DRAGON_REVEAL.shrinkTimeSeconds;
/** Noise wavelength ~39px and drift ~40px/s, as on the dragon at 1440px */
const NOISE_FREQ = 0.024;
const NOISE_DRIFT = 40;
const TILE = 256;
/* alpha = K2 * ink + K3 * noise + K4, clamped: the ramp of smoothstep(0.35,
   0.55) applied to (4.41 * noise - 4.41) + 5 * ink, divided by the 0.2 span */
const K2 = 25;
const K3 = 22.05;
const K4 = -23.8;

/** A new trail point every this many px the brush head travels */
const SPACING = 7;
const MAX_POINTS = 44;
/** How quickly the brush head catches up with the pointer (per second) */
const FOLLOW = 13;
/** A tap on touch screens spreads ink this far apart, this fast (s per step) */
const TAP_STEP = 0.55;
const TAP_DELAY = 0.04;

/**
 * Ink left after `age` seconds. The dragon's brush deposits density every
 * frame, so its ink builds to a few times the threshold: it holds solid for a
 * moment, then fades to 1% of that over SHRINK and shreds on the way down.
 */
const BUILD_UP = 3;
const inkAt = (age: number) => (age <= 0 ? 0 : Math.min(1, BUILD_UP * Math.pow(0.01, age / SHRINK)));

/**
 * Two faces of one block. `children` is the normal face; `alt` is laid over it,
 * masked by the dragon's brush, while the normal face takes the exact inverse
 * of that mask. Move across the block and one face tears into the other, with
 * nothing between them, then shreds back behind you, as the portrait does.
 *
 * The alt layer bleeds past the block by --gj-bleed and is padded by the same
 * amount, so its content box sits exactly on the block's. It never takes
 * pointer events: links and buttons in the normal face keep working through
 * it. On touch screens a tap spreads ink across the block instead.
 */
export function GenjutsuReveal({
  children,
  alt,
  className,
  radius,
}: {
  children: React.ReactNode;
  alt: React.ReactNode;
  className?: string;
  /** Brush radius in px. Defaults to the dragon's own brush. */
  radius?: number;
}) {
  const dragonBrush = useDragonBrushPx();
  const brush = radius ?? dragonBrush;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ids = {
    mask: `gj-m-${uid}`,
    baseMask: `gj-bm-${uid}`,
    filter: `gj-f-${uid}`,
    baseFilter: `gj-bf-${uid}`,
    ink: `gj-i-${uid}`,
    discs: `gj-d-${uid}`,
  };

  const altRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const s = useRef({
    points: [] as Point[],
    inside: false,
    target: { x: 0, y: 0 },
    head: { x: 0, y: 0 },
    lastEmit: { x: -1e4, y: -1e4 },
    /** Ink at the head: full while the pointer is over the block */
    headInk: 0,
    rect: null as DOMRect | null,
    /** The alt layer's size, kept when the rect is dropped on scroll */
    size: { w: 0, h: 0 },
    raf: 0,
    last: 0,
    on: false,
    drift: 0,
  });

  const frame = useCallback(
    (tMs: number) => {
      const st = s.current;
      const el = altRef.current;
      const svg = svgRef.current;
      if (!el || !svg) return;
      const now = tMs / 1000;
      const dt = Math.min(0.05, st.last ? now - st.last : 1 / 60);
      st.last = now;

      // The head eases after the pointer; its ink is full while inside and
      // fades at the dragon's rate once the pointer leaves
      const k = 1 - Math.exp(-FOLLOW * dt);
      st.head.x += (st.target.x - st.head.x) * k;
      st.head.y += (st.target.y - st.head.y) * k;
      // Head ink is kept as the built-up amount, and shown clamped to 1
      st.headInk = st.inside ? Math.min(BUILD_UP, st.headInk + dt * 24) : st.headInk * Math.pow(0.01, dt / SHRINK);
      if (st.headInk < 0.01) st.headInk = 0;

      if (st.inside && Math.hypot(st.head.x - st.lastEmit.x, st.head.y - st.lastEmit.y) > SPACING) {
        st.points.push({ x: st.head.x, y: st.head.y, born: now });
        st.lastEmit = { ...st.head };
        if (st.points.length > MAX_POINTS) st.points.shift();
      }
      st.points = st.points.filter((p) => now - p.born < SHRINK || p.born > now);

      // Write the discs: the head first, then the trail
      const discs = svg.querySelectorAll<SVGCircleElement>(`#${ids.discs} circle`);
      const r = (brush * 2).toFixed(1);
      let used = 0;
      const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
      const put = (x: number, y: number, ink: number) => {
        if (ink < 0.01 || used >= discs.length) return;
        box.x0 = Math.min(box.x0, x);
        box.y0 = Math.min(box.y0, y);
        box.x1 = Math.max(box.x1, x);
        box.y1 = Math.max(box.y1, y);
        const c = discs[used++];
        c.setAttribute("cx", x.toFixed(1));
        c.setAttribute("cy", y.toFixed(1));
        c.setAttribute("r", r);
        c.setAttribute("opacity", ink.toFixed(3));
      };
      put(st.head.x, st.head.y, Math.min(1, st.headInk));
      for (const p of st.points) put(p.x, p.y, inkAt(now - p.born));
      for (let i = used; i < discs.length; i++) discs[i].setAttribute("opacity", "0");

      // Drift the noise, so the torn edge crawls as the dragon's does
      st.drift = (st.drift + NOISE_DRIFT * dt) % TILE;

      // The noise is only worked out where there is ink to tear: the filters
      // cover the trail's bounds, not the whole block. Its 256px tile sits on
      // a grid that drifts with the noise, and the filter always reaches back
      // to the tile under the trail's corner: a tile left outside the filter
      // is clipped, and the ink then shows as hard-edged rectangles (seen on
      // the contact page's tall kanji, beyond the first 256px)
      if (used) {
        const pad = brush * 2 + 2;
        const { w, h } = st.size;
        const x0 = Math.max(0, box.x0 - pad);
        const y0 = Math.max(0, box.y0 - pad);
        const x1 = w ? Math.min(w, box.x1 + pad) : box.x1 + pad;
        const y1 = h ? Math.min(h, box.y1 + pad) : box.y1 + pad;
        const tx = Math.floor((x0 + st.drift) / TILE) * TILE - st.drift;
        const ty = Math.floor(y0 / TILE) * TILE;
        for (const f of svg.querySelectorAll("filter")) {
          f.setAttribute("x", tx.toFixed(1));
          f.setAttribute("y", ty.toFixed(0));
          f.setAttribute("width", Math.max(1, x1 - tx).toFixed(1));
          f.setAttribute("height", Math.max(1, y1 - ty).toFixed(0));
        }
        for (const t of svg.querySelectorAll("feTurbulence")) {
          t.setAttribute("x", tx.toFixed(1));
          t.setAttribute("y", ty.toFixed(0));
        }
      }

      // While there is ink, the normal face is wiped away exactly where the
      // alt face shows through; with none, it stands unmasked
      const on = used > 0;
      if (on !== st.on) {
        st.on = on;
        el.dataset.on = String(on);
        const base = baseRef.current;
        if (base) {
          const m = on ? `url(#${ids.baseMask})` : "";
          base.style.maskImage = m;
          base.style.setProperty("-webkit-mask-image", m);
        }
      }

      if (st.points.length || st.headInk > 0) {
        st.raf = requestAnimationFrame(frame);
      } else {
        st.raf = 0;
        st.last = 0;
      }
    },
    [brush, ids.baseMask, ids.discs],
  );

  const run = useCallback(() => {
    if (!s.current.raf) s.current.raf = requestAnimationFrame(frame);
  }, [frame]);

  // Size the mask and its filter to the alt layer (block plus bleed)
  const fit = () => {
    const st = s.current;
    const el = altRef.current;
    const svg = svgRef.current;
    if (!el || !svg) return null;
    st.rect = el.getBoundingClientRect();
    const w = st.rect.width.toFixed(0);
    const h = st.rect.height.toFixed(0);
    st.size = { w: st.rect.width, h: st.rect.height };
    for (const node of svg.querySelectorAll("mask")) {
      node.setAttribute("width", w);
      node.setAttribute("height", h);
    }
    // The normal face sits inside the alt layer's bleed: shift its copy of
    // the ink by that much, so both faces share one stroke to the pixel
    const base = baseRef.current?.getBoundingClientRect();
    if (base) {
      const dx = (st.rect.left - base.left).toFixed(1);
      const dy = (st.rect.top - base.top).toFixed(1);
      svg.querySelector("[data-base-shift]")?.setAttribute("transform", `translate(${dx} ${dy})`);
      const m = svg.querySelector(`#${ids.baseMask}`);
      m?.setAttribute("x", dx);
      m?.setAttribute("y", dy);
    }
    return st.rect;
  };

  const local = (clientX: number, clientY: number) => {
    const rect = s.current.rect ?? fit();
    return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: 0, y: 0 };
  };

  // The rect goes stale when the page scrolls under a hovering pointer
  useEffect(() => {
    const drop = () => (s.current.rect = null);
    window.addEventListener("scroll", drop, { passive: true });
    window.addEventListener("resize", drop);
    return () => {
      window.removeEventListener("scroll", drop);
      window.removeEventListener("resize", drop);
      cancelAnimationFrame(s.current.raf);
    };
  }, []);

  // No hover on touch screens: a tap spreads ink out from the finger across
  // the whole block, so the alt face can be read before it shreds away
  const wipe = (clientX: number, clientY: number) => {
    const st = s.current;
    st.rect = null;
    const { x, y } = local(clientX, clientY);
    const rect = st.rect as DOMRect | null;
    if (!rect) return;
    const step = brush * 2 * TAP_STEP;
    const now = performance.now() / 1000;
    const pts: Point[] = [];
    for (let k = 0; k * step < rect.width; k++) {
      for (const dir of k ? [-1, 1] : [1]) {
        const px = x + dir * k * step;
        if (px < -step || px > rect.width + step) continue;
        pts.push({ x: px, y: rect.height / 2 + (y - rect.height / 2) * 0.3, born: now + k * TAP_DELAY });
      }
    }
    // A tap's ink is laid twice over, so it holds solid a moment before shredding
    st.points = [...pts, ...pts.map((p) => ({ ...p, born: p.born + 0.35 }))].slice(0, MAX_POINTS);
    run();
  };

  return (
    <div
      className={cn("gj", className)}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        const st = s.current;
        st.rect = null;
        const p = local(e.clientX, e.clientY);
        st.inside = true;
        st.target = p;
        // Re-entering while ink remains continues from where the head is
        if (st.headInk < 0.05) st.head = { ...p };
        run();
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        s.current.target = local(e.clientX, e.clientY);
        run();
      }}
      onPointerLeave={() => {
        s.current.inside = false;
        run();
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") wipe(e.clientX, e.clientY);
      }}
    >
      <div ref={baseRef} className="gj-base">
        {children}
      </div>

      {/* The brush: soft ink discs, torn by drifting noise, as a mask */}
      <svg ref={svgRef} className="gj-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={ids.ink}>
            {/* exp(-d²/r²) out to twice the brush radius */}
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.25" stopColor="#fff" stopOpacity="0.78" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.37" />
            <stop offset="0.75" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          {[ids.filter, ids.baseFilter].map((id) => (
            <filter
              key={id}
              id={id}
              filterUnits="userSpaceOnUse"
              primitiveUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1"
              height="1"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency={NOISE_FREQ}
                numOctaves={2}
                seed={7}
                stitchTiles="stitch"
                x="0"
                y="0"
                width={TILE}
                height={TILE}
                result="tile"
              />
              <feTile in="tile" result="noise" />
              {/* Noise into alpha, stretched to use its full range */}
              <feColorMatrix
                in="noise"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0"
                result="n0"
              />
              <feComponentTransfer in="n0" result="n">
                <feFuncA type="linear" slope="2.5" intercept="-0.75" />
              </feComponentTransfer>
              <feComposite in="SourceGraphic" in2="n" operator="arithmetic" k1="0" k2={K2} k3={K3} k4={K4} result="ink" />
              {id === ids.baseFilter && (
                <>
                  {/* The exact complement: solid everywhere the ink is not */}
                  <feFlood floodColor="#fff" floodOpacity="1" result="full" />
                  <feComposite in="full" in2="ink" operator="out" />
                </>
              )}
            </filter>
          ))}
          <g id={ids.discs}>
            {Array.from({ length: MAX_POINTS + 1 }, (_, i) => (
              <circle key={i} r="0" opacity="0" fill={`url(#${ids.ink})`} />
            ))}
          </g>
          <mask id={ids.mask} maskUnits="userSpaceOnUse" x="0" y="0" width="1" height="1" style={{ maskType: "alpha" }}>
            <use href={`#${ids.discs}`} filter={`url(#${ids.filter})`} />
          </mask>
          <mask
            id={ids.baseMask}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1"
            height="1"
            style={{ maskType: "alpha" }}
          >
            <g data-base-shift="">
              <use href={`#${ids.discs}`} filter={`url(#${ids.baseFilter})`} />
            </g>
          </mask>
        </defs>
      </svg>

      <div
        ref={altRef}
        className="gj-alt"
        aria-hidden="true"
        data-on="false"
        style={{ maskImage: `url(#${ids.mask})`, WebkitMaskImage: `url(#${ids.mask})` }}
      >
        {alt}
      </div>
    </div>
  );
}

/** Three tomoe around a pupil, turning slowly */
export function Sharingan({ className, spin = true }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="-12 -12 24 24" className={cn("gj-eye", className)} aria-hidden="true">
      <circle r="11.2" fill="url(#gj-iris)" />
      <circle r="11.2" fill="none" stroke="#12010380" strokeWidth="1.1" />
      <circle r="6.4" fill="none" stroke="#1201038c" strokeWidth="0.55" />
      <g className={spin ? "gj-eye__tomoe" : undefined}>
        {[0, 120, 240].map((a) => (
          <g key={a} transform={`rotate(${a}) translate(0 -6.4)`}>
            <circle r="1.75" fill="#120103" />
            <path d="M1.6 -0.7 C 1.9 -2.6 0.4 -3.9 -1.6 -4.1 C -0.4 -3.2 -0.1 -2 -0.2 -1.7 Z" fill="#120103" />
          </g>
        ))}
      </g>
      <circle r="2.5" fill="#120103" />
    </svg>
  );
}

/** Shared gradient for every eye on the page, rendered once */
export function SharinganDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="gj-iris" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#ff4b4b" />
          <stop offset="0.55" stopColor="#d1101f" />
          <stop offset="1" stopColor="#6d0710" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default GenjutsuReveal;
