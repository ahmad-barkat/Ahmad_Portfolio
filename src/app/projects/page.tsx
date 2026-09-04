"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { usePageTransition } from "@/components/ui/TransitionProvider";

gsap.registerPlugin(useGSAP);

const FEATURED_PROJECTS = [
  {
    title: "Interactive Story Portfolio",
    tech: ["Next.js", "GSAP", "Lenis", "Tailwind"],
    desc: "A luxury dark emerald portfolio experience featuring 3D laptop scroll animations and custom page transitions.",
  },
  {
    title: "Enterprise Web Architecture",
    tech: ["TypeScript", "React", "Node.js", "Tailwind"],
    desc: "Scalable frontend and backend systems engineered for speed, high concurrency, and seamless UI/UX.",
  },
];

export default function ProjectsPage() {
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
      ".projects-bg-watermark",
      { scale: 1.12, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.2 }
    );

    // Back button & label entrance
    tl.fromTo(
      [backBtnRef.current, ".projects-top-label"],
      { x: -30, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1 },
      "-=0.8"
    );

    // Headline staggered lines
    tl.fromTo(
      ".projects-headline-text span",
      { y: 50, autoAlpha: 0, skewY: 3 },
      { y: 0, autoAlpha: 1, skewY: 0, duration: 0.9, stagger: 0.12 },
      "-=0.5"
    );

    // Featured project cards entrance
    tl.fromTo(
      ".project-card",
      { y: 40, autoAlpha: 0, scale: 0.95 },
      { y: 0, autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.15 },
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
          background: "radial-gradient(circle at 25% 45%, rgba(82, 183, 136, 0.12) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Giant background heading */}
      <h1
        className="projects-bg-watermark"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "clamp(5rem, 22vw, 18rem)",
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
        PROJECTS
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
          className="projects-top-label"
          style={{
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: "clamp(0.9rem, 2vw, 1.4rem)",
            fontWeight: 900,
            color: "rgba(82, 183, 136, 0.4)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          CHAPTER // 04 — PROJECTS
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
        {/* Left Column: Featured Project Cards */}
        <div
          style={{
            maxWidth: "clamp(300px, 36vw, 480px)",
            display: "flex",
            flexDirection: "column",
            gap: "1.2rem",
            flexShrink: 0,
          }}
        >
          {FEATURED_PROJECTS.map((proj) => (
            <div
              key={proj.title}
              className="project-card"
              style={{
                background: "rgba(13, 43, 32, 0.65)",
                border: "1px solid rgba(82, 183, 136, 0.25)",
                borderRadius: 14,
                padding: "1.4rem 1.6rem",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
                transition: "border-color 0.3s ease, background-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                const card = e.currentTarget;
                card.style.borderColor = "rgba(82, 183, 136, 0.65)";
                card.style.backgroundColor = "rgba(16, 52, 38, 0.8)";
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget;
                card.style.borderColor = "rgba(82, 183, 136, 0.25)";
                card.style.backgroundColor = "rgba(13, 43, 32, 0.65)";
              }}
            >
              <h3
                style={{
                  fontFamily: "'Arial Black', sans-serif",
                  fontSize: "clamp(1rem, 1.8vw, 1.3rem)",
                  color: "#F0EDE8",
                  margin: "0 0 0.5rem 0",
                  letterSpacing: "-0.01em",
                }}
              >
                {proj.title}
              </h3>
              <p
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "clamp(0.75rem, 1.2vw, 0.88rem)",
                  color: "rgba(240, 237, 232, 0.75)",
                  lineHeight: 1.5,
                  margin: "0 0 1rem 0",
                }}
              >
                {proj.desc}
              </p>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {proj.tech.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontFamily: "system-ui, monospace",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "#52B788",
                      background: "rgba(82, 183, 136, 0.12)",
                      border: "1px solid rgba(82, 183, 136, 0.3)",
                      padding: "0.2em 0.6em",
                      borderRadius: 4,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Staggered Headline Quote */}
        <div style={{ textAlign: "right", flex: 1 }}>
          <h2
            className="projects-headline-text"
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
            <span style={{ display: "block" }}>BUILD</span>
            <span style={{ display: "block", color: "#52B788" }}>THINGS THAT</span>
            <span style={{ display: "block", color: "#74C69D" }}>MATTER.</span>
          </h2>
        </div>
      </div>
    </main>
  );
}
