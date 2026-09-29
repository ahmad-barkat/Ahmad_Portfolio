"use client";

import { useEffect } from "react";

/** Blocks whose CSS loops freeze while they are well out of view */
const WATCHED = "section, .ftr-wrap";

/**
 * Freezes every CSS animation inside a section while that section is more
 * than a fifth of a screen away (see [data-offscreen] in globals.css), and
 * lets it run again just before it scrolls back in. Pings, hints and pulses
 * then cost nothing while nobody can see them, which leaves the frame budget
 * to whatever is on screen. Sections added later (route changes, lazy
 * phases) are picked up as they appear.
 */
export default function AnimationGovernor() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          (e.target as HTMLElement).dataset.offscreen = String(!e.isIntersecting);
        }
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    const seen = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll(WATCHED).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan();

    let queued = 0;
    const mo = new MutationObserver(() => {
      if (!queued) queued = requestAnimationFrame(() => ((queued = 0), scan()));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(queued);
    };
  }, []);

  return null;
}
