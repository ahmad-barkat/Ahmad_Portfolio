"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { usePageTransition } from "./TransitionProvider";
import { useNavHistory } from "@/hooks/useNavHistory";
import { TextRoll } from "./TextRoll";
import ButtonWithIcon from "./button-with-icon";
import { LogoLockup } from "./Logo";
import { useLenis } from "./LenisProvider";

// Register GSAP plugins safely on client
if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase);
}

// Nav links for the full-screen kinetic navigation overlay
const MENU_LINKS = [
  { label: "Nav",      color: "#5FC7E4", href: "/",        idx: "01", shape: "1" },
  { label: "Home",     color: "#3BA7F2", href: "/home",    idx: "02", shape: "2" },
  { label: "Projects", color: "#2E93E8", href: "/projects", idx: "03", shape: "3" },
  { label: "Contact",  color: "#A5EEE2", href: "/contact",  idx: "04", shape: "4" },
  { label: "Hire me",  color: "#7FE7D6", href: "/hire",     idx: "05", shape: "1" },
];

export default function Navbar() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { transitionTo } = usePageTransition();
  const lenis = useLenis();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const menuCtx = useRef<gsap.Context | null>(null);
  const closeTl = useRef<gsap.core.Timeline | null>(null);
  const { isCurrent, isVisited } = useNavHistory();

  // ── 2. Full-Screen Kinetic Overlay Logic (Preserved from Sterling Gate) ───
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      if (!CustomEase.get("kn-main")) {
        CustomEase.create("kn-main", "0.65, 0.01, 0.05, 0.99");
      }
      gsap.defaults({ ease: "kn-main", duration: 0.7 });
    } catch {
      gsap.defaults({ ease: "power2.out", duration: 0.7 });
    }

    const ctx = gsap.context(() => {
      const menuItems = containerRef.current!.querySelectorAll<HTMLElement>(".kn-menu-item[data-shape]");
      const shapesWrap = containerRef.current!.querySelector(".kn-ambient-shapes");

      menuItems.forEach((item) => {
        const idx = item.getAttribute("data-shape");
        const shape = shapesWrap?.querySelector<HTMLElement>(`.kn-bg-shape-${idx}`);
        if (!shape) return;

        const shapeEls = shape.querySelectorAll<HTMLElement>(".kn-shape-el");

        const onEnter = () => {
          shapesWrap?.querySelectorAll(".kn-bg-shape").forEach((s) => s.classList.remove("active"));
          shape.classList.add("active");
          gsap.fromTo(
            shapeEls,
            { scale: 0.5, opacity: 0, rotation: -10 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.08, ease: "back.out(1.7)", overwrite: "auto" }
          );
        };

        const onLeave = () => {
          gsap.to(shapeEls, {
            scale: 0.8, opacity: 0, duration: 0.3, ease: "power2.in",
            onComplete: () => shape.classList.remove("active"),
            overwrite: "auto",
          });
        };

        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("mouseleave", onLeave);
        (item as any)._knCleanup = () => {
          item.removeEventListener("mouseenter", onEnter);
          item.removeEventListener("mouseleave", onLeave);
        };
      });
    }, containerRef);

    return () => {
      ctx.revert();
      containerRef.current?.querySelectorAll<any>(".kn-menu-item[data-shape]").forEach((el) => el._knCleanup?.());
    };
  }, []);

  // Open / Close animation for full-screen kinetic overlay
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const navWrap    = containerRef.current!.querySelector<HTMLElement>(".kn-overlay-wrapper");
      const menuPanel  = containerRef.current!.querySelector<HTMLElement>(".kn-menu-content");
      const overlay    = containerRef.current!.querySelector<HTMLElement>(".kn-overlay-bg");
      const panels     = containerRef.current!.querySelectorAll<HTMLElement>(".kn-backdrop-layer");
      const links      = containerRef.current!.querySelectorAll<HTMLElement>(".kn-nav-link");
      const fadeItems  = containerRef.current!.querySelectorAll<HTMLElement>("[data-kn-fade]");
      const burgerTop  = containerRef.current!.querySelector<HTMLElement>(".kn-burger-bar--top");
      const burgerMid  = containerRef.current!.querySelector<HTMLElement>(".kn-burger-bar--mid");
      const burgerBot  = containerRef.current!.querySelector<HTMLElement>(".kn-burger-bar--bot");

      if (!navWrap || !menuPanel || !overlay) return;

      if (isMenuOpen) {
        // A close still playing would hide the menu when it ends
        closeTl.current?.kill();
        closeTl.current = null;
        navWrap.style.display = "flex";
        navWrap.setAttribute("data-nav", "open");
        document.body.style.overflow = "hidden";

        // 6px is the distance from each outer bar to the middle one; see
        // .kn-burger in globals.css.
        gsap.to(burgerTop, { y: 6, rotate: 45, duration: 0.45, ease: "power3.inOut" });
        gsap.to(burgerBot, { y: -6, rotate: -45, duration: 0.45, ease: "power3.inOut" });
        gsap.to(burgerMid, { opacity: 0, scaleX: 0.2, duration: 0.25, ease: "power2.out" });

        gsap.to(overlay, { opacity: 1, duration: 0.4, ease: "power2.out" });
        gsap.set(menuPanel, { visibility: "visible" });

        // The CSS parks the panels at translateX(101%), which GSAP reads as a
        // pixel `x`; zero it, or they finish at 0% + that offset, off screen
        gsap.fromTo(
          panels,
          { xPercent: 101, x: 0 },
          { xPercent: 0, x: 0, duration: 0.7, stagger: 0.07, ease: "kn-main", overwrite: "auto" }
        );

        gsap.fromTo(
          links,
          { yPercent: 140, rotate: 3, autoAlpha: 0 },
          { yPercent: 0, rotate: 0, autoAlpha: 1, duration: 0.75, stagger: 0.05, ease: "power4.out", delay: 0.35, overwrite: "auto" }
        );

        gsap.fromTo(
          fadeItems,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out", delay: 0.45, overwrite: "auto" }
        );
      } else {
        navWrap.setAttribute("data-nav", "closed");
        document.body.style.overflow = "";

        gsap.to([burgerTop, burgerBot], { y: 0, rotate: 0, duration: 0.4, ease: "power3.inOut" });
        gsap.to(burgerMid, { opacity: 1, scaleX: 1, duration: 0.3, delay: 0.1, ease: "power2.out" });

        const tl = gsap.timeline({
          onComplete: () => {
            navWrap.style.display = "none";
            gsap.set(menuPanel, { visibility: "hidden" });
          },
        });
        closeTl.current = tl;

        tl.to(links, { opacity: 0, yPercent: -40, duration: 0.25, stagger: 0.03, ease: "power2.in" })
          .to(fadeItems, { opacity: 0, duration: 0.2 }, "-=0.15")
          .to(panels, { xPercent: 101, duration: 0.5, stagger: 0.06, ease: "kn-main" }, "-=0.1")
          .to(overlay, { opacity: 0, duration: 0.3, ease: "power2.out" }, "-=0.3");
      }
    }, containerRef);

    // Not reverted when the state flips: reverting would snap the panels back
    // to their parked place and the close would have nothing left to animate
    menuCtx.current = ctx;
  }, [isMenuOpen]);

  useEffect(() => () => menuCtx.current?.revert(), []);

  // While open: the page behind stands still (Lenis ignores overflow:
  // hidden), focus moves to the menu's close button, and back to the
  // hamburger when it closes
  useEffect(() => {
    if (isMenuOpen) {
      wasOpen.current = true;
      lenis?.stop();
      const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 350);
      return () => window.clearTimeout(t);
    }
    lenis?.start();
    if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [isMenuOpen, lenis]);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) setIsMenuOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isMenuOpen]);

  const toggleMenu = useCallback(() => setIsMenuOpen((p) => !p), []);
  const closeMenu  = useCallback(() => setIsMenuOpen(false), []);

  const handleLinkClick = useCallback(
    (href: string, color: string, label: string, el: HTMLElement) => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsMenuOpen(false);
          transitionTo(href, el, color, label.toUpperCase());
        },
      });
      tl.to(containerRef.current!.querySelectorAll(".kn-nav-link"), {
        yPercent: -60,
        autoAlpha: 0,
        stagger: 0.04,
        duration: 0.3,
        ease: "power2.in",
      }).to(
        containerRef.current!.querySelectorAll(".kn-backdrop-layer"),
        { xPercent: 101, stagger: 0.08, duration: 0.45, ease: "power4.in" },
        "-=0.1"
      );
    },
    [transitionTo]
  );

  const handleHireMeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    transitionTo("/contact", e.currentTarget, "#3BA7F2", "CONTACT");
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    transitionTo("/", e.currentTarget, "#0B3D91", "NAV");
  };

  return (
    <div ref={containerRef}>
      {/* ── 1. Full-Screen Viewport Outline Frame ────────────────────────── */}
      <div className="viewport-outline-frame" />

      {/* ── 2. Top-Center Notched Dock & Convergent Items ───────────────── */}
      <header className="nav-header-fixed">
        <div className="nav-dock-pill">
          {/* Dock White Tab Background with Inverted Fillet Wings */}
          <div className="nav-dock-backdrop">
            {/* Left Inverted Wing (Fillet) */}
            <svg
              className="notch-wing notch-wing-left"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0C13.2548 0 24 10.7452 24 24V0H0Z" fill="#E8F6FF" />
            </svg>

            {/* Central Solid White Base */}
            <div className="nav-dock-base" />

            {/* Right Inverted Wing (Fillet) */}
            <svg
              className="notch-wing notch-wing-right"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M24 0C10.7452 0 0 10.7452 0 24V0H24Z" fill="#E8F6FF" />
            </svg>
          </div>

          {/* ── Inner Row Housing the 3 Items ── */}
          <div className="nav-dock-content">
            {/* 1. LEFT ITEM: Let's Collaborate Pill */}
            <div className="nav-dock-slot nav-dock-slot--left">
              <ButtonWithIcon
                onClick={handleHireMeClick}
                aria-label="Hire AHMAD Barkat"
              >
                Let&apos;s Collaborate
              </ButtonWithIcon>
            </div>

            {/* 2. CENTER ITEM: the logo */}
            <div className="nav-dock-slot nav-dock-slot--center">
              <button
                onClick={handleLogoClick}
                className="nav-logo-btn group"
                aria-label="Ahmad Barkat, home"
              >
                <LogoLockup className="nav-logo nav-adaptive-text" />
              </button>
            </div>

            {/* 3. RIGHT ITEM: Hamburger Menu Button */}
            <div className="nav-dock-slot nav-dock-slot--right">
              <button
                ref={triggerRef}
                onClick={toggleMenu}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                className="nav-item-btn nav-adaptive-bg"
              >
                {/* Hamburger bars — morphed into a cross while the menu is open */}
                <div className="kn-btn-icon-wrap nav-adaptive-icon">
                  <span className="kn-burger" aria-hidden="true">
                    <span className="kn-burger-bar kn-burger-bar--top" />
                    <span className="kn-burger-bar kn-burger-bar--mid" />
                    <span className="kn-burger-bar kn-burger-bar--bot" />
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── 3. Full-Screen Kinetic Menu Overlay ─────────────────────────── */}
      <div className="kn-overlay-wrapper" data-nav="closed" style={{ display: "none" }}>
        {/* Dim overlay — clicking closes menu */}
        <div className="kn-overlay-bg" onClick={closeMenu} />

        <nav className="kn-menu-content" aria-label="Main navigation">
          {/* Layered backdrop panels */}
          <div className="kn-menu-bg">
            <div className="kn-backdrop-layer kn-layer-first"  />
            <div className="kn-backdrop-layer kn-layer-second" />
            <div className="kn-backdrop-layer"                 />

            {/* Ambient SVG shapes */}
            <div className="kn-ambient-shapes">
              {/* Shape 1 */}
              <svg className="kn-bg-shape kn-bg-shape-1" viewBox="0 0 400 400" fill="none">
                <circle className="kn-shape-el" cx="80"  cy="120" r="40" fill="rgba(59, 167, 242,0.12)" />
                <circle className="kn-shape-el" cx="300" cy="80"  r="60" fill="rgba(32, 120, 216,0.10)" />
                <circle className="kn-shape-el" cx="200" cy="300" r="80" fill="rgba(22, 95, 196,0.10)"  />
                <circle className="kn-shape-el" cx="350" cy="280" r="30" fill="rgba(59, 167, 242,0.14)" />
              </svg>

              {/* Shape 2 */}
              <svg className="kn-bg-shape kn-bg-shape-2" viewBox="0 0 400 400" fill="none">
                <path className="kn-shape-el" d="M0 200 Q100 100,200 200 T400 200" stroke="rgba(59, 167, 242,0.18)" strokeWidth="55" fill="none" />
                <path className="kn-shape-el" d="M0 280 Q100 180,200 280 T400 280" stroke="rgba(32, 120, 216,0.14)"  strokeWidth="38" fill="none" />
              </svg>

              {/* Shape 3 */}
              <svg className="kn-bg-shape kn-bg-shape-3" viewBox="0 0 400 400" fill="none">
                {[50,150,250,350].map((cx) => (
                  <circle key={cx} className="kn-shape-el" cx={cx} cy="50"  r="8"  fill="rgba(59, 167, 242,0.25)" />
                ))}
                {[100,200,300].map((cx) => (
                  <circle key={cx} className="kn-shape-el" cx={cx} cy="150" r="12" fill="rgba(32, 120, 216,0.22)"  />
                ))}
                {[50,150,250,350].map((cx) => (
                  <circle key={cx} className="kn-shape-el" cx={cx} cy="250" r="10" fill="rgba(59, 167, 242,0.20)" />
                ))}
                {[100,200,300].map((cx) => (
                  <circle key={cx} className="kn-shape-el" cx={cx} cy="350" r="6"  fill="rgba(22, 95, 196,0.28)"  />
                ))}
              </svg>

              {/* Shape 4 */}
              <svg className="kn-bg-shape kn-bg-shape-4" viewBox="0 0 400 400" fill="none">
                <path className="kn-shape-el" d="M100 100 Q150 50,200 100 Q250 150,200 200 Q150 250,100 200 Q50 150,100 100" fill="rgba(59, 167, 242,0.10)" />
                <path className="kn-shape-el" d="M250 200 Q300 150,350 200 Q400 250,350 300 Q300 350,250 300 Q200 250,250 200"  fill="rgba(32, 120, 216,0.09)"  />
              </svg>
            </div>
          </div>

          {/* Menu content */}
          <div className="kn-content-wrap">
            {/* Top bar */}
            <div className="kn-top-bar">
              <LogoLockup className="kn-logo" />
              <div className="kn-top-actions">
                <span className="kn-esc-hint" aria-hidden="true">
                  <kbd>Esc</kbd> to close
                </span>
                {/* The menu covers the dock's hamburger, so it carries its own
                    close button, drawn with the same bars as the cross */}
                <button ref={closeRef} type="button" className="kn-close" onClick={closeMenu} aria-label="Close menu">
                  <span className="kn-close__x" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Nav links */}
            <ul className="kn-link-list">
              {MENU_LINKS.map((link) => {
                const active  = isCurrent(link.href);
                const visited = isVisited(link.href);

                return (
                  <li
                    key={link.label}
                    className="kn-menu-item"
                    data-shape={link.shape}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      className="kn-nav-link"
                      data-roll
                      style={{ "--link-color": link.color } as React.CSSProperties}
                      onClick={(e) => handleLinkClick(link.href, link.color, link.label, e.currentTarget as HTMLElement)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleLinkClick(link.href, link.color, link.label, e.currentTarget as HTMLElement);
                      }}
                    >
                      {/* Index */}
                      <span className="kn-link-idx" style={{ color: active ? link.color : undefined }}>
                        {link.idx}
                      </span>

                      {/* Dot */}
                      <span
                        className="kn-link-dot"
                        style={{
                          background: active ? link.color : undefined,
                        }}
                      />

                      {/* Label */}
                      <TextRoll
                        className="kn-link-label"
                        style={{ color: active ? link.color : undefined } as React.CSSProperties}
                      >
                        {link.label}
                      </TextRoll>

                      {/* Badges */}
                      {active ? (
                        <span className="kn-badge kn-badge--active" style={{ background: link.color }}>
                          <span className="kn-badge-dot" />
                          CURRENT PAGE
                        </span>
                      ) : visited ? (
                        <span className="kn-badge kn-badge--visited" data-kn-fade>
                          ✓ VISITED
                        </span>
                      ) : null}

                      {/* Arrow */}
                      <span className="kn-link-arrow" style={{ color: active ? link.color : undefined }}>→</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            <div className="kn-menu-footer">
              <span className="kn-footer-copy">AHMAD Barkat © 2026</span>
              <span className="kn-footer-title">Software Engineer</span>
            </div>
          </div>

          {/* Corner accents */}
          <div className="kn-corner kn-corner--tl" />
          <div className="kn-corner kn-corner--br" />
        </nav>
      </div>
    </div>
  );
}
