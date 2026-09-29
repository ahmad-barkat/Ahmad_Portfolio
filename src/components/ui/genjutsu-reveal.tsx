"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

/** How long the ripple takes to open across a block, and to close again (s) */
const OPEN = 0.75;
const CLOSE = 0.6;
/** On touch screens a tapped block stays open this long before closing (s) */
const TAP_HOLD = 3;

/**
 * Two faces of one block. `children` is the normal face; `alt` (the shinobi
 * face) is laid over it. Hovering casts a genjutsu: a circle opens from the
 * point where the pointer came in until it covers the whole block, with two
 * thin crimson rings riding its edge, and closes into the point where the
 * pointer leaves. The normal face carries the exact inverse mask, so the two
 * faces never show through each other.
 *
 * Everything is a CSS radial-gradient mask driven by three custom properties
 * (--gj-x, --gj-y, --gj-r), so each frame is a cheap repaint of one small
 * block. Reversing mid-way continues from the current circle, never jumps.
 *
 * The alt layer bleeds past the block by --gj-bleed and is padded by the same
 * amount, so its content box sits exactly on the block's. It never takes
 * pointer events: links in the normal face keep working through it. On touch
 * screens a tap opens it from the finger, and it closes by itself.
 */
export function GenjutsuReveal({
  children,
  alt,
  className,
}: {
  children: React.ReactNode;
  alt: React.ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const altRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<SVGSVGElement>(null);
  const s = useRef({
    x: 0,
    y: 0,
    r: 0,
    tween: null as gsap.core.Tween | null,
    hold: null as gsap.core.Tween | null,
  });

  /** Writes the circle to the masks and the rings */
  const apply = () => {
    const root = rootRef.current;
    const el = altRef.current;
    if (!root || !el) return;
    const { x, y, r } = s.current;
    root.style.setProperty("--gj-x", `${x.toFixed(1)}px`);
    root.style.setProperty("--gj-y", `${y.toFixed(1)}px`);
    root.style.setProperty("--gj-r", `${r.toFixed(1)}px`);
    const on = r > 0.5;
    if ((root.dataset.gj === "on") !== on) {
      root.dataset.gj = on ? "on" : "off";
      el.dataset.on = String(on);
    }

    // The rings show while the circle moves and fade as it settles
    const full = reach(x, y);
    const t = full ? Math.min(1, r / full) : 0;
    const fade = Math.sin(Math.PI * Math.min(1, t * 1.08));
    const rings = ringsRef.current?.children;
    if (rings) {
      rings[0].setAttribute("cx", x.toFixed(1));
      rings[0].setAttribute("cy", y.toFixed(1));
      rings[0].setAttribute("r", Math.max(0, r).toFixed(1));
      rings[0].setAttribute("opacity", (fade * 0.85).toFixed(3));
      rings[1].setAttribute("cx", x.toFixed(1));
      rings[1].setAttribute("cy", y.toFixed(1));
      rings[1].setAttribute("r", Math.max(0, r * 0.82 - 6).toFixed(1));
      rings[1].setAttribute("opacity", (fade * 0.4).toFixed(3));
    }
  };

  /** The alt layer's size (block plus bleed) */
  const size = () => {
    const el = altRef.current;
    return el ? { w: el.offsetWidth, h: el.offsetHeight } : { w: 0, h: 0 };
  };

  /** Radius that covers the whole layer from (x, y) */
  const reach = (x: number, y: number) => {
    const { w, h } = size();
    return Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 2;
  };

  /** A pointer position in the alt layer's own coordinates */
  const local = (clientX: number, clientY: number) => {
    const rect = altRef.current?.getBoundingClientRect();
    return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: 0, y: 0 };
  };

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const open = (clientX: number, clientY: number) => {
    const st = s.current;
    st.hold?.kill();
    st.tween?.kill();
    // Start from the pointer, unless a circle is still showing: then grow it
    // from where it is, so nothing jumps
    if (st.r < 1) {
      const p = local(clientX, clientY);
      st.x = p.x;
      st.y = p.y;
    }
    const to = reach(st.x, st.y);
    if (reduced()) {
      st.r = to;
      apply();
      return;
    }
    st.tween = gsap.to(st, { r: to, duration: OPEN, ease: "power3.out", overwrite: true, onUpdate: apply });
  };

  const close = (clientX?: number, clientY?: number) => {
    const st = s.current;
    st.hold?.kill();
    st.tween?.kill();
    // Fully open, the circle can move to the exit point without a visible
    // change, then close into it
    if (clientX !== undefined && clientY !== undefined && st.r >= reach(st.x, st.y) - 2) {
      const p = local(clientX, clientY);
      st.x = p.x;
      st.y = p.y;
      st.r = reach(st.x, st.y);
    }
    if (reduced()) {
      st.r = 0;
      apply();
      return;
    }
    st.tween = gsap.to(st, { r: 0, duration: CLOSE, ease: "power3.inOut", overwrite: true, onUpdate: apply });
  };

  useEffect(() => {
    const st = s.current;
    return () => {
      st.tween?.kill();
      st.hold?.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn("gj", className)}
      data-gj="off"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") open(e.clientX, e.clientY);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") close(e.clientX, e.clientY);
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        // Touch: a tap opens it from the finger; a second tap closes it early
        if (s.current.r > 1 && s.current.hold) {
          close();
          return;
        }
        open(e.clientX, e.clientY);
        s.current.hold = gsap.delayedCall(TAP_HOLD, () => close());
      }}
    >
      <div className="gj-base">{children}</div>

      <div ref={altRef} className="gj-alt" aria-hidden="true" data-on="false">
        {alt}
      </div>

      {/* Two thin rings on the edge of the circle, like a ripple in the eye */}
      <svg ref={ringsRef} className="gj-rings" aria-hidden="true" focusable="false">
        <circle r="0" opacity="0" />
        <circle r="0" opacity="0" />
      </svg>
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
