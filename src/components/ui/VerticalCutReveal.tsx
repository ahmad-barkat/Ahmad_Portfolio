"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface VerticalCutRevealProps {
  children: string;
  splitBy?: "characters" | "words" | "lines";
  staggerDuration?: number;
  staggerFrom?: "start" | "end" | "center" | "random";
  className?: string;
  triggerStart?: string;
}

export function VerticalCutReveal({
  children,
  splitBy = "characters",
  staggerDuration = 0.04,
  staggerFrom = "center",
  className = "",
  triggerStart = "top 85%",
}: VerticalCutRevealProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const units = el.querySelectorAll(".vcr-unit");
    if (!units.length) return;

    gsap.set(units, { yPercent: 110 });

    const anim = gsap.to(units, {
      yPercent: 0,
      duration: 0.65,
      ease: "power3.out",
      stagger: {
        amount: staggerDuration * units.length,
        from: staggerFrom,
      },
      scrollTrigger: {
        trigger: el,
        start: triggerStart,
        toggleActions: "play none none none",
      },
    });

    return () => {
      anim.kill();
      ScrollTrigger.getAll()
        .filter((t) => t.vars.trigger === el)
        .forEach((t) => t.kill());
    };
  }, [staggerDuration, staggerFrom, triggerStart, children]);

  if (splitBy === "words") {
    const words = children.split(" ");
    return (
      <span ref={wrapRef} className={`vcr-root ${className}`}>
        {words.map((word, i) => (
          <span key={i} className="vcr-clip" style={{ display: "inline-block", overflow: "hidden" }}>
            <span className="vcr-unit vcr-word-wrap" style={{ display: "inline-block" }}>
              {word}
            </span>
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        ))}
      </span>
    );
  }

  // Default: characters
  const chars = Array.from(children);
  return (
    <span ref={wrapRef} className={`vcr-root ${className}`}>
      {chars.map((char, i) => (
        <span key={i} className="vcr-clip" style={{ display: "inline-block", overflow: "hidden" }}>
          <span className="vcr-unit vcr-char-wrap" style={{ display: "inline-block" }}>
            {char === " " ? "\u00A0" : char}
          </span>
        </span>
      ))}
    </span>
  );
}
