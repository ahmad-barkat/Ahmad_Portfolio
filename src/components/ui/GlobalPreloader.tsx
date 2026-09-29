"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Loader from "./Loader";
import { PRELOADER_DONE_EVENT } from "./page-ready";

/* Pages that run their own full-screen intro and must not get a second curtain */
const SELF_LOADING_ROUTES = ["/story", "/"];

export default function GlobalPreloader() {
  const pathname = usePathname();
  const selfLoading = SELF_LOADING_ROUTES.includes(pathname ?? "");
  const [loading, setLoading] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (selfLoading) {
      setLoading(false);
      return;
    }

    // Only show once per session on cold-start; do not block client-side navigations
    const hasSeen = typeof window !== "undefined" ? sessionStorage.getItem("app_loaded") : null;
    if (hasSeen) {
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem("app_loaded", "true");
    }
    setLoading(true);
    // Pages hold their entrance until the curtain lifts (see page-ready.ts)
    document.documentElement.dataset.preloader = "on";
    let doneTimer = 0;
    const finish = () => {
      delete document.documentElement.dataset.preloader;
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

  if (!loading || selfLoading) return null;

  return (
    <div
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
      <Loader text="AHMAD" />
    </div>
  );
}
