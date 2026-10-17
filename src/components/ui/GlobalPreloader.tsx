"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Loader from "./Loader";
import { PRELOADER_DONE_EVENT } from "./page-ready";

/* Pages that run their own full-screen intro and must not get a second curtain */
const SELF_LOADING_ROUTES = ["/"];

/**
 * The AHMAD curtain. It is part of the server's HTML, so it covers every page
 * from the first paint until the page wakes up, as `app/loading.tsx` used to.
 * That file was a Suspense fallback: it kept the whole page hidden in the
 * HTML until React revealed it, so a phone could not lay out or paint
 * anything until then. Now the page is built and painted underneath while the
 * curtain is up, and lifting it costs nothing.
 *
 * On a first visit in a session it then holds for a moment and fades (pages
 * hold their entrance until it lifts, see page-ready.ts); otherwise it goes
 * as soon as the page wakes. `html[data-boot]` (set in layout.tsx) holds the
 * page's own fade-in until the curtain goes.
 */
export default function GlobalPreloader() {
  const pathname = usePathname();
  const selfLoading = SELF_LOADING_ROUTES.includes(pathname ?? "");
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const release = () => {
      delete document.documentElement.dataset.boot;
    };
    if (selfLoading) {
      setLoading(false);
      release();
      return;
    }

    // Only show once per session on cold-start; do not block client-side navigations
    let hasSeen: string | null = null;
    try {
      hasSeen = sessionStorage.getItem("app_loaded");
      sessionStorage.setItem("app_loaded", "true");
    } catch {}
    if (hasSeen) {
      setLoading(false);
      release();
      return;
    }

    setLoading(true);
    // Pages hold their entrance until the curtain lifts (see page-ready.ts)
    document.documentElement.dataset.preloader = "on";
    let doneTimer = 0;
    const finish = () => {
      delete document.documentElement.dataset.preloader;
      release();
      window.dispatchEvent(new Event(PRELOADER_DONE_EVENT));
    };

    const minTime = window.setTimeout(() => {
      setFading(true);
      // The page is let go as the curtain starts to fade, so the entrance
      // and the fade overlap instead of queueing
      finish();
      doneTimer = window.setTimeout(() => setLoading(false), 250);
    }, 300);

    return () => {
      window.clearTimeout(minTime);
      window.clearTimeout(doneTimer);
      if (document.documentElement.dataset.preloader) finish();
    };
  }, [pathname, selfLoading]);

  if (!loading) return null;

  return (
    <div
      className="boot-curtain"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0B3D91",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: fading ? "none" : "auto",
      }}
      aria-hidden="true"
    >
      {/* Without scripts nothing would lift it */}
      <noscript>
        <style>{`.boot-curtain { display: none !important; } html[data-boot] .page-enter { animation-play-state: running; }`}</style>
      </noscript>
      <Loader text="AHMAD" />
    </div>
  );
}
