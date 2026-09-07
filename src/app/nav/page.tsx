"use client";

import { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePageTransition } from "@/components/ui/TransitionProvider";
import { useNavHistory } from "@/hooks/useNavHistory";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// ─── Nav items matching website dark emerald theme ─────────────────────────────
const NAV_ITEMS = [
  {
    label: "HOME",
    idx: "01",
    color: "#52B788",
    textColor: "#F0EDE8",
    quote: "THE INTERACTIVE EXPERIENCE.",
    sub: "Interactive laptop story, 3D experience & developer timeline.",
    href: "/",
  },
  {
    label: "NAV",
    idx: "02",
    color: "#74C69D",
    textColor: "#F0EDE8",
    quote: "EXPERIENCE THE JOURNEY.",
    sub: "Central portfolio directory & interactive navigation menu.",
    href: "/nav",
  },
  {
    label: "ABOUT",
    idx: "03",
    color: "#95D5B2",
    textColor: "#F0EDE8",
    quote: "CODE IS A CRAFT, NOT JUST A SKILL.",
    sub: "A developer driven by curiosity, design thinking, and clean code.",
    href: "/about",
  },
  {
    label: "PROJECTS",
    idx: "04",
    color: "#40916C",
    textColor: "#F0EDE8",
    quote: "BUILD THINGS THAT MATTER.",
    sub: "High-impact web applications, side projects, & digital software.",
    href: "/projects",
  },
  {
    label: "CONTACT",
    idx: "05",
    color: "#B7E4C7",
    textColor: "#F0EDE8",
    quote: "LET'S BUILD SOMETHING TOGETHER.",
    sub: "Open to engineering roles, tech collaborations & conversations.",
    href: "/contact",
  },
];

