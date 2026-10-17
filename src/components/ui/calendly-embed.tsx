"use client";

import React, { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

import { ButtonWithIcon } from "@/components/ui/button-with-icon";

const ORIGINS = ["https://calendly.com", "https://assets.calendly.com"];

/** Opens the connections to Calendly early (once), so the calendar starts
 *  faster when it is asked for */
let warmed = false;
function warmCalendly() {
  if (warmed) return;
  warmed = true;
  for (const href of ORIGINS) {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    link.crossOrigin = "";
    document.head.appendChild(link);
  }
}

/** The calendar's frame address: the same query Calendly's widget script
 *  builds, so the frame posts its height and events, without loading the script */
function frameSrc(url: string) {
  const u = new URL(url);
  u.searchParams.set("embed_domain", window.location.host);
  u.searchParams.set("embed_type", "Inline");
  return u.toString();
}

type CalendlyEvent = "calendly.event_type_viewed" | "calendly.date_and_time_selected" | "calendly.event_scheduled";

/**
 * Calendly's inline booking calendar, loaded on request.
 *
 *   - Nothing from Calendly loads until the visitor presses "Show available
 *     times", so the page never pays for it. Connections are opened early when
 *     the section comes near and when the button is hovered or focused.
 *   - The frame is added directly (no widget script) and takes the calendar's
 *     own height (Calendly posts it on every step), so it never scrolls inside.
 *   - `onEvent` hears when a slot is picked and when a call is booked.
 */
export function CalendlyEmbed({
  url,
  title = "Book a call",
  className,
  onEvent,
  fallback,
  heading = "30-minute video call",
  note = "Free. Times show in your own time zone.",
}: {
  url: string;
  title?: string;
  className?: string;
  onEvent?: (event: CalendlyEvent) => void;
  /** Shown if the calendar can't load (blocked by the browser, offline) */
  fallback?: React.ReactNode;
  heading?: string;
  note?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"closed" | "loading" | "ready" | "error">("closed");
  const [height, setHeight] = useState<number | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Open the connections when the section is within a screen
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        warmCalendly();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Should Calendly never say it has drawn, show the frame anyway; if the
  // frame never loads at all, offer the link instead
  useEffect(() => {
    if (status !== "loading") return;
    const t = window.setTimeout(() => setStatus((s) => (s === "loading" ? "error" : s)), 20000);
    return () => window.clearTimeout(t);
  }, [status]);

  // Messages from this calendar only: its height, and what the visitor did
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!/^https:\/\/([a-z0-9-]+\.)*calendly\.com$/.test(e.origin)) return;
      const frame = frameRef.current;
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

  const open = () => {
    warmCalendly();
    setSrc(frameSrc(url));
    setStatus("loading");
    // The button goes away: keep keyboard focus here, not on the page body
    rootRef.current?.focus({ preventScroll: true });
  };

  const onFrameLoad = () => {
    window.setTimeout(() => setStatus((s) => (s === "loading" ? "ready" : s)), 4000);
  };

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className={["cal-embed", className].filter(Boolean).join(" ")}
      data-status={status}
      style={height ? ({ "--cal-h": `${height}px` } as React.CSSProperties) : undefined}
    >
      {status === "closed" ? (
        <div className="cal-embed__gate">
          <span className="cal-embed__icon" aria-hidden="true">
            <CalendarDays strokeWidth={1.5} />
          </span>
          <div className="cal-embed__copy">
            <p className="cal-embed__title">{heading}</p>
            <p className="cal-embed__note">{note}</p>
          </div>
          <ButtonWithIcon type="button" onClick={open} onPointerEnter={warmCalendly} onFocus={warmCalendly}>
            Show available times
          </ButtonWithIcon>
        </div>
      ) : (
        <>
          {src && status !== "error" && (
            <iframe
              ref={frameRef}
              className="cal-embed__frame"
              src={src}
              title={title}
              onLoad={onFrameLoad}
            />
          )}
          {status === "loading" && (
            <div className="cal-embed__loading" role="status">
              <span className="sr-only">Loading the calendar</span>
              <span className="cal-embed__dot" aria-hidden="true" />
              <span className="cal-embed__dot" aria-hidden="true" />
              <span className="cal-embed__dot" aria-hidden="true" />
            </div>
          )}
          {status === "error" && <div className="cal-embed__error">{fallback}</div>}
        </>
      )}
    </div>
  );
}

export default CalendlyEmbed;
