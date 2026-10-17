"use client";

import React, { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const STAGGER = 0.035;

/* The roll is a hover effect, and splitting every label into letters (twice)
   was a fifth of the home page's elements, built and laid out on phones that
   never hover. So the page arrives with each row as one block, which still
   rolls as a whole, and the letters are only split once a mouse moves or the
   keyboard is used: every roll on the page splits then, together. */
let split = false;
const listeners = new Set<() => void>();
let armed = false;
function arm() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const go = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("keydown", go);
    split = true;
    listeners.forEach((l) => l());
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse") go();
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("keydown", go, { passive: true });
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  arm();
  return () => listeners.delete(l);
};

/**
 * The letter roll: each letter slides up and out while its copy slides in
 * from below, one after another. Pure CSS (`.troll*` in globals.css), so the
 * roll can be set off by whatever box holds it, not only by the letters:
 *
 *   - hovering the text itself
 *   - hovering or focusing a `.ftr-link` (the whole link, icon included)
 *   - hovering or focusing any ancestor marked `data-roll` (a nav rectangle,
 *     a menu row) or a card that says so in CSS (the contact channel cards)
 *
 * Both rows of letters are hidden from screen readers and search engines,
 * which would read them one letter at a time; the label is given once, whole,
 * in a visually hidden span.
 */
export const TextRoll: React.FC<{
  children: string;
  className?: string;
  center?: boolean;
  style?: React.CSSProperties;
}> = ({ children, className, center = false, style }) => {
  const letters = useSyncExternalStore(subscribe, () => split, () => false);
  const chars = children.split("");
  const delay = (i: number) =>
    center ? STAGGER * Math.abs(i - (chars.length - 1) / 2) : STAGGER * i;

  const row = (which: "a" | "b") =>
    letters ? (
      chars.map((l, i) => (
        <span key={`${which}${i}`} className="troll__ch" style={{ "--d": `${delay(i).toFixed(3)}s` } as React.CSSProperties}>
          {l === " " ? " " : l}
        </span>
      ))
    ) : (
      <span className="troll__ch">{children}</span>
    );

  return (
    <span className={cn("troll relative block overflow-hidden", className)} style={{ lineHeight: 0.9, ...style }}>
      <span className="sr-only">{children}</span>
      <span className="troll__row troll__row--a" aria-hidden="true">
        {row("a")}
      </span>
      <span className="troll__row troll__row--b" aria-hidden="true">
        {row("b")}
      </span>
    </span>
  );
};
