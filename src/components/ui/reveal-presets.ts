"use client";

import { useEffect, useState } from "react";

/**
 * The dragon's liquid reveal (About section), shared so every reveal on the
 * page can use exactly the same feel: torn, inky edges from strong noise, a
 * tighter brush, and a trail that shreds away over 1.8s instead of shrinking.
 */
export const DRAGON_REVEAL = {
  radius: 120,
  blur: 0.55,
  circleBoost: 0.7,
  texture: 0.7,
  timeSpeed: 5,
  splatRadius: 0.11,
  velocityDissipation: 0.985,
  shrinkTimeSeconds: 1.8,
  curl: 34,
  pressureIterations: 16,
} as const;

/** Where the dragon's reveal lives, so other reveals can match its brush */
export const DRAGON_REVEAL_ID = "dragon-reveal";

/**
 * The dragon's brush radius in px. The brush is sized against its container's
 * shorter side, and the containers differ, so a reveal that should feel the
 * same has to match this in px rather than copy the fraction.
 */
export function useDragonBrushPx(fallback = 64) {
  return useDragonMetrics(fallback).brush;
}

/**
 * The dragon's brush radius (px) and its container's width (px). A reveal in
 * a container of another size matches the dragon by using the same brush in
 * px, and by scaling its edge noise by (its width / the dragon's width).
 */
export function useDragonMetrics(fallbackBrush = 64) {
  const [m, setM] = useState({ brush: fallbackBrush, width: 0 });
  useEffect(() => {
    const el = document.getElementById(DRAGON_REVEAL_ID);
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) {
        setM({ brush: DRAGON_REVEAL.splatRadius * Math.min(r.width, r.height), width: r.width });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return m;
}
