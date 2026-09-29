"use client";

import { useEffect, useState } from "react";
import { usePageTransition } from "./TransitionProvider";

/** Fired on window when the first-visit preloader starts to lift */
export const PRELOADER_DONE_EVENT = "app:preloader-done";

/**
 * True once the page can actually be seen: the first-visit preloader has
 * lifted and no page-transition overlay is covering the screen. Entrance
 * animations wait for it, so they play in front of the visitor instead of
 * behind a curtain.
 */
export function usePageReady() {
  const { isTransitioning } = usePageTransition();
  const [curtainUp, setCurtainUp] = useState(false);

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

  return curtainUp && !isTransitioning;
}
