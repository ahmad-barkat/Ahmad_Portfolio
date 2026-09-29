import React from "react";
import { cn } from "@/lib/utils";

/**
 * The mark: an "A" built from two symbols a developer types all day.
 *
 *   ^  the legs are a caret: the "insert here" mark in code, pointing up
 *   _  the crossbar is a text cursor, floating free of the legs mid-type
 *
 * A for Ahmad, drawn as someone building with the cursor ready. The legs'
 * inner and outer edges run exactly parallel (slope 37/18) and the cursor
 * sits with an equal gap to each leg. Paths only, no font, so it renders the
 * same everywhere; the colours come from `currentColor` and --logo-cursor.
 */
export const LOGO_LEGS = "M6 42 24 5 42 42H34.5L24 20.4 13.5 42Z";
export const LOGO_CURSOR = { x: 18.9, y: 32.6, width: 10.2, height: 4.4, rx: 0.6 };

export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("logo-mark", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d={LOGO_LEGS} fill="currentColor" />
      <rect className="logo-mark__cursor" {...LOGO_CURSOR} fill="var(--logo-cursor, #7FE7D6)" />
    </svg>
  );
}

/** Mark plus wordmark, for the nav, the menu and the footer */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={cn("logo-lockup", className)}>
      <LogoMark />
      <span className="logo-lockup__word">AHMAD</span>
    </span>
  );
}

export default LogoMark;
