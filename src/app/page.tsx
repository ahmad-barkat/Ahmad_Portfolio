"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePageTransition } from "@/components/ui/TransitionProvider";
import { useNavHistory } from "@/hooks/useNavHistory";
import { TextRoll } from "@/components/ui/TextRoll";
import WillemLoader from "@/components/ui/WillemLoader";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// ─── Nav items matching website dark emerald theme ─────────────────────────────
const NAV_ITEMS = [
  {
    label: "NAV",
    idx: "01",
    color: "#5FC7E4",
    textColor: "#E8F6FF",
    quote: "EXPERIENCE THE JOURNEY.",
    sub: "Central portfolio directory & interactive navigation menu.",
    href: "/",
  },
  {
    label: "HOME",
    idx: "02",
    color: "#3BA7F2",
    textColor: "#E8F6FF",
    quote: "CODE IS A CRAFT, NOT JUST A SKILL.",
    sub: "A developer driven by curiosity, design thinking, and clean code.",
    href: "/home",
  },
  {
    label: "PROJECTS",
    idx: "03",
    color: "#2E93E8",
    textColor: "#E8F6FF",
    quote: "BUILD THINGS THAT MATTER.",
    sub: "High-impact web applications, side projects, & digital software.",
    href: "/projects",
  },
  {
    label: "CONTACT",
    idx: "04",
    color: "#A5EEE2",
    textColor: "#E8F6FF",
    quote: "LET'S BUILD SOMETHING TOGETHER.",
    sub: "Open to engineering roles, tech collaborations & conversations.",
    href: "/contact",
  },
  {
    label: "STORY",
    idx: "05",
    color: "#7FE7D6",
    textColor: "#E8F6FF",
    quote: "THE INTERACTIVE EXPERIENCE.",
    sub: "Interactive laptop story, 3D experience & developer timeline.",
    href: "/story",
  },
];

/* Lead-in before the first rectangle flies in. Short on purpose — the arrival
   animation it used to wait for is now what triggers this timeline. */
const LEAD_IN = 0.15;

/**
 * The page's backdrop, kept in one place because the loader renders exactly the same
 * markup as its final panel — the curtain therefore opens onto the real page and the
 * hand-off has nothing left to redraw.
 */
function NavBackdrop({
  watermarkClassName,
  watermarkHidden = false,
  decorative = false,
}: {
  watermarkClassName?: string;
  watermarkHidden?: boolean;
  decorative?: boolean;
}) {
  return (
    <div
      aria-hidden={decorative || undefined}
      style={{
        position: "absolute",
        inset: 0,
        background: "#0B3D91",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 35%, rgba(59, 167, 242,0.1) 0%, transparent 70%)",
        }}
      />

      {/* Giant background page heading */}
      <h1
        className={watermarkClassName}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "clamp(6rem, 26vw, 22rem)",
          fontWeight: 900,
          fontFamily: "'Arial Black', sans-serif",
          WebkitTextStroke: "1.5px rgba(59, 167, 242, 0.07)",
          color: "transparent",
          userSelect: "none",
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
          // Pinned, not inherited: the loader renders this inside its wordmark, which
          // sets line-height .85, and a different box height would shift the glyphs.
          lineHeight: 1,
          margin: 0,
          ...(watermarkHidden ? { opacity: 0, visibility: "hidden" as const } : null),
        }}
      >
        NAV
      </h1>
    </div>
  );
}

