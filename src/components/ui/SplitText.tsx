"use client";

import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: string;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: string;
  tag?: string;
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete,
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts.status === "loaded") {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !text || !fontsLoaded) return;
    const el = containerRef.current;

    // Decide split granularity: chars takes priority, then words
    const byChars =
      splitType.includes("chars") || splitType.includes("char");

    // Build DOM
    el.innerHTML = "";
    const spans: HTMLSpanElement[] = [];

    if (byChars) {
      // Group characters by word to prevent word breaking
      const words = text.split(/(\s+)/);
      words.forEach((word) => {
        if (!word) return;
        if (/^\s+$/.test(word)) {
          const space = document.createElement("span");
          space.style.cssText = "display:inline-block;white-space:pre;";
          space.textContent = word;
          el.appendChild(space);
          return;
        }

        // Wrap word to prevent breaking
        const wordSpan = document.createElement("span");
        wordSpan.style.cssText = "display:inline-block;white-space:nowrap;";

        Array.from(word).forEach((char) => {
          const charSpan = document.createElement("span");
          charSpan.style.cssText = "display:inline-block;will-change:transform,opacity;";
          charSpan.textContent = char;
          wordSpan.appendChild(charSpan);
          spans.push(charSpan);
        });

        el.appendChild(wordSpan);
      });
    } else {
      const tokens = text.split(/(\s+)/);
      tokens.forEach((token) => {
        if (/^\s+$/.test(token)) {
          const space = document.createElement("span");
          space.style.cssText = "display:inline-block;white-space:pre;";
          space.textContent = token;
          el.appendChild(space);
          return;
        }
        const span = document.createElement("span");
        span.style.cssText = "display:inline-block;will-change:transform,opacity;";
        span.textContent = token;
        el.appendChild(span);
        spans.push(span);
      });
    }

    if (!spans.length) return;

    // Parse rootMargin to a ScrollTrigger start offset string
    const startPct = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
    const sign =
      marginValue === 0
        ? ""
        : marginValue < 0
          ? `-=${Math.abs(marginValue)}${marginUnit}`
          : `+=${marginValue}${marginUnit}`;
    const start = `top ${startPct}%${sign}`;

    gsap.set(spans, { ...from });

    const tween = gsap.to(spans, {
      ...to,
      duration,
      ease,
      stagger: delay / 1000,
      force3D: true,
      scrollTrigger: {
        trigger: el,
        start,
        once: true,
        fastScrollEnd: true,
      },
      onComplete: () => {
        onLetterAnimationComplete?.();
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill();
      });
      // Restore plain text so re-renders are clean
      el.textContent = text;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delay, duration, ease, splitType, threshold, rootMargin, fontsLoaded]);

  const style: React.CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: textAlign as React.CSSProperties["textAlign"],
    whiteSpace: "normal",
    wordWrap: "break-word",
    fontSize: "inherit",
    fontWeight: "inherit",
    fontFamily: "inherit",
    color: "inherit",
    lineHeight: "inherit",
    letterSpacing: "inherit",
  };

  return React.createElement(
    tag || "p",
    {
      ref: containerRef,
      className: `split-parent ${className}`,
      style,
    },
    text
  );
};

export default SplitText;
