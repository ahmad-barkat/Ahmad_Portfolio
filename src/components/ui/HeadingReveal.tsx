"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Ensure ScrollTrigger is registered safely on client
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface HeadingRevealProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
  scrollTrigger?: boolean;
  scrollStart?: string;
  immediate?: boolean;
  /** Only hide the letters; a parent's timeline reveals them (`.hr-reveal-char`) */
  manual?: boolean;
  id?: string;
}

/**
 * HeadingReveal
 * =============
 * Signature Willem-style letter-by-letter reveal animation.
 * Follows gsap-guidance (gsap.context cleanup) & frontend-design (responsive word wrapping).
 */
export function HeadingReveal({
  children,
  as: Tag = "h2",
  className = "",
  style = {},
  duration = 1.25,
  stagger = 0.025,
  delay = 0,
  ease = "expo.out",
  scrollTrigger = true,
  scrollStart = "top 88%",
  immediate = false,
  manual = false,
  id,
}: HeadingRevealProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Strict GSAP context cleanup per gsap-guidance
    const ctx = gsap.context(() => {
      const letters = el.querySelectorAll<HTMLElement>(".hr-reveal-char");
      if (!letters.length) return;

      // Set initial hidden state
      gsap.set(letters, { yPercent: 100 });
      if (manual) return;

      const playReveal = () => {
        gsap.to(letters, {
          yPercent: 0,
          duration,
          stagger,
          delay,
          ease,
          overwrite: "auto",
        });
      };

      if (immediate) {
        playReveal();
      } else if (scrollTrigger) {
        ScrollTrigger.create({
          trigger: el,
          start: scrollStart,
          once: true,
          onEnter: playReveal,
        });
      } else {
        playReveal();
      }
    }, el);

    return () => ctx.revert();
  }, [duration, stagger, delay, ease, scrollTrigger, scrollStart, immediate, manual]);

  // Recursively process children into word/letter spans while preserving line breaks and tags
  const renderTokens = (node: React.ReactNode, keyPrefix = ""): React.ReactNode => {
    if (typeof node === "string") {
      // Split by line breaks first
      const lines = node.split(/(\r\n|\n)/);
      return lines.map((line, lIdx) => {
        if (line === "\n" || line === "\r\n") {
          return <br key={`${keyPrefix}-br-${lIdx}`} />;
        }
        if (!line) return null;

        // Split line into words
        const words = line.split(" ");
        return words.map((word, wIdx) => {
          if (!word && wIdx < words.length - 1) {
            return " ";
          }
          return (
            <span
              key={`${keyPrefix}-w-${lIdx}-${wIdx}`}
              style={{ display: "inline-block", whiteSpace: "nowrap" }}
            >
              {Array.from(word).map((char, cIdx) => (
                <span
                  key={`${keyPrefix}-c-${lIdx}-${wIdx}-${cIdx}`}
                  style={{
                    display: "inline-block",
                    overflow: "hidden",
                    verticalAlign: "bottom",
                    lineHeight: "1.1",
                  }}
                >
                  <span
                    className="hr-reveal-char"
                    style={{
                      display: "inline-block",
                      position: "relative",
                      willChange: "transform",
                    }}
                  >
                    {char}
                  </span>
                </span>
              ))}
              {wIdx < words.length - 1 ? (
                <span style={{ display: "inline-block" }}>&nbsp;</span>
              ) : null}
            </span>
          );
        });
      });
    }

    if (React.isValidElement(node)) {
      // If it's a <br>, preserve it
      if (node.type === "br") {
        return node;
      }
      // Recursively process nested elements (like <span>, <strong>, etc.)
      const children = (node.props as { children?: React.ReactNode })?.children;
      return React.cloneElement(
        node,
        { key: keyPrefix },
        renderTokens(children, `${keyPrefix}-child`)
      );
    }

    if (Array.isArray(node)) {
      return node.map((item, idx) => renderTokens(item, `${keyPrefix}-${idx}`));
    }

    return node;
  };

  return React.createElement(
    Tag,
    {
      ref: containerRef,
      className: className,
      style: { ...style },
      id: id,
    },
    renderTokens(children, "hr")
  );
}

export default HeadingReveal;
