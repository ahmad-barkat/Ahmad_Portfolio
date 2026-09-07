"use client";

import React, { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { CyberpunkImageReveal } from "./CyberpunkImageReveal";
import { DiagonalMarquee } from "./DiagonalMarquee";
import Link from "next/link";

gsap.registerPlugin(useGSAP);

export const CyberpunkAboutHero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const portraitContainerRef = useRef<HTMLDivElement>(null);

  // GSAP Entrance Animations
  useGSAP(() => {
    if (!heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Entrance sequence
    tl.fromTo(
      ".hero-watermark-text",
      { autoAlpha: 0, scale: 1.1 },
      { autoAlpha: 1, scale: 1, duration: 1.4 }
    )
      .fromTo(
        ".marquee-ribbon-1",
        { autoAlpha: 0, x: -100 },
        { autoAlpha: 1, x: 0, duration: 1 },
        "-=1.0"
      )
      .fromTo(
        ".marquee-ribbon-2",
        { autoAlpha: 0, x: 100 },
        { autoAlpha: 1, x: 0, duration: 1 },
        "-=0.9"
      )
      .fromTo(
        portraitContainerRef.current,
        { autoAlpha: 0, y: 40, scale: 0.95 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.2 },
        "-=0.8"
      )
      .fromTo(
        [".nav-top-left", ".nav-mid-left", ".nav-bottom-left", ".nav-right-vertical"],
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 },
        "-=0.6"
      );
  }, { scope: heroRef });

  const slogans = [
    "CRAFT OVER HYPE 侍",
    "PIXELS ARE A PROMISE 魂",
    "EGO SOLD SEPARATELY 剣",
    "CODE LIKE A SAMURAI 儀",
    "FRONTEND AS RITUAL 龍",
  ];

  return (
    <section
      ref={heroRef}
      className="relative h-screen w-full overflow-hidden select-none bg-[#081C15] text-[#F0EDE8] flex flex-col justify-between"
      style={{ minHeight: "100vh" }}
    >
      {/* ── BACKGROUND WEBSITE EMERALD AMBIENT GLOWS ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(82, 183, 136, 0.14) 0%, transparent 70%), radial-gradient(circle at 80% 20%, rgba(116, 198, 157, 0.05) 0%, transparent 50%)",
        }}
      />

      {/* Grid Pattern Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(rgba(82, 183, 136, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(82, 183, 136, 0.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── BACKGROUND WATERMARK TEXT: "AHMAD BARKAT" ── */}
      <h1
        className="hero-watermark-text pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 z-0 font-serif font-black tracking-widest text-center whitespace-nowrap leading-none opacity-90"
        style={{
          fontSize: "clamp(4rem, 16vw, 15rem)",
          WebkitTextStroke: "1.5px rgba(82, 183, 136, 0.15)",
          color: "transparent",
          letterSpacing: "0.06em",
        }}
      >
        AHMAD BARKAT
      </h1>

      {/* ── INTERSECTING DIAGONAL INFINITE MARQUEES (BEHIND CUTOUT FIGURE) ── */}
      {/* Banner 1: Top-Left to Bottom-Right (~20deg) */}
      <DiagonalMarquee
        items={slogans}
        angle={20}
        direction="left"
        speed={28}
        topOffset="46%"
        className="marquee-ribbon-1 z-10"
      />

      {/* Banner 2: Top-Right to Bottom-Right (~-20deg) */}
      <DiagonalMarquee
        items={slogans}
        angle={-20}
        direction="right"
        speed={28}
        topOffset="54%"
        className="marquee-ribbon-2 z-10"
      />

      {/* ── FIXED / LAYOUT NAVIGATION ELEMENTS ── */}

      {/* Top-Left: Branding "AHMAD BARKAT" & Portfolio 25.26 */}
      <div className="nav-top-left absolute top-8 left-8 sm:top-10 sm:left-12 z-40 flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#52B788] shadow-[0_0_12px_#52B788]" />
          <span className="font-extrabold tracking-[0.25em] text-[#F0EDE8] text-base sm:text-lg font-sans">
            AHMAD BARKAT
          </span>
        </div>
        <span className="text-[11px] font-mono tracking-[0.3em] text-[#52B788]/70 uppercase pl-5">
          PORTFOLIO 25.26
        </span>
      </div>

      {/* Middle-Left: "W." Logo Indicator */}
      <div className="nav-mid-left absolute top-1/2 left-8 sm:left-12 -translate-y-1/2 z-40 hidden md:block">
        <div className="group flex items-center justify-center h-12 w-12 rounded-full border border-[#52B788]/30 bg-[#081C15]/70 backdrop-blur-md transition-all duration-300 hover:border-[#52B788] hover:shadow-[0_0_15px_#52B788]">
          <span className="font-serif font-bold text-xl text-[#F0EDE8] group-hover:text-[#52B788] transition-colors">
            W.
          </span>
        </div>
      </div>

      {/* Bottom-Left: Minimalist "MENU" Trigger */}
      <div className="nav-bottom-left absolute bottom-8 left-8 sm:bottom-10 sm:left-12 z-40">
        <Link
          href="/nav"
          className="group flex items-center gap-3 rounded-full border border-[#52B788]/30 bg-[#081C15]/80 px-5 py-2.5 backdrop-blur-md transition-all duration-300 hover:border-[#52B788] hover:bg-[#52B788]/10 hover:shadow-[0_0_20px_rgba(82,183,136,0.3)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#52B788] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#52B788]"></span>
          </span>
          <span className="text-xs font-mono tracking-[0.3em] text-[#52B788] font-bold uppercase group-hover:text-[#F0EDE8] transition-colors">
            MENU
          </span>
        </Link>
      </div>

      {/* Right Side: Fixed Vertical Text "DESIGNED FOR THE FUTURE 2026" */}
      <div className="nav-right-vertical absolute top-1/2 right-6 sm:right-10 -translate-y-1/2 z-40 hidden sm:block">
        <div className="flex items-center gap-4 [writing-mode:vertical-rl] text-[11px] font-mono tracking-[0.4em] text-[#52B788]/60 uppercase">
          <span className="h-12 w-[1px] bg-gradient-to-b from-[#52B788] to-transparent" />
          <span className="transition-colors hover:text-[#F0EDE8]">
            DESIGNED FOR THE FUTURE 2026
          </span>
        </div>
      </div>

      {/* ── CENTRAL TRANSPARENT CUTOUT FIGURE (90vh Full Hero Section Height) ── */}
      <div className="relative z-30 flex-1 flex items-end justify-center pointer-events-auto h-[90vh] w-full">
        <div
          ref={portraitContainerRef}
          className="flex items-end justify-center w-full max-w-[1000px] h-[90vh]"
        >
          <CyberpunkImageReveal
            baseImage="/transparent_samurai.png"
            revealImage="/transparent_suit.png"
          />
        </div>
      </div>

      {/* Website Theme Emerald Border Accents */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#52B788]/50 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#52B788]/50 to-transparent" />
    </section>
  );
};