export default function NavDirectoryPage() {
  const { transitionTo, isTransitioning } = usePageTransition();
  const { isCurrent, isVisited, pathname, visitedPages } = useNavHistory();
  const pageRef = useRef<HTMLDivElement>(null);

  // How the visitor got here, decided once on mount. Arriving from another page already
  // has the expanding-rectangle overlay as its intro, so the loader would be a second
  // curtain on top of the first; it only plays on a cold or direct entry to /nav.
  const [viaTransition] = useState(() => isTransitioning);
  const [showLoader, setShowLoader] = useState(() => !isTransitioning);
  const [entered, setEntered] = useState(false);

  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
    setEntered(true);
  }, []);

  // Coming through a transition: hold the rectangles until the overlay has slid away,
  // so the animation plays in front of the visitor rather than behind the curtain.
  useEffect(() => {
    if (entered || showLoader || isTransitioning) return;
    setEntered(true);
  }, [entered, showLoader, isTransitioning]);

  // Safety net — never strand the page empty if an overlay fails to settle
  useEffect(() => {
    if (!viaTransition || entered) return;
    const fallback = setTimeout(() => setEntered(true), 1800);
    return () => clearTimeout(fallback);
  }, [viaTransition, entered]);

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
    if (!navSectionRef.current || !entered) return;

    // Park everything off its own screen edge before the first frame is drawn
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const isRight = i % 2 === 0;
      gsap.set(bar, {
        xPercent: isRight ? 100 : -100,
        x: isRight ? 80 : -80,
        autoAlpha: 0,
      });
    });
    gsap.set(".nav-footer-info", { autoAlpha: 0, y: 25 });

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    if (viaTransition) {
      // Watermark appears subtly in the background during entrance
      gsap.set(".nav-bg-watermark", { autoAlpha: 0, scale: 1.15 });
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
    } else {
      // The loader already unveiled this exact backdrop — re-fading it would flicker
      gsap.set(".nav-bg-watermark", { autoAlpha: 1, scale: 1 });
    }

    // 1st link glides in from the right border, 2nd from the left, and so on
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const isRight = i % 2 === 0; // 0: right (1st), 1: left (2nd), 2: right (3rd), 3: left (4th), 4: right (5th)
      const startTime = LEAD_IN + i * 0.28; // Sequential cadence

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
      LEAD_IN + barRefs.current.length * 0.28 + 0.1
    );
  }, { scope: pageRef, dependencies: [entered, viaTransition] });

  // ── Bar hover effects ────────────────────────────────────────────────────
  const handleBarEnter = useCallback((i: number, itemColor: string) => {
    const bar = barRefs.current[i];
    if (!bar) return;

    gsap.to(bar, {
      borderColor: "rgba(59, 167, 242, 0.55)",
      backgroundColor: "rgba(16, 80, 171, 0.8)",
      duration: 0.25,
      ease: "power2.out",
    });

    const label = bar.querySelector(".nav-bar-label") as HTMLElement;
    const arrow = bar.querySelector(".nav-bar-arrow") as HTMLElement;
    const badge = bar.querySelector(".nav-bar-badge") as HTMLElement;

    if (label) gsap.to(label, { x: 12, color: itemColor, duration: 0.25, ease: "power2.out" });
    if (arrow) gsap.to(arrow, { x: 6, color: itemColor, opacity: 1, duration: 0.25, ease: "power2.out" });
    if (badge) gsap.to(badge, { backgroundColor: itemColor, color: "#0B3D91", duration: 0.25, ease: "power2.out" });
  }, []);

  const handleBarLeave = useCallback((i: number) => {
    const bar = barRefs.current[i];
    if (!bar) return;

    gsap.to(bar, {
      borderColor: "rgba(59, 167, 242, 0.2)",
      backgroundColor: "rgba(15, 74, 163, 0.65)",
      duration: 0.35,
      ease: "power2.out",
    });

    const label = bar.querySelector(".nav-bar-label") as HTMLElement;
    const arrow = bar.querySelector(".nav-bar-arrow") as HTMLElement;
    const badge = bar.querySelector(".nav-bar-badge") as HTMLElement;

    if (label) gsap.to(label, { x: 0, color: "#E8F6FF", duration: 0.3, ease: "power2.out" });
    if (arrow) gsap.to(arrow, { x: 0, color: "rgba(59, 167, 242, 0.4)", opacity: 0.6, duration: 0.3, ease: "power2.out" });
    if (badge) gsap.to(badge, { backgroundColor: "rgba(59, 167, 242, 0.15)", color: "#3BA7F2", duration: 0.3, ease: "power2.out" });
  }, []);

  return (
    <>
      {showLoader && (
        <WillemLoader
          onComplete={handleLoaderComplete}
          background="#0B3D91"
          color="#E8F6FF"
          finale={<NavBackdrop decorative />}
        />
      )}

      <div ref={pageRef} style={{ background: "#0B3D91", minHeight: "100vh", overflowX: "hidden", color: "#E8F6FF" }}>
      {/* Backdrop — the same layer the loader opens onto, pinned to the viewport */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <NavBackdrop watermarkClassName="nav-bg-watermark" watermarkHidden={viaTransition} />
      </div>

      {/* ═══════════════════════════════════════════════
          Nav bars section
      ═══════════════════════════════════════════════ */}
      <section
        ref={navSectionRef}
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          background: "transparent",
          overflow: "hidden",
          paddingTop: "clamp(4.5rem, 11vh, 8rem)",
          paddingBottom: "clamp(5rem, 12vh, 9rem)",
          zIndex: 1,
        }}
      >
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
                  background: active ? "rgba(18, 87, 181, 0.85)" : "rgba(15, 74, 163, 0.7)",
                  border: active
                    ? `1.5px solid ${item.color}`
                    : "1.5px solid rgba(59, 167, 242, 0.22)",
                  borderRight: isRight ? "none" : active ? `1.5px solid ${item.color}` : "1.5px solid rgba(59, 167, 242, 0.22)",
                  borderLeft: isRight ? (active ? `1.5px solid ${item.color}` : "1.5px solid rgba(59, 167, 242, 0.22)") : "none",
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
                    ? "-10px 12px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(59, 167, 242, 0.15)"
                    : "10px 12px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(59, 167, 242, 0.15)",
                  willChange: "transform, border-color, box-shadow",
                  transition: "border-color 0.3s, background-color 0.3s, box-shadow 0.3s",
                  // Revealed by the entrance timeline once the visitor is actually on the page
                  opacity: 0,
                  visibility: "hidden",
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
                        color: active ? "#0B3D91" : "#3BA7F2",
                        background: active ? item.color : "rgba(59, 167, 242, 0.15)",
                        border: "1px solid rgba(59, 167, 242, 0.3)",
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
                        <TextRoll
                          className="nav-bar-label"
                          style={{
                            fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
                            fontSize: "clamp(1.8rem, 4.5vw, 3.8rem)",
                            fontWeight: 900,
                            color: active ? item.color : "#E8F6FF",
                            letterSpacing: "-0.02em",
                            textTransform: "uppercase",
                            userSelect: "none",
                            transition: "color 0.3s",
                          }}
                        >
                          {item.label}
                        </TextRoll>

                        {active ? (
                          <span
                            style={{
                              fontFamily: "system-ui, sans-serif",
                              fontSize: "clamp(0.58rem, 0.9vw, 0.72rem)",
                              fontWeight: 700,
                              letterSpacing: "0.12em",
                              color: "#0B3D91",
                              background: item.color,
                              padding: "0.25em 0.75em",
                              borderRadius: "999px",
                              textTransform: "uppercase",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4em",
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#0B3D91",
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
                              color: "rgba(127, 231, 214, 0.9)",
                              background: "rgba(59, 167, 242, 0.12)",
                              border: "1px solid rgba(59, 167, 242, 0.25)",
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
                          color: "rgba(127, 231, 214, 0.75)",
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
                      color: active ? item.color : "rgba(59, 167, 242, 0.4)",
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
            opacity: 0,
            visibility: "hidden",
          }}
        >
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "clamp(0.65rem, 1.2vw, 0.82rem)",
              color: "rgba(232, 246, 255, 0.6)",
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
            border: "1px solid rgba(59, 167, 242, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 9999,
            opacity: 0,
            visibility: "hidden",
            top: 0,
            left: 0,
            background: "rgba(11, 61, 145, 0.9)",
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
              color: "#3BA7F2",
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
          borderTop: "1px solid rgba(59, 167, 242, 0.12)",
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
            color: "rgba(232, 246, 255, 0.4)",
            letterSpacing: "0.05em",
          }}
        >
          © {new Date().getFullYear()} AHMAD Barkat
        </span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.72rem",
                color: "rgba(59, 167, 242, 0.6)",
                textDecoration: "none",
                letterSpacing: "0.08em",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#3BA7F2"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(59, 167, 242, 0.6)"; }}
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
      </div>
    </>
  );
}
