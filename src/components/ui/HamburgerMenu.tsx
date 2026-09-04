"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { usePageTransition } from "./TransitionProvider";

// ── Nav items (mirrors nav/page.tsx) ──────────────────────────────────────────
const MENU_LINKS = [
  { label: "Home",     color: "#52B788", href: "/",         idx: "01" },
  { label: "Nav",      color: "#74C69D", href: "/nav",      idx: "02" },
  { label: "About",    color: "#95D5B2", href: "/about",    idx: "03" },
  { label: "Projects", color: "#40916C", href: "/projects", idx: "04" },
  { label: "Contact",  color: "#B7E4C7", href: "/contact",  idx: "05" },
];

export default function HamburgerMenu() {
  const { transitionTo } = usePageTransition();
  const [open, setOpen] = useState(false);

  // refs
  const overlayRef   = useRef<HTMLDivElement>(null);
  const linksRef     = useRef<(HTMLDivElement | null)[]>([]);
  const footerRef    = useRef<HTMLDivElement>(null);
  const barTopRef    = useRef<HTMLSpanElement>(null);
  const barMidRef    = useRef<HTMLSpanElement>(null);
  const barBotRef    = useRef<HTMLSpanElement>(null);

  // ── Close animation ───────────────────────────────────────────────────────
  const closeMenu = useCallback(() => {
    if (!overlayRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => setOpen(false),
    });

    tl.to(linksRef.current.filter(Boolean), {
      x: 60,
      autoAlpha: 0,
      duration: 0.35,
      stagger: 0.04,
      ease: "power2.in",
    });

    tl.to(overlayRef.current, {
      xPercent: 100,
      duration: 0.55,
      ease: "power4.in",
    }, "-=0.15");
  }, []);

  // ── Animate in when `open` flips to true ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (!overlayRef.current) return;

    gsap.set(overlayRef.current, { xPercent: 100, autoAlpha: 1 });
    gsap.set(linksRef.current.filter(Boolean), { x: -50, autoAlpha: 0 });
    gsap.set(footerRef.current, { autoAlpha: 0, y: 10 });

    const tl = gsap.timeline();

    tl.to(overlayRef.current, {
      xPercent: 0,
      duration: 0.65,
      ease: "power4.out",
    });

    tl.to(linksRef.current.filter(Boolean), {
      x: 0,
      autoAlpha: 1,
      duration: 0.5,
      stagger: 0.07,
      ease: "power3.out",
    }, "-=0.35");

    tl.to(footerRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out",
    }, "-=0.2");
  }, [open]);

  // ── Hamburger icon morph ──────────────────────────────────────────────────
  useEffect(() => {
    const top = barTopRef.current;
    const mid = barMidRef.current;
    const bot = barBotRef.current;
    if (!top || !mid || !bot) return;

    if (open) {
      gsap.to(top, { rotate: 45,  y: 7,  duration: 0.35, ease: "power3.out" });
      gsap.to(mid, { scaleX: 0, autoAlpha: 0, duration: 0.2 });
      gsap.to(bot, { rotate: -45, y: -7, duration: 0.35, ease: "power3.out" });
    } else {
      gsap.to(top, { rotate: 0, y: 0, duration: 0.35, ease: "power3.out" });
      gsap.to(mid, { scaleX: 1, autoAlpha: 1, duration: 0.35, ease: "power3.out" });
      gsap.to(bot, { rotate: 0, y: 0, duration: 0.35, ease: "power3.out" });
    }
  }, [open]);

  // ── Navigate to link ──────────────────────────────────────────────────────
  const handleLinkClick = useCallback(
    (href: string, color: string, label: string, el: HTMLElement) => {
      if (!overlayRef.current) return;
      const tl = gsap.timeline({
        onComplete: () => {
          setOpen(false);
          transitionTo(href, el, color, label.toUpperCase());
        },
      });
      tl.to(linksRef.current.filter(Boolean), {
        x: 40,
        autoAlpha: 0,
        duration: 0.25,
        stagger: 0.03,
        ease: "power2.in",
      });
      tl.to(overlayRef.current, {
        xPercent: 100,
        duration: 0.4,
        ease: "power4.in",
      }, "-=0.1");
    },
    [transitionTo],
  );

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  return (
    <>
      {/* ── Hamburger button ─────────────────────────────────────────────── */}
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => (open ? closeMenu() : setOpen(true))}
        style={{
          position: "fixed",
          top: "clamp(1.2rem, 3vh, 1.8rem)",
          right: "clamp(1.2rem, 3vw, 2rem)",
          zIndex: 1000001,
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(8,28,21,0.92)",
          border: "1.5px solid rgba(82,183,136,0.45)",
          borderRadius: 8,
          cursor: "pointer",
          padding: 0,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          transition: "border-color 0.25s ease, background-color 0.25s ease",
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.borderColor = "rgba(82,183,136,0.95)";
          btn.style.backgroundColor = "rgba(14,44,32,0.98)";
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.borderColor = "rgba(82,183,136,0.45)";
          btn.style.backgroundColor = "rgba(8,28,21,0.92)";
        }}
      >
        <div style={{ position: "relative", width: 22, height: 22 }}>
          <span
            ref={barTopRef}
            style={{
              position: "absolute",
              top: 3,
              left: 0,
              display: "block",
              width: 22,
              height: 2,
              background: "#52B788",
              borderRadius: 2,
              transformOrigin: "center center",
              boxShadow: "0 0 6px rgba(82,183,136,0.5)",
            }}
          />
          <span
            ref={barMidRef}
            style={{
              position: "absolute",
              top: 10,
              left: 0,
              display: "block",
              width: 22,
              height: 2,
              background: "#52B788",
              borderRadius: 2,
              transformOrigin: "center center",
              boxShadow: "0 0 6px rgba(82,183,136,0.5)",
            }}
          />
          <span
            ref={barBotRef}
            style={{
              position: "absolute",
              top: 17,
              left: 0,
              display: "block",
              width: 22,
              height: 2,
              background: "#52B788",
              borderRadius: 2,
              transformOrigin: "center center",
              boxShadow: "0 0 6px rgba(82,183,136,0.5)",
            }}
          />
        </div>
      </button>

      {/* ── Full-screen overlay menu ──────────────────────────────────────── */}
      {open && (
        <div
          ref={overlayRef}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000000,
            background: "#081C15",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "clamp(2rem, 6vh, 4rem) clamp(2rem, 7vw, 5rem)",
            overflow: "hidden",
          }}
        >
          {/* Decorative vertical line */}
          <div style={{
            position: "absolute",
            left: "clamp(2rem, 7vw, 5rem)",
            top: 0,
            bottom: 0,
            width: 1,
            background: "linear-gradient(to bottom, transparent, rgba(82,183,136,0.25) 20%, rgba(82,183,136,0.25) 80%, transparent)",
            pointerEvents: "none",
          }} />

          {/* Top bar: logo + close hint */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 2,
            paddingRight: "65px",
          }}>
            <span style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: "clamp(1rem, 2vw, 1.4rem)",
              fontWeight: 900,
              color: "#52B788",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              MAB
            </span>
            <span style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "clamp(0.55rem, 1vw, 0.7rem)",
              color: "rgba(82,183,136,0.5)",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}>
              Press ESC to close
            </span>
          </div>

          {/* Nav links */}
          <nav
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "clamp(0.1rem, 1vh, 0.5rem)",
              paddingLeft: "clamp(1.5rem, 4vw, 3rem)",
              position: "relative",
              zIndex: 2,
            }}
            aria-label="Main navigation"
          >
            {MENU_LINKS.map((link, i) => (
              <div
                key={link.label}
                ref={(el) => { linksRef.current[i] = el; }}
                role="button"
                tabIndex={0}
                onClick={(e) =>
                  handleLinkClick(link.href, link.color, link.label, e.currentTarget as HTMLElement)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleLinkClick(link.href, link.color, link.label, e.currentTarget as HTMLElement);
                }}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "clamp(0.8rem, 2vw, 1.5rem)",
                  cursor: "pointer",
                  padding: "clamp(0.4rem, 1vh, 0.75rem) 0",
                  borderBottom: "1px solid rgba(82,183,136,0.08)",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => {
                  const label = e.currentTarget.querySelector(".hb-label") as HTMLElement;
                  const dot   = e.currentTarget.querySelector(".hb-dot")   as HTMLElement;
                  if (label) gsap.to(label, { x: 12, color: link.color, duration: 0.25, ease: "power2.out" });
                  if (dot)   gsap.to(dot,   { scale: 1.6, background: link.color, duration: 0.25, ease: "power2.out" });
                }}
                onMouseLeave={(e) => {
                  const label = e.currentTarget.querySelector(".hb-label") as HTMLElement;
                  const dot   = e.currentTarget.querySelector(".hb-dot")   as HTMLElement;
                  if (label) gsap.to(label, { x: 0, color: "#f0ede8", duration: 0.3, ease: "power2.out" });
                  if (dot)   gsap.to(dot,   { scale: 1, background: "rgba(82,183,136,0.3)", duration: 0.3, ease: "power2.out" });
                }}
              >
                {/* Index number */}
                <span style={{
                  fontFamily: "system-ui, monospace",
                  fontSize: "clamp(0.55rem, 1vw, 0.7rem)",
                  color: "rgba(82,183,136,0.4)",
                  letterSpacing: "0.15em",
                  flexShrink: 0,
                  width: "2.5ch",
                }}>
                  {link.idx}
                </span>

                {/* Color dot */}
                <span
                  className="hb-dot"
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "rgba(82,183,136,0.3)",
                    flexShrink: 0,
                    marginBottom: "0.25em",
                  }}
                />

                {/* Label */}
                <span
                  className="hb-label"
                  style={{
                    fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: "clamp(2rem, 6.5vw, 6rem)",
                    fontWeight: 900,
                    color: "#f0ede8",
                    textTransform: "uppercase",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    display: "block",
                  }}
                >
                  {link.label}
                </span>

                {/* Arrow */}
                <span style={{
                  marginLeft: "auto",
                  fontSize: "clamp(0.9rem, 2vw, 1.3rem)",
                  color: "rgba(82,183,136,0.25)",
                  flexShrink: 0,
                }}>
                  →
                </span>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div
            ref={footerRef}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              zIndex: 2,
            }}
          >
            <span style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "clamp(0.55rem, 1vw, 0.68rem)",
              color: "rgba(82,183,136,0.35)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}>
              Muhammad Ahmad Barkat © 2026
            </span>
            <span style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "clamp(0.55rem, 1vw, 0.68rem)",
              color: "rgba(82,183,136,0.35)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}>
              Software Engineer
            </span>
          </div>

          {/* Decorative corner — bottom right */}
          <div style={{
            position: "absolute",
            bottom: "clamp(1rem, 3vh, 2rem)",
            right: "clamp(1rem, 3vw, 2rem)",
            width: 28,
            height: 28,
            borderBottom: "1px solid rgba(82,183,136,0.18)",
            borderRight: "1px solid rgba(82,183,136,0.18)",
            pointerEvents: "none",
          }} />
          {/* Decorative corner — top left */}
          <div style={{
            position: "absolute",
            top: "clamp(1rem, 3vh, 2rem)",
            left: "clamp(1rem, 3vw, 2rem)",
            width: 28,
            height: 28,
            borderTop: "1px solid rgba(82,183,136,0.18)",
            borderLeft: "1px solid rgba(82,183,136,0.18)",
            pointerEvents: "none",
          }} />
        </div>
      )}
    </>
  );
}