export default function NavPage() {
  const { transitionTo } = usePageTransition();
  const { isCurrent, isVisited, pathname, visitedPages } = useNavHistory();
  const pageRef = useRef<HTMLDivElement>(null);

  // Section refs
  const navSectionRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const exploreCursorRef = useRef<HTMLDivElement>(null);
  const exploreMousePos = useRef({ x: 0, y: 0 });
  const exploreRaf = useRef<number | null>(null);

  // ── Custom EXPLORE cursor position tracking ───────────────────────────────
  useEffect(() => {
    const nav = navSectionRef.current;
    const cursor = exploreCursorRef.current;
    if (!nav || !cursor) return;

    const onMove = (e: MouseEvent) => {
      exploreMousePos.current = { x: e.clientX, y: e.clientY };
    };

    nav.addEventListener("mousemove", onMove);

    const loop = () => {
      exploreRaf.current = requestAnimationFrame(loop);
      const { x, y } = exploreMousePos.current;
      const cx = parseFloat(cursor.style.left || String(window.innerWidth / 2));
      const cy = parseFloat(cursor.style.top || String(window.innerHeight / 2));
      const nx = cx + (x - cx) * 0.14;
      const ny = cy + (y - cy) * 0.14;
      cursor.style.left = nx + "px";
      cursor.style.top = ny + "px";
    };
    exploreRaf.current = requestAnimationFrame(loop);

    return () => {
      nav.removeEventListener("mousemove", onMove);
      if (exploreRaf.current) cancelAnimationFrame(exploreRaf.current);
    };
  }, []);

  // ── Sequential alternating border entrance animation ───────────────────
  useGSAP(() => {
    if (!navSectionRef.current) return;

    // Immediately hide elements to guarantee a completely empty page for the first 0.5s
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const isRight = i % 2 === 0;
      gsap.set(bar, {
        xPercent: isRight ? 100 : -100,
        x: isRight ? 80 : -80,
        autoAlpha: 0,
      });
    });
    gsap.set(".nav-bg-watermark", { autoAlpha: 0, scale: 1.15 });
    gsap.set(".nav-footer-info", { autoAlpha: 0, y: 25 });

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Watermark appears subtly in the background during entrance
    tl.to(
      ".nav-bg-watermark",
      {
        autoAlpha: 1,
        scale: 1,
        duration: 2.0,
        ease: "power2.out",
      },
      0.4
    );

    // Initial 0.5s pause, then 1st link glides from right border, 2nd from left, etc.
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const isRight = i % 2 === 0; // 0: right (1st), 1: left (2nd), 2: right (3rd), 3: left (4th), 4: right (5th)
      const startTime = 0.5 + i * 0.28; // Sequential cadence after 0.5s initial pause

      // Outer card gliding in smoothly & efficiently from its attached screen border
      tl.to(
        bar,
        {
          xPercent: 0,
          x: 0,
          autoAlpha: 1,
          duration: 1.05,
          ease: "power4.out",
        },
        startTime
      );

      // Inner label smooth follow-through
      const label = bar.querySelector(".nav-bar-label");
      if (label) {
        tl.fromTo(
          label,
          { x: isRight ? 40 : -40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.9, ease: "power3.out" },
          startTime + 0.1
        );
      }

      // Inner badge reveal
      const badge = bar.querySelector(".nav-bar-badge");
      if (badge) {
        tl.fromTo(
          badge,
          { scale: 0.75, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.75, ease: "back.out(1.5)" },
          startTime + 0.15
        );
      }

      // Arrow indicator reveal
      const arrow = bar.querySelector(".nav-bar-arrow");
      if (arrow) {
        tl.fromTo(
          arrow,
          { x: isRight ? 25 : -25, opacity: 0 },
          { x: 0, opacity: 0.6, duration: 0.85, ease: "power3.out" },
          startTime + 0.2
        );
      }
    });

    // Bottom info entrance
    tl.to(
      ".nav-footer-info",
      {
        y: 0,
        autoAlpha: 1,
        duration: 1.1,
        ease: "power2.out",
      },
      0.5 + barRefs.current.length * 0.28 + 0.1
    );
  }, { scope: navSectionRef });

  // ── Bar hover effects ────────────────────────────────────────────────────
  const handleBarEnter = useCallback((i: number, itemColor: string) => {
    const bar = barRefs.current[i];
    if (!bar) return;

    gsap.to(bar, {
      borderColor: "rgba(82, 183, 136, 0.55)",
      backgroundColor: "rgba(14, 46, 34, 0.8)",
      duration: 0.25,
      ease: "power2.out",
    });

    const label = bar.querySelector(".nav-bar-label") as HTMLElement;
    const arrow = bar.querySelector(".nav-bar-arrow") as HTMLElement;
    const badge = bar.querySelector(".nav-bar-badge") as HTMLElement;

    if (label) gsap.to(label, { x: 12, color: itemColor, duration: 0.25, ease: "power2.out" });
    if (arrow) gsap.to(arrow, { x: 6, color: itemColor, opacity: 1, duration: 0.25, ease: "power2.out" });
    if (badge) gsap.to(badge, { backgroundColor: itemColor, color: "#081C15", duration: 0.25, ease: "power2.out" });
  }, []);

  const handleBarLeave = useCallback((i: number) => {
    const bar = barRefs.current[i];
    if (!bar) return;

    gsap.to(bar, {
      borderColor: "rgba(82, 183, 136, 0.2)",
      backgroundColor: "rgba(13, 43, 32, 0.65)",
      duration: 0.35,
      ease: "power2.out",
    });

    const label = bar.querySelector(".nav-bar-label") as HTMLElement;
    const arrow = bar.querySelector(".nav-bar-arrow") as HTMLElement;
    const badge = bar.querySelector(".nav-bar-badge") as HTMLElement;

    if (label) gsap.to(label, { x: 0, color: "#F0EDE8", duration: 0.3, ease: "power2.out" });
    if (arrow) gsap.to(arrow, { x: 0, color: "rgba(82, 183, 136, 0.4)", opacity: 0.6, duration: 0.3, ease: "power2.out" });
    if (badge) gsap.to(badge, { backgroundColor: "rgba(82, 183, 136, 0.15)", color: "#52B788", duration: 0.3, ease: "power2.out" });
  }, []);

  return (
    <div ref={pageRef} style={{ background: "#081C15", minHeight: "100vh", overflowX: "hidden", color: "#F0EDE8" }}>
      {/* Background Radial Glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at 50% 35%, rgba(82,183,136,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ═══════════════════════════════════════════════
          Nav bars section
      ═══════════════════════════════════════════════ */}
      <section
        ref={navSectionRef}
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          background: "#081C15",
          overflow: "hidden",
          paddingTop: "clamp(4.5rem, 11vh, 8rem)",
          paddingBottom: "clamp(5rem, 12vh, 9rem)",
          zIndex: 1,
        }}
      >
        {/* Giant background page heading */}
        <h1
          className="nav-bg-watermark"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "clamp(6rem, 26vw, 22rem)",
            fontWeight: 900,
            fontFamily: "'Arial Black', sans-serif",
            WebkitTextStroke: "1.5px rgba(82, 183, 136, 0.07)",
            color: "transparent",
            zIndex: 0,
            pointerEvents: "none",
            userSelect: "none",
            letterSpacing: "0.06em",
            margin: 0,
          }}
        >
          NAV
        </h1>

        {/* Nav bars list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(0.9rem, 2vh, 1.5rem)",
            position: "relative",
            zIndex: 2,
            width: "100%",
            padding: 0,
          }}
        >
          {NAV_ITEMS.map((item, i) => {
            const isRight = i % 2 === 0;
            const active = isCurrent(item.href);
            const visited = isVisited(item.href);

            return (
              <div
                key={item.label}
                ref={(el) => { barRefs.current[i] = el; }}
                className="nav-bar-item"
                style={{
                  marginLeft: isRight ? "auto" : 0,
                  marginRight: isRight ? 0 : "auto",
                  width: "clamp(78%, 86vw, 91%)",
                  maxWidth: 1300,
                  background: active ? "rgba(18, 56, 42, 0.85)" : "rgba(13, 43, 32, 0.7)",
                  border: active
                    ? `1.5px solid ${item.color}`
                    : "1.5px solid rgba(82, 183, 136, 0.22)",
                  borderRight: isRight ? "none" : active ? `1.5px solid ${item.color}` : "1.5px solid rgba(82, 183, 136, 0.22)",
                  borderLeft: isRight ? (active ? `1.5px solid ${item.color}` : "1.5px solid rgba(82, 183, 136, 0.22)") : "none",
                  borderRadius: isRight ? "24px 0 0 24px" : "0 24px 24px 0",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  padding: isRight
                    ? "clamp(1.2rem, 3vh, 1.8rem) clamp(2rem, 5vw, 4.5rem) clamp(1.2rem, 3vh, 1.8rem) clamp(1.8rem, 4vw, 3.5rem)"
                    : "clamp(1.2rem, 3vh, 1.8rem) clamp(1.8rem, 4vw, 3.5rem) clamp(1.2rem, 3vh, 1.8rem) clamp(2rem, 5vw, 4.5rem)",
                  cursor: "none",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: active
                    ? `0 0 30px ${item.color}33, ${isRight ? "-10px" : "10px"} 12px 32px rgba(0, 0, 0, 0.45)`
                    : isRight
                    ? "-10px 12px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(82, 183, 136, 0.15)"
                    : "10px 12px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(82, 183, 136, 0.15)",
                  willChange: "transform, border-color, box-shadow",
                  transition: "border-color 0.3s, background-color 0.3s, box-shadow 0.3s",
                }}
                onMouseEnter={() => {
                  handleBarEnter(i, item.color);
                  gsap.to(exploreCursorRef.current, { autoAlpha: 1, duration: 0.25 });
                }}
                onMouseLeave={() => {
                  handleBarLeave(i);
                  gsap.to(exploreCursorRef.current, { autoAlpha: 0, duration: 0.25 });
                }}
                onClick={(e) => {
                  e.preventDefault();
                  transitionTo(item.href, e.currentTarget, item.color, item.label);
                }}
              >
                {/* Accent strip on exposed edge */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: isRight ? 0 : "auto",
                    right: isRight ? "auto" : 0,
                    width: active ? 6 : 4,
                    background: item.color,
                    borderRadius: isRight ? "24px 0 0 24px" : "0 24px 24px 0",
                    boxShadow: active ? `0 0 12px ${item.color}` : "none",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1.5rem",
                  }}
                >
                  {/* Left content block */}
                  <div style={{ display: "flex", alignItems: "center", gap: "clamp(1rem, 2.5vw, 2rem)" }}>
                    {/* Index badge */}
                    <span
                      className="nav-bar-badge"
                      style={{
                        fontFamily: "system-ui, monospace",
                        fontSize: "clamp(0.65rem, 1vw, 0.8rem)",
                        fontWeight: 700,
                        color: active ? "#081C15" : "#52B788",
                        background: active ? item.color : "rgba(82, 183, 136, 0.15)",
                        border: "1px solid rgba(82, 183, 136, 0.3)",
                        padding: "0.3em 0.7em",
                        borderRadius: 6,
                        letterSpacing: "0.15em",
                        flexShrink: 0,
                        transition: "all 0.3s",
                      }}
                    >
                      {item.idx}
                    </span>

                    <div>
                      {/* Title & Status Row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                        <span
                          className="nav-bar-label"
                          style={{
                            display: "block",
                            fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
                            fontSize: "clamp(1.8rem, 4.5vw, 3.8rem)",
                            fontWeight: 900,
                            color: active ? item.color : "#F0EDE8",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.05,
                            textTransform: "uppercase",
                            userSelect: "none",
                            transition: "color 0.3s",
                          }}
                        >
                          {item.label}
                        </span>

                        {active ? (
                          <span
                            style={{
                              fontFamily: "system-ui, sans-serif",
                              fontSize: "clamp(0.58rem, 0.9vw, 0.72rem)",
                              fontWeight: 700,
                              letterSpacing: "0.12em",
                              color: "#081C15",
                              background: item.color,
                              padding: "0.25em 0.75em",
                              borderRadius: "999px",
                              textTransform: "uppercase",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4em",
                              boxShadow: `0 0 12px ${item.color}66`,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#081C15",
                                display: "inline-block",
                              }}
                            />
                            CURRENT PAGE
                          </span>
                        ) : visited ? (
                          <span
                            style={{
                              fontFamily: "system-ui, sans-serif",
                              fontSize: "clamp(0.55rem, 0.85vw, 0.68rem)",
                              fontWeight: 600,
                              letterSpacing: "0.1em",
                              color: "rgba(149, 213, 178, 0.9)",
                              background: "rgba(82, 183, 136, 0.12)",
                              border: "1px solid rgba(82, 183, 136, 0.25)",
                              padding: "0.2em 0.65em",
                              borderRadius: "999px",
                              textTransform: "uppercase",
                            }}
                          >
                            ✓ VISITED
                          </span>
                        ) : null}
                      </div>

                      {/* Sub description */}
                      <span
                        style={{
                          display: "block",
                          fontFamily: "system-ui, sans-serif",
                          fontSize: "clamp(0.68rem, 1.2vw, 0.85rem)",
                          color: "rgba(149, 213, 178, 0.75)",
                          marginTop: "0.35rem",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {item.sub}
                      </span>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div
                    className="nav-bar-arrow"
                    style={{
                      fontSize: "clamp(1.2rem, 2.5vw, 2rem)",
                      color: active ? item.color : "rgba(82, 183, 136, 0.4)",
                      flexShrink: 0,
                      transition: "color 0.3s, transform 0.3s",
                    }}
                  >
                    →
                  </div>
                </div>
              </div>
            );
          })}
        </div>



        {/* Bottom-right tagline */}
        <div
          className="nav-footer-info"
          style={{
            position: "absolute",
            bottom: "clamp(1.5rem, 4vh, 2.5rem)",
            right: "clamp(1.5rem, 4vw, 2.5rem)",
            textAlign: "right",
            zIndex: 2,
          }}
        >
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "clamp(0.65rem, 1.2vw, 0.82rem)",
              color: "rgba(240, 237, 232, 0.6)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Designing digital experiences,<br />
            one chapter at a time.
          </p>
        </div>

        {/* Custom EXPLORE cursor */}
        <div
          ref={exploreCursorRef}
          style={{
            position: "fixed",
            width: 70,
            height: 70,
            borderRadius: "50%",
            border: "1px solid rgba(82, 183, 136, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 9999,
            opacity: 0,
            visibility: "hidden",
            top: 0,
            left: 0,
            background: "rgba(8, 28, 21, 0.9)",
            backdropFilter: "blur(6px)",
            transform: "translate(-50%, -50%)",
          }}
        >
          <span
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#52B788",
              textTransform: "uppercase",
            }}
          >
            EXPLORE
          </span>
        </div>
      </section>

      {/* Footer with Legal Links */}
      <footer
        style={{
          position: "relative",
          zIndex: 10,
          borderTop: "1px solid rgba(82, 183, 136, 0.12)",
          padding: "1.2rem clamp(1.5rem, 5vw, 4rem)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.72rem",
            color: "rgba(240, 237, 232, 0.4)",
            letterSpacing: "0.05em",
          }}
        >
          © {new Date().getFullYear()} Muhammad Ahmad Barkat
        </span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.72rem",
                color: "rgba(82, 183, 136, 0.6)",
                textDecoration: "none",
                letterSpacing: "0.08em",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#52B788"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(82, 183, 136, 0.6)"; }}
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
