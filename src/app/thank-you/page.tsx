"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { usePageTransition } from "@/components/ui/TransitionProvider";

gsap.registerPlugin(useGSAP);

export default function ThankYouPage() {
  const { transitionTo } = usePageTransition();
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!pageRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      ".thanks-watermark",
      { scale: 1.15, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.2 }
    );

    tl.fromTo(
      [".thanks-badge", ".thanks-title", ".thanks-desc", ".thanks-actions"],
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1 },
      "-=0.8"
    );
  }, { scope: pageRef });

  return (
    <main
      ref={pageRef}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#081C15",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        color: "#F0EDE8",
        zIndex: 999,
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(82, 183, 136, 0.12) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Watermark */}
      <h1
        className="thanks-watermark"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "clamp(5rem, 20vw, 18rem)",
          fontWeight: 900,
          fontFamily: "'Arial Black', sans-serif",
          WebkitTextStroke: "1.5px rgba(82, 183, 136, 0.08)",
          color: "transparent",
          pointerEvents: "none",
          userSelect: "none",
          margin: 0,
          whiteSpace: "nowrap",
        }}
      >
        THANK YOU
      </h1>

      {/* Main Content */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 1.5rem" }}>
        <span
          className="thanks-badge"
          style={{
            display: "inline-block",
            fontFamily: "system-ui, monospace",
            fontSize: "clamp(0.68rem, 1.2vw, 0.8rem)",
            fontWeight: 700,
            color: "#52B788",
            background: "rgba(82, 183, 136, 0.15)",
            border: "1px solid rgba(82, 183, 136, 0.3)",
            padding: "0.3em 0.8em",
            borderRadius: 6,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          CONFIRMATION // MESSAGE RECEIVED
        </span>

        <h2
          className="thanks-title"
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: "clamp(2rem, 5.5vw, 4.5rem)",
            fontWeight: 900,
            color: "#F0EDE8",
            margin: "0 0 0.8rem 0",
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          THANK YOU FOR REACHING OUT!
        </h2>

        <p
          className="thanks-desc"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "clamp(0.85rem, 1.4vw, 1.05rem)",
            color: "rgba(240, 237, 232, 0.75)",
            maxWidth: "480px",
            margin: "0 auto 2rem auto",
            lineHeight: 1.6,
          }}
        >
          Your message has been delivered. I appreciate you taking the time to connect and will get back to you promptly.
        </p>

        {/* Action Buttons */}
        <div
          className="thanks-actions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={(e) => transitionTo("/", e.currentTarget, "#081C15", "HOME")}
            style={{
              background: "#52B788",
              color: "#081C15",
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
            onClick={(e) => transitionTo("/projects", e.currentTarget, "#081C15", "PROJECTS")}
            style={{
              background: "rgba(13, 43, 32, 0.7)",
              color: "#52B788",
              border: "1px solid rgba(82, 183, 136, 0.3)",
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
              e.currentTarget.style.borderColor = "rgba(82, 183, 136, 0.7)";
              e.currentTarget.style.color = "#F0EDE8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(82, 183, 136, 0.3)";
              e.currentTarget.style.color = "#52B788";
            }}
          >
            EXPLORE PROJECTS
          </button>
        </div>
      </div>
    </main>
  );
}
