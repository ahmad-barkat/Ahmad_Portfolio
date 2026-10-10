"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { LiquidMaskReveal } from "@/components/ui/liquid-mask-reveal";
import HeadingReveal from "@/components/ui/HeadingReveal";
import { HeroFront } from "@/components/sections/HeroFront";
import { ProjectArc } from "@/components/ui/project-arc";
import { DRAGON_REVEAL, useDragonMetrics } from "@/components/ui/reveal-presets";
import { usePageReady } from "@/components/ui/page-ready";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/* The hero's layers (data-parallax-layer 1 = deepest, 4 = front) leave at
   different speeds when the next section slides in over the hero: see
   EXIT_DEPTH in NoiseSection.tsx, which pins the hero and drives them. */

export const LandoAboutHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const dragon = useDragonMetrics();
  // The portrait spans the viewport: its noise scales up by that over the dragon's width
  const [heroWidth, setHeroWidth] = React.useState(0);
  React.useEffect(() => {
    const set = () => setHeroWidth(window.innerWidth);
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  /* ── Page entrance ──────────────────────────────────────────────────────
     One timeline for the whole hero, started only once the page can be seen
     (after the first-visit preloader or a page-transition overlay lifts).
     Until then the hero holds in its pending state (see [data-intro-state] in
     globals.css), so nothing flashes in before its cue.

       0.00  the backdrop settles in
       0.10  the portrait settles into place
       0.30  the headline rises line by line
       0.35  AHMAD rises letter by letter behind the portrait
       0.60  the reel of projects drifts in beneath it
       0.90  the "Open to work" badge turns in
       1.05  the proof pill and the note rise                               */
  const pageReady = usePageReady();
  const introStarted = useRef(false);
  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero || introStarted.current) return;

      const start = () => {
        if (introStarted.current) return;
        introStarted.current = true;
        const q = gsap.utils.selector(hero);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const done = () => {
          hero.dataset.introState = "done";
        };

        if (reduce) {
          gsap.set(q(".hx-title .rw-i"), { y: 0, yPercent: 0 });
          gsap.set(q(".hero-wordmark .hr-reveal-char"), { yPercent: 0 });
          gsap.fromTo(
            q('[data-parallax-layer="1"] > div, .hero-wordmark-enter, .pa, .hx-in'),
            { opacity: 0 },
            { opacity: 1, duration: 0.6, ease: "power1.out", clearProps: "opacity", onComplete: done },
          );
          hero.dataset.introState = "running";
          return;
        }

        const tl = gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: done });

        // The backdrop settles in
        tl.fromTo(
          q('[data-parallax-layer="1"] > div'),
          { opacity: 0, scale: 1.06 },
          { opacity: 1, scale: 1, duration: 1.8, clearProps: "transform" },
          0,
        );

        // The portrait settles into place. It is never hidden: as the largest
        // image it has to paint before any script runs
        tl.fromTo(
          q(".hero-portrait-enter"),
          { y: 40, scale: 1.04 },
          { y: 0, scale: 1, duration: 1.6, clearProps: "transform" },
          0.1,
        );

        // The headline, one line after another. The pending CSS holds the
        // words down with a transform, which GSAP would read as a px `y`
        q(".hx-line").forEach((line, i) => {
          tl.fromTo(
            line.querySelectorAll(".rw-i"),
            { y: 0, yPercent: 115 },
            { y: 0, yPercent: 0, duration: 1.2, stagger: 0.05 },
            0.3 + i * 0.11,
          );
        });

        // AHMAD rises letter by letter
        tl.fromTo(q(".hero-wordmark-enter"), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 0.35);
        tl.fromTo(
          q(".hero-wordmark .hr-reveal-char"),
          { yPercent: 100 },
          { yPercent: 0, duration: 1.25, stagger: 0.07 },
          0.35,
        );

        // The reel drifts in beneath it, already moving
        tl.fromTo(
          q(".pa"),
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 1.8, clearProps: "transform" },
          0.6,
        );

        // The badge turns in
        tl.fromTo(
          q(".hx-badge"),
          { opacity: 0, scale: 0.6, rotate: -90 },
          { opacity: 1, scale: 1, rotate: 0, duration: 1.4, clearProps: "transform" },
          0.9,
        );

        // Proof and note
        tl.fromTo(
          q(".hx-proof, .hx-note"),
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, clearProps: "transform" },
          1.05,
        );

        // Every piece now holds its own starting state inline, so the pending
        // rules can let go without anything flashing
        hero.dataset.introState = "running";
      };

      if (pageReady) {
        start();
        return;
      }
      // Never leave the hero hidden if the ready signal goes missing
      const fallback = window.setTimeout(start, 6000);
      return () => window.clearTimeout(fallback);
    },
    { scope: heroRef, dependencies: [pageReady] },
  );

  return (
    <div
      ref={containerRef}
      id="hero"
      className="relative w-full overflow-hidden select-none bg-[#072A5E] text-[#E8F6FF]"
      style={{
        backgroundColor: "#072A5E",
        backgroundImage:
          "radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    >
      {/* ── MAIN HERO SECTION ── */}
      <section
        ref={heroRef}
        data-intro-state="pending"
        className="hero-stage relative min-h-screen w-full flex flex-col justify-between px-4 sm:px-8 pt-24 sm:pt-28 pb-0 overflow-hidden z-10"
      >
        {/* Without scripts there is no entrance, so nothing may wait for one */}
        <noscript>
          <style>{`[data-intro-state] * { opacity: 1 !important; transform: none !important; clip-path: none !important; }`}</style>
        </noscript>
        {/* ── LAYER 1 // DEEPEST: atmospheric plate ── */}
        <div
          aria-hidden="true"
          data-parallax-layer="1"
          className="pointer-events-none absolute inset-0 z-0 will-change-transform"
        >
          <div
            className="absolute inset-0"
            style={{
              // The site's deep gradient (see --grad-deep in globals.css)
              background: "var(--grad-deep-light), var(--grad-deep)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 70% at 50% 80%, rgba(59,167,242,0.30) 0%, rgba(59,167,242,0.09) 38%, transparent 68%)",
            }}
          />
          {/* The dot grid rides the plate, so the texture carries the depth too */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(232,246,255,0.055) 1px, transparent 1px), radial-gradient(circle, rgba(127,231,214,0.11) 1px, transparent 1px)",
              backgroundSize: "36px 36px, 150px 150px",
              backgroundPosition: "0 0, 19px 27px",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(92% 78% at 50% 44%, transparent 38%, rgba(3,16,42,0.6) 100%)",
            }}
          />
        </div>
        {/* ── LAYER 2 // MID: the wordmark the portrait stands in front of, and
            the reel of projects, which bends its curve to pass beneath the
            wordmark (`avoid`) so the two never cross. Centred with flex, never
            a transform — GSAP owns this wrapper's transform. */}
        <div
          data-parallax-layer="2"
          className="pointer-events-none absolute inset-0 z-10 will-change-transform"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="hero-wordmark-box w-full flex flex-col items-center justify-center text-center select-none hero-wordmark-enter">
              <HeadingReveal
                as="span"
                className="hero-wordmark font-sans font-black tracking-tighter uppercase whitespace-nowrap leading-[0.82]"
                style={{
                  fontSize: "clamp(4.5rem, min(14vw, 22vh), 14rem)",
                  color: "#E8F6FF",
                  opacity: 0.9,
                  letterSpacing: "-0.045em",
                }}
                manual
              >
                AHMAD
              </HeadingReveal>
            </div>
          </div>
          <ProjectArc avoid=".hero-wordmark" />
        </div>

        {/* ── LAYER 3 // SUBJECT: COLOSSAL FULL-SCREEN PORTRAIT ── */}
        <div
          data-parallax-layer="3"
          className="absolute inset-0 z-30 will-change-transform"
        >
        <div
          className="w-full h-full flex items-center justify-center select-none hero-portrait-enter"
        >
          {/* ── WebGL Navier-Stokes Liquid Mask Reveal ── */}
          {/* Both layers share one full-bleed box on the same aspect, so `cover` crops
              them identically and the cutout stays registered with the artwork under it.
              On phones and portrait tablets the box is a tall panel standing on the
              bottom edge (.hero-portrait-box in globals.css): `cover` then
              keeps the full image height and trims the sides, and since the subject is
              centred, the face and shoulders fill the screen instead of letterboxing. */}
          <div className="hero-portrait-box relative w-full h-full">
            <LiquidMaskReveal
              /* Both plates are 1536x858, so `cover` crops them identically.
                 The hover plate is a cutout too (the figure plus the red moon
                 behind him), so `knockout` clears the portrait under the brush
                 and the hero ground shows through instead of both figures. */
              imageBase="/hero-base-cutout.webp?v=4"
              imageHover="/hero-hover-cutout.webp?v=1"
              knockout
              priority
              altBase="Ahmad Barkat — Executive Portrait"
              altHover="Ahmad Barkat — Shinobi Identity"
              fitMode="cover"
              imageClassName="filter contrast-102"
              /* The dragon's reveal, exactly: same noise, boost, blur, curl and
                 fade, and the same brush in px (the containers differ in size,
                 so the brush is matched in px rather than as a fraction). */
              {...DRAGON_REVEAL}
              brushPx={dragon.brush}
              noiseScale={dragon.width && heroWidth ? heroWidth / dragon.width : 1}
              className="w-full h-full"
            />
          </div>
        </div>
        </div>

        {/* ── Soft dissolve into the About section instead of a hard cut ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[24vh] z-[35]"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,42,94,0) 0%, rgba(7,42,94,0.55) 55%, #072A5E 100%)",
          }}
        />

        {/* ── LAYER 4 // FRONT: headline, badge, proof and note ── */}
        <div
          data-parallax-layer="4"
          className="pointer-events-none absolute inset-0 z-40 will-change-transform"
        >
          <HeroFront />
        </div>
      </section>
    </div>
  );
};

export default LandoAboutHero;

