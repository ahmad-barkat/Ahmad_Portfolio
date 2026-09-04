"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { usePageTransition } from "@/components/ui/TransitionProvider";

gsap.registerPlugin(useGSAP);

export default function AboutPage() {
  const { transitionTo } = usePageTransition();
  const pageRef = useRef<HTMLDivElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);

  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    transitionTo("/nav", e.currentTarget, "#081C15", "NAV");
  };

  // ── Entrance Animation ────────────────────────────────────────────────────
  useGSAP(() => {
    if (!pageRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Watermark entrance
    tl.fromTo(
      ".about-bg-watermark",
      { scale: 1.12, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.2 }
    );

    // Back button & top label
    tl.fromTo(
      [backBtnRef.current, ".about-top-label"],
      { x: -30, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1 },
      "-=0.8"
    );

    // Headline quote staggered lines
    tl.fromTo(
      ".about-headline-text span",
      { y: 50, autoAlpha: 0, skewY: 3 },
      { y: 0, autoAlpha: 1, skewY: 0, duration: 0.9, stagger: 0.12 },
      "-=0.5"
    );

    // Description & skill cards
    tl.fromTo(
      [".about-desc-text", ".about-skill-card"],
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1 },
      "-=0.4"
    );
  }, { scope: pageRef });

  return (
    <main
      ref={pageRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#081C15",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#F0EDE8",
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 75% 30%, rgba(82, 183, 136, 0.12) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Giant background heading */}
      <h1
        className="about-bg-watermark"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "clamp(6rem, 24vw, 20rem)",
          fontWeight: 900,
          fontFamily: "'Arial Black', sans-serif",
          WebkitTextStroke: "1.5px rgba(82, 183, 136, 0.08)",
          color: "transparent",
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "0.05em",
          margin: 0,
        }}
      >
        ABOUT
      </h1>

      {/* Top Bar: Back button + Section Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "clamp(1.5rem, 4vh, 2.5rem) clamp(1.5rem, 5vw, 4rem)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Back button */}
        <button
          ref={backBtnRef}
          onClick={handleBackClick}
          style={{
            background: "rgba(13, 43, 32, 0.7)",
            border: "1px solid rgba(82, 183, 136, 0.3)",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "system-ui, sans-serif",
            fontSize: "clamp(0.68rem, 1.2vw, 0.8rem)",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#52B788",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.6rem 1.2rem",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget;
            btn.style.borderColor = "rgba(82, 183, 136, 0.7)";
            btn.style.color = "#F0EDE8";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget;
            btn.style.borderColor = "rgba(82, 183, 136, 0.3)";
            btn.style.color = "#52B788";
          }}
        >
          <svg width="18" height="10" viewBox="0 0 20 10" fill="none">
            <path
              d="M19 5H1M1 5L5 1M1 5L5 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          BACK TO NAV
        </button>

        {/* Section label */}
        <div
          className="about-top-label"
          style={{
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: "clamp(0.9rem, 2vw, 1.4rem)",
            fontWeight: 900,
            color: "rgba(82, 183, 136, 0.4)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          CHAPTER // 03 — ABOUT
        </div>
      </div>

      {/* Main Content Body */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 clamp(1.5rem, 5vw, 4rem) clamp(2.5rem, 7vh, 5rem)",
          height: "100%",
          gap: "clamp(2rem, 5vw, 4rem)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left Column: Paragraph & Core Strengths */}
        <div
          style={{
            maxWidth: "clamp(280px, 32vw, 420px)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            flexShrink: 0,
          }}
        >
          <p
            className="about-desc-text"
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "clamp(0.85rem, 1.4vw, 1.05rem)",
              color: "rgba(240, 237, 232, 0.85)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            A software engineer driven by curiosity, design thinking, and clean architecture. Building high-performance web applications that bridge code precision with visual excellence.
          </p>

          {/* Skill Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
            }}
          >
            {["Next.js", "TypeScript", "GSAP & WebGL", "UI Architecture", "Node.js"].map((skill) => (
              <span
                key={skill}
                className="about-skill-card"
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "clamp(0.65rem, 1vw, 0.78rem)",
                  fontWeight: 600,
                  color: "#52B788",
                  background: "rgba(13, 43, 32, 0.8)",
                  border: "1px solid rgba(82, 183, 136, 0.25)",
                  padding: "0.4em 0.9em",
                  borderRadius: 20,
                  backdropFilter: "blur(8px)",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Right Column: Staggered Headline Quote */}
        <div style={{ textAlign: "right", flex: 1 }}>
          <h2
            className="about-headline-text"
            style={{
              fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
              fontSize: "clamp(3rem, 8.5vw, 8.5rem)",
              fontWeight: 900,
              color: "#F0EDE8",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            <span style={{ display: "block" }}>CODE IS</span>
            <span style={{ display: "block", color: "#52B788" }}>A CRAFT,</span>
            <span style={{ display: "block" }}>NOT JUST</span>
            <span style={{ display: "block", color: "#74C69D" }}>A SKILL.</span>
          </h2>
        </div>
      </div>
    </main>
  );
}
