"use client";

import React, { useEffect, useRef, useState } from "react";

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget(options: { url: string; parentElement: HTMLElement; resize?: boolean }): void;
    };
  }
}

/** Calendly's script, added to the page once, the first time a calendar is near */
let scriptPromise: Promise<void> | null = null;
function loadCalendly(): Promise<void> {
  if (window.Calendly?.initInlineWidget) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        s.remove();
        reject(new Error("Calendly failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

type CalendlyEvent = "calendly.event_type_viewed" | "calendly.date_and_time_selected" | "calendly.event_scheduled";

/**
 * Calendly's inline booking calendar.
 *
 *   - The script and the calendar only load when the section is close to the
 *     screen, so the rest of the page is not slowed down.
 *   - The frame takes the calendar's own height (Calendly posts it on every
 *     step), so there is never a scrollbar inside it.
 *   - `onEvent` hears when a slot is picked and when a call is booked.
 *
 * The colours are passed in the URL; Calendly only applies them on paid plans,
 * and the frame is styled so the calendar sits well either way.
 */
export function CalendlyEmbed({
  url,
  title = "Book a call",
  className,
  onEvent,
  fallback,
}: {
  url: string;
  title?: string;
  className?: string;
  onEvent?: (event: CalendlyEvent) => void;
  /** Shown if the calendar can't load (blocked by the browser, offline) */
  fallback?: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [height, setHeight] = useState<number | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Load when within a screen and a half of the viewport
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let fallbackTimer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setStatus("loading");
        loadCalendly()
          .then(() => {
            if (cancelled || !window.Calendly) return;
            host.replaceChildren();
            window.Calendly.initInlineWidget({ url, parentElement: host });
            const frame = host.querySelector("iframe");
            if (!frame) return;
            frame.title = title;
            // Should Calendly never say it has drawn, show the frame anyway
            frame.addEventListener("load", () => {
              fallbackTimer = window.setTimeout(() => !cancelled && setStatus((s) => (s === "loading" ? "ready" : s)), 4000);
            });
          })
          .catch(() => !cancelled && setStatus("error"));
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(host);
    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      io.disconnect();
      host.replaceChildren();
    };
  }, [url, title]);

  // Messages from this calendar only: its height, and what the visitor did
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!/^https:\/\/([a-z0-9-]+\.)*calendly\.com$/.test(e.origin)) return;
      const frame = hostRef.current?.querySelector("iframe");
      if (!frame || e.source !== frame.contentWindow) return;
      const data = e.data as { event?: string; payload?: { height?: string } };
      if (!data?.event) return;
      if (data.event === "calendly.page_height") {
        // Its first report, before the page has drawn, is a few pixels: skip it
        const h = parseFloat(data.payload?.height ?? "");
        if (h >= 300) setHeight(Math.ceil(h));
        return;
      }
      if (data.event === "calendly.event_type_viewed" || data.event === "calendly.profile_page_viewed") {
        setStatus("ready");
      }
      if (
        data.event === "calendly.event_type_viewed" ||
        data.event === "calendly.date_and_time_selected" ||
        data.event === "calendly.event_scheduled"
      ) {
        onEventRef.current?.(data.event);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div
      className={["cal-embed", className].filter(Boolean).join(" ")}
      data-status={status}
      style={height ? ({ "--cal-h": `${height}px` } as React.CSSProperties) : undefined}
    >
      <div ref={hostRef} className="cal-embed__host" />
      {status !== "ready" && status !== "error" && (
        <div className="cal-embed__loading" aria-hidden="true">
          <span className="cal-embed__dot" />
          <span className="cal-embed__dot" />
          <span className="cal-embed__dot" />
        </div>
      )}
      {status === "error" && <div className="cal-embed__error">{fallback}</div>}
    </div>
  );
}

export default CalendlyEmbed;
