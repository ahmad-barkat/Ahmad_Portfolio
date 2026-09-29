"use client";

import { useEffect, useState } from "react";
import { usePageTransition } from "./TransitionProvider";

/** Fired on window when the first-visit preloader starts to lift */
export const PRELOADER_DONE_EVENT = "app:preloader-done";

/** Fired on window when a scroll-to-next hand-off (next-page.tsx) starts to lift */
export const HANDOFF_DONE_EVENT = "app:handoff-done";

/**
 * True once the page can actually be seen: the first-visit preloader has
 * lifted, no page-transition overlay is covering the screen, and no
 * scroll-to-next hand-off (next-page.tsx) is still holding it. Entrance
 * animations wait for it, so they play in front of the visitor instead of
 * behind a curtain.
 */
export function usePageReady() {
  const { isTransitioning } = usePageTransition();
  const [curtainUp, setCurtainUp] = useState(false);
  const [handedOff, setHandedOff] = useState(
    () => typeof document === "undefined" || document.documentElement.dataset.handoff !== "on",
  );

  useEffect(() => {
    if (handedOff) return;
    const done = () => setHandedOff(true);
    window.addEventListener(HANDOFF_DONE_EVENT, done);
    return () => window.removeEventListener(HANDOFF_DONE_EVENT, done);
  }, [handedOff]);

  useEffect(() => {
    let raf = 0;
    const lifted = () => setCurtainUp(true);
    window.addEventListener(PRELOADER_DONE_EVENT, lifted);
    // The preloader decides whether to show in its own effect, which runs
    // after the page's, so look a couple of frames later
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        if (document.documentElement.dataset.preloader !== "on") lifted();
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(PRELOADER_DONE_EVENT, lifted);
    };
  }, []);

  return curtainUp && !isTransitioning && handedOff;
}
