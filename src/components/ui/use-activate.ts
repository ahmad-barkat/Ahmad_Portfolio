"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True once the element is within `margin` of the viewport AND the page has
 * settled: the visitor has scrolled, touched, clicked or pressed a key, or the browser has been idle for a moment after load. Heavy scenes
 * (WebGL, particle fields) wait on this so they never compete with the first
 * paint and the hero entrance. It never switches back off.
 *
 * `early`: also wake in the first quiet moment after the page has settled,
 * however far away the element is. For sections whose set-up re-measures the
 * page's scroll (pins, a track height): woken together they share one
 * re-measure up at the top, instead of each one freezing the scroll for a
 * moment just as the visitor reaches it.
 */
export function useActivate(ref: RefObject<Element | null>, margin = "100% 0px", early = false) {
  const [near, setNear] = useState(false);
  const [settled, setSettled] = useState(false);
  const [quiet, setQuiet] = useState(false);

  useEffect(() => {
    if (!early) return;
    if (quietReady) {
      setQuiet(true);
      return;
    }
    const done = () => setQuiet(true);
    quietWaiters.add(done);
    return () => {
      quietWaiters.delete(done);
    };
  }, [early]);

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

  return settled && (near || quiet);
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

// ...and a quiet moment after it, for the `early` sections
let quietReady = false;
const quietWaiters = new Set<() => void>();
let lastScroll = -1e9;
let lastPointer = -1e9;
function armQuiet() {
  // A set-up mid-scroll would stall the very scroll it is meant to spare;
  // one while the pointer plays over the hero would stutter its brush
  window.addEventListener("scroll", () => (lastScroll = performance.now()), { passive: true });
  window.addEventListener("pointermove", () => (lastPointer = performance.now()), { passive: true });
  let waitingSince = 0;
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
    .requestIdleCallback;
  // One waiter per idle slot, so a scene's set-up never lands on top of
  // another's (anything that registers after this simply wakes at once)
  const next = () => {
    const [w] = quietWaiters;
    if (!w) {
      quietReady = true;
      return;
    }
    // Phones wait for a real pause in reading: a set-up costs them more
    const calm = window.matchMedia("(pointer: coarse)").matches ? 1000 : 400;
    const now = performance.now();
    if (now - lastScroll < calm) {
      window.setTimeout(next, calm);
      return;
    }
    // The pointer only delays it a little: a visitor who keeps it moving
    // must not keep the page from ever getting ready
    waitingSince ||= now;
    if (now - lastPointer < 300 && now - waitingSince < 2500) {
      window.setTimeout(next, 300);
      return;
    }
    waitingSince = 0;
    quietWaiters.delete(w);
    w();
    if (ric) ric(next, { timeout: 1500 });
    else window.setTimeout(next, 50);
  };
  window.setTimeout(() => (ric ? ric(next, { timeout: 2500 }) : next()), 1500);
}
// Not pointermove: a mouse playing over the hero is not a step down the
// page, and set-ups started then would stutter the entrance under it
const EVENTS = ["pointerdown", "touchstart", "wheel", "scroll", "keydown"] as const;

function settle() {
  if (pageSettled) return;
  pageSettled = true;
  EVENTS.forEach((ev) => window.removeEventListener(ev, settle));
  waiters.forEach((w) => w());
  waiters.clear();
  armQuiet();
}

function armSettle() {
  if (armed) return;
  armed = true;
  EVENTS.forEach((ev) => window.addEventListener(ev, settle, { passive: true, once: true }));
  const idle = () => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
      .requestIdleCallback;
    // Well after the entrance has played, in a pause of the pointer (for a
    // few seconds at most), then whenever the main thread is free
    let moved = -1e9;
    const track = () => (moved = performance.now());
    window.addEventListener("pointermove", track, { passive: true });
    const from = performance.now() + 6000;
    const tryNow = () => {
      if (pageSettled) return window.removeEventListener("pointermove", track);
      const now = performance.now();
      if (now - moved < 300 && now - from < 6000) return void window.setTimeout(tryNow, 300);
      window.removeEventListener("pointermove", track);
      if (ric) ric(settle, { timeout: 2000 });
      else settle();
    };
    window.setTimeout(tryNow, 6000);
  };
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}
