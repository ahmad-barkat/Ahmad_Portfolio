"use client";

/**
 * FlipTextReveal — 3D rotateX character flip animation
 * Each character flips up from below with an elastic bounce.
 * Trigger: ScrollTrigger (fires when element enters viewport).
 * Based on the cnippet flip-text pattern, rebuilt without styled-jsx.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface FlipTextRevealProps {
  word: string;
  className?: string;
  /** Delay between each character in seconds */
  staggerDelay?: number;
  /** Auto-replay when scrolled back into view */
  replay?: boolean;
  /** CSS color for the text */
  color?: string;
}

export default function FlipTextReveal({
  word,
  className = "",
  staggerDelay = 0.06,
  replay = false,
  color = "#D8F3DC",
}: FlipTextRevealProps) {
  const rootRef  = useRef<HTMLDivElement>(null);
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [chars]  = useState(() => word.split(""));

  const animate = useCallback(() => {
    const els = charsRef.current.filter(Boolean) as HTMLSpanElement[];
    if (!els.length) return;

    // Reset
    gsap.set(els, { opacity: 0, rotateX: -90, y: 40 });

    // Flip each char up with elastic bounce
    gsap.to(els, {
      opacity: 1,
      rotateX: 0,
      y: 0,
      duration: 0.8,
      ease: "back.out(1.6)",
      stagger: staggerDelay,
      clearProps: "transform",
    });
  }, [staggerDelay]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const st = ScrollTrigger.create({
      trigger: root,
      start: "top 85%",
      onEnter: animate,
      onEnterBack: replay ? animate : undefined,
    });

    return () => st.kill();
  }, [animate, replay]);

  return (
    <div
      ref={rootRef}
      className={`flip-reveal-root ${className}`}
      aria-label={word}
      style={{ perspective: "800px", display: "inline-block" }}
    >
      <span
        className="flip-reveal-inner"
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          justifyContent: "center",
          transformStyle: "preserve-3d",
        }}
      >
        {chars.map((char, i) => (
          <span
            key={i}
            ref={el => { charsRef.current[i] = el; }}
            style={{
              display:         "inline-block",
              transformOrigin: "bottom center",
              opacity:         0,
              color,
              fontFamily:      "inherit",
              fontSize:        "inherit",
              fontWeight:      "inherit",
              letterSpacing:   "inherit",
              willChange:      "transform, opacity",
              whiteSpace:      char === " " ? "pre" : undefined,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    </div>
  );
}
