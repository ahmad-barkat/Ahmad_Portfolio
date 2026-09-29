"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { usePageTransition } from "@/components/ui/TransitionProvider";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { CinematicFooter } from "@/components/ui/motion-footer";

gsap.registerPlugin(useGSAP);

export default function PrivacyPage() {
  const { transitionTo } = usePageTransition();
  const pageRef = useRef<HTMLDivElement>(null);

  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    transitionTo("/", e.currentTarget, "#0B3D91", "NAV");
  };

  useGSAP(() => {
    if (!pageRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      ".privacy-watermark",
      { scale: 1.12, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.2 }
    );

    tl.fromTo(
      [".privacy-header", ".privacy-card"],
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12 },
      "-=0.8"
    );
  }, { scope: pageRef });

  return (
    <>
    <main
      ref={pageRef}
      style={{
        minHeight: "100vh",
        backgroundColor: "#0B3D91",
        color: "#E8F6FF",
        position: "relative",
        overflowX: "hidden",
        padding: "clamp(2rem, 5vh, 4rem) clamp(1.5rem, 5vw, 4rem)",
        // Sit clear of the docked nav tab
        paddingTop: "calc(clamp(2rem, 5vh, 4rem) + var(--nav-dock-clearance))",
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at 75% 25%, rgba(59, 167, 242, 0.1) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Watermark */}
      <h1
        className="privacy-watermark"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "clamp(6rem, 24vw, 20rem)",
          fontWeight: 900,
          fontFamily: "'Arial Black', sans-serif",
          WebkitTextStroke: "1.5px rgba(59, 167, 242, 0.07)",
          color: "transparent",
          pointerEvents: "none",
          userSelect: "none",
          margin: 0,
          zIndex: 0,
        }}
      >
        PRIVACY
      </h1>

      {/* Top Bar */}
      <div
        className="privacy-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "clamp(2rem, 5vh, 4rem)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <button
          onClick={handleBackClick}
          style={{
            background: "rgba(15, 74, 163, 0.7)",
            border: "1px solid rgba(59, 167, 242, 0.3)",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "system-ui, sans-serif",
            fontSize: "clamp(0.68rem, 1.2vw, 0.8rem)",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#3BA7F2",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.6rem 1.2rem",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(59, 167, 242, 0.7)";
            e.currentTarget.style.color = "#E8F6FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(59, 167, 242, 0.3)";
            e.currentTarget.style.color = "#3BA7F2";
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

        <div
          style={{
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: "clamp(0.9rem, 2vw, 1.4rem)",
            fontWeight: 900,
            color: "rgba(59, 167, 242, 0.4)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          LEGAL // PRIVACY POLICY
        </div>
      </div>

      {/* Main Legal Content Container */}
      <div
        className="privacy-card"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "850px",
          margin: "0 auto",
          background: "rgba(15, 74, 163, 0.65)",
          border: "1.5px solid rgba(59, 167, 242, 0.22)",
          borderRadius: 16,
          padding: "clamp(2rem, 5vw, 3.5rem)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        <h2
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900,
            color: "#E8F6FF",
            margin: "0 0 0.5rem 0",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
          }}
        >
          PRIVACY POLICY
        </h2>

        <p
          style={{
            fontFamily: "system-ui, monospace",
            fontSize: "0.75rem",
            color: "#3BA7F2",
            marginBottom: "2rem",
            letterSpacing: "0.1em",
          }}
        >
          LAST UPDATED: SEPTEMBER 2026 — AHMAD BARKAT
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.8rem",
            fontFamily: "system-ui, sans-serif",
            fontSize: "clamp(0.85rem, 1.3vw, 0.98rem)",
            color: "rgba(232, 246, 255, 0.85)",
            lineHeight: 1.7,
          }}
        >
          <section>
            <h3 style={{ color: "#3BA7F2", fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>1. Information Collection</h3>
            <p style={{ margin: 0 }}>
              This portfolio site does not collect personal identification data unless voluntarily submitted through the contact form or direct communication channels.
            </p>
          </section>

          <section>
            <h3 style={{ color: "#3BA7F2", fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>2. Analytics & Performance</h3>
            <p style={{ margin: 0 }}>
              Minimal, privacy-friendly telemetry (Web Vitals) may be used to analyze load performance, browser compatibility, and viewport responsiveness without tracking user identities.
            </p>
          </section>

          <section>
            <h3 style={{ color: "#3BA7F2", fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>3. Data Protection</h3>
            <p style={{ margin: 0 }}>
              Any correspondence sent via email or contact channels is kept confidential and strictly used to discuss software engineering opportunities or collaborations.
            </p>
          </section>
        </div>
      </div>
    </main>

    {/* Testimonials // client words drifting up in columns */}
    <TestimonialsSection background="#0B3D91" />

    {/* Footer // curtain reveal with the closing call to action */}
    <CinematicFooter />
    </>
  );
}
