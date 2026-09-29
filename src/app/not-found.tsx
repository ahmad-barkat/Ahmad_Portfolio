"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { usePageTransition } from "@/components/ui/TransitionProvider";
import { CinematicFooter } from "@/components/ui/motion-footer";

gsap.registerPlugin(useGSAP);

export default function NotFound() {
  const { transitionTo } = usePageTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      ".notfound-watermark",
      { scale: 1.15, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.2 }
    );

    tl.fromTo(
      [".notfound-badge", ".notfound-title", ".notfound-desc", ".notfound-actions"],
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1 },
      "-=0.8"
    );
  }, { scope: containerRef });

  return (
    <>
    {/* A full-screen panel in the flow, so the footer can follow it */}
    <main
      ref={containerRef}
      style={{
        position: "relative",
        height: "100svh",
        backgroundColor: "#0B3D91",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        color: "#E8F6FF",
        zIndex: 999,
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(59, 167, 242, 0.12) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Giant 404 Watermark */}
      <h1
        className="notfound-watermark"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "clamp(8rem, 30vw, 26rem)",
          fontWeight: 900,
          fontFamily: "'Arial Black', sans-serif",
          WebkitTextStroke: "1.5px rgba(59, 167, 242, 0.08)",
          color: "transparent",
          pointerEvents: "none",
          userSelect: "none",
          margin: 0,
        }}
      >
        404
      </h1>

      {/* Main Content */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 1.5rem" }}>
        <span
          className="notfound-badge"
          style={{
            display: "inline-block",
            fontFamily: "system-ui, monospace",
            fontSize: "clamp(0.68rem, 1.2vw, 0.8rem)",
            fontWeight: 700,
            color: "#3BA7F2",
            background: "rgba(59, 167, 242, 0.15)",
            border: "1px solid rgba(59, 167, 242, 0.3)",
            padding: "0.3em 0.8em",
            borderRadius: 6,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          ERROR // 404 — LOST IN DIMENSION
        </span>

        <h2
          className="notfound-title"
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: "clamp(2rem, 5vw, 4.2rem)",
            fontWeight: 900,
            color: "#E8F6FF",
            margin: "0 0 0.8rem 0",
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          PAGE NOT FOUND
        </h2>

        <p
          className="notfound-desc"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "clamp(0.85rem, 1.4vw, 1.05rem)",
            color: "rgba(232, 246, 255, 0.7)",
            maxWidth: "460px",
            margin: "0 auto 2rem auto",
            lineHeight: 1.6,
          }}
        >
          The page you requested could not be located in this dimension. It may have been moved or renamed.
        </p>

        {/* Action Buttons */}
        <div
          className="notfound-actions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={(e) => transitionTo("/home", e.currentTarget, "#0B3D91", "HOME")}
            style={{
              background: "#3BA7F2",
              color: "#0B3D91",
              border: "none",
              borderRadius: 8,
              fontFamily: "system-ui, sans-serif",
              fontSize: "clamp(0.75rem, 1.2vw, 0.88rem)",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "0.8rem 1.6rem",
              cursor: "pointer",
              transition: "opacity 0.25s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            RETURN HOME
          </button>

          <button
            onClick={(e) => transitionTo("/", e.currentTarget, "#0B3D91", "NAV")}
            style={{
              background: "rgba(15, 74, 163, 0.7)",
              color: "#3BA7F2",
              border: "1px solid rgba(59, 167, 242, 0.3)",
              borderRadius: 8,
              fontFamily: "system-ui, sans-serif",
              fontSize: "clamp(0.75rem, 1.2vw, 0.88rem)",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "0.8rem 1.6rem",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "border-color 0.25s ease, color 0.25s ease",
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
            OPEN NAVIGATION
          </button>
        </div>
      </div>
    </main>

    {/* Footer // curtain reveal with the closing call to action */}
    <CinematicFooter />
    </>
  );
}
