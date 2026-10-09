"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True once the element is within `margin` of the viewport AND the page has
 * settled: the visitor has scrolled, touched, moved the pointer or pressed a
 * key, or the browser has been idle for a moment after load. Heavy scenes
 * (WebGL, particle fields) wait on this so they never compete with the first
 * paint and the hero entrance. It never switches back off.
 */
export function useActivate(ref: RefObject<Element | null>, margin = "100% 0px") {
  const [near, setNear] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);

  useEffect(() => {
    if (pageSettled) {
      setSettled(true);
      return;
    }
    const done = () => setSettled(true);
    waiters.add(done);
    armSettle();
    return () => {
      waiters.delete(done);
    };
  }, []);

  return near && settled;
}

/**
 * A section that sets up its scroll animations late has to tell ScrollTrigger,
 * so every trigger below it (and any pin spacer it added) is measured again.
 * Several sections waking on the same scroll share one refresh.
 */
let refreshTimer = 0;
export function queueScrollRefresh() {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => ScrollTrigger.refresh());
  }, 120);
}

// One page-wide "settled" signal, shared by every scene
let pageSettled = false;
let armed = false;
const waiters = new Set<() => void>();
const EVENTS = ["pointermove", "pointerdown", "touchstart", "wheel", "scroll", "keydown"] as const;

function settle() {
  if (pageSettled) return;
  pageSettled = true;
  EVENTS.forEach((ev) => window.removeEventListener(ev, settle));
  waiters.forEach((w) => w());
  waiters.clear();
}

function armSettle() {
  if (armed) return;
  armed = true;
  EVENTS.forEach((ev) => window.addEventListener(ev, settle, { passive: true, once: true }));
  const idle = () => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
      .requestIdleCallback;
    // Well after the entrance has played, then whenever the main thread is free
    window.setTimeout(() => (ric ? ric(settle, { timeout: 2000 }) : settle()), 6000);
  };
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}
