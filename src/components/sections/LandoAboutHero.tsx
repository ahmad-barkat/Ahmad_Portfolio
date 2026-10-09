"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { LiquidMaskReveal } from "@/components/ui/liquid-mask-reveal";
import HeadingReveal from "@/components/ui/HeadingReveal";
import { HeroAside } from "@/components/sections/HeroAside";
import { DRAGON_REVEAL, useDragonMetrics } from "@/components/ui/reveal-presets";
import { usePageReady } from "@/components/ui/page-ready";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Scroll travel per depth layer, as a fraction of one viewport height.
 *
 * The section itself scrolls up by a full viewport over the same range, so a
 * layer's apparent speed is (1 - depth): layer 1 drifts up at 0.3x and lingers
 * like a distant sky, layer 4 leaves almost with the page like foreground trim.
 * Absolute pixels rather than yPercent, because the four layers are wildly
 * different heights and yPercent would give each a different travel.
 */
const PARALLAX_LAYERS: ReadonlyArray<readonly [layer: string, depth: number]> = [
  ["1", 0.7],   // atmospheric plate
  ["2", 0.45],  // AHMAD wordmark
  ["3", 0.2],   // portrait + liquid reveal
  ["4", 0.1],   // side columns, which also fade out below
];

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
       0.10  the portrait unveils from the bottom up
       0.35  AHMAD rises letter by letter
       0.80  left column: the eyebrow line draws, then each line's words rise
       0.95  right column: the figures rise and count up
       1.25  client proof: the faces arrive one by one, then the stars
       1.40  the client quote settles in                                    */
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
        // The normal faces only: each side block also carries a hidden alt face
        const aside = (sel: string) => q(`.gj-base ${sel}`);
        const counters = q("[data-count]");
        const done = () => {
          hero.dataset.introState = "done";
        };

        if (reduce) {
          counters.forEach((el) => (el.textContent = el.dataset.count ?? ""));
          gsap.set(q(".hero-wordmark .hr-reveal-char"), { yPercent: 0 });
          gsap.fromTo(
            q('[data-parallax-layer="1"] > div, .hero-wordmark-enter, .hs-in, .hero-mobile-line'),
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

        // AHMAD rises letter by letter
        tl.fromTo(q(".hero-wordmark-enter"), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 0.35);
        tl.fromTo(
          q(".hero-wordmark .hr-reveal-char"),
          { yPercent: 100 },
          { yPercent: 0, duration: 1.25, stagger: 0.07 },
          0.35,
        );

        // Text blocks show at once; their words do the moving
        const words = (targets: Element[], at: number, stagger = 0.028) => {
          tl.fromTo(targets, { yPercent: 115 }, { yPercent: 0, duration: 1.05, stagger }, at);
        };
        const lines = (sel: string, at: number) => {
          tl.set(aside(sel), { opacity: 1 }, at);
          words(aside(`${sel} .rw-i`), at);
        };

        // Left column
        tl.fromTo(
          aside(".hs-eyebrow > span"),
          { scaleX: 0 },
          { scaleX: 1, duration: 0.9, transformOrigin: "left center", clearProps: "transform" },
          0.8,
        );
        lines(".hs-eyebrow", 0.8);
        lines(".hs-statement", 0.9);
        lines(".hs-status", 1.1);

        // Right column: each figure rises and counts up from zero
        // The figures' dividers fade in with them rather than ahead of them
        tl.fromTo(aside(".hs-stat"), { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.out" }, 0.9);
        tl.fromTo(
          aside(".hs-stat dd"),
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, clearProps: "transform" },
          0.95,
        );
        words(aside(".hs-stat dt .rw-i"), 1.05, 0.03);

        // Phones: the figures row above the head
        tl.fromTo(q(".gj-base .hs-m__stats"), { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.out" }, 0.8);
        tl.fromTo(
          q(".gj-base .hs-m__stats dd"),
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 1.0, stagger: 0.08, clearProps: "transform" },
          0.85,
        );
        words(q(".gj-base .hs-m__stats dt .rw-i"), 0.95, 0.04);

        counters.forEach((el, i) => {
          const to = Number(el.dataset.count);
          const n = { v: 0 };
          el.textContent = "0";
          tl.to(
            n,
            {
              v: to,
              duration: 1.8,
              ease: "power3.out",
              onUpdate: () => {
                el.textContent = String(Math.round(n.v));
              },
            },
            0.95 + (Number(el.dataset.countI) || i % 3) * 0.1,
          );
        });

        // Client proof: the block, then each face, then the stars
        tl.fromTo(
          aside(".hs-proof"),
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 1.0, clearProps: "transform" },
          1.25,
        );
        tl.fromTo(
          aside(".hs-faces > span"),
          { opacity: 0, scale: 0.6 },
          { opacity: 1, scale: 1, duration: 0.8, stagger: 0.07, clearProps: "transform" },
          1.3,
        );
        tl.fromTo(
          aside(".hs-stars svg"),
          { opacity: 0, scale: 0.4 },
          { opacity: 1, scale: 1, duration: 0.6, stagger: 0.05, clearProps: "transform" },
          1.45,
        );

        // The client quote, and the phones' closing line
        tl.fromTo(
          aside(".hs-quote, .hs-scroll"),
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 1.1, clearProps: "transform" },
          1.4,
        );
        tl.set(q(".hero-mobile-line"), { opacity: 1 }, 1.3);
        words(q(".hero-mobile-line .rw-i"), 1.3, 0.04);
        tl.fromTo(q(".hero-mobile-line__scroll"), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.out" }, 1.6);

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

  // Depth-separated exit. Every layer is a bare wrapper: the elements inside
  // keep their CSS entrance animations, which use `animation-fill-mode: both`
  // and would otherwise win the cascade over an inline transform forever.
  // useGSAP's scope reverts only what is created here — unlike killing every
  // ScrollTrigger on the page, which would take the About section's with it.
  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      });

      PARALLAX_LAYERS.forEach(([layer, depth]) => {
        tl.to(
          hero.querySelectorAll(`[data-parallax-layer="${layer}"]`),
          { y: () => window.innerHeight * depth, ease: "none" },
          0
        );
      });

      // The side columns clear out in the first half of the scroll, so they
      // never trail over the About section
      tl.to(
        hero.querySelectorAll('[data-parallax-layer="4"]'),
        { autoAlpha: 0, ease: "none", duration: 0.25 },
        0
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
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
        className="relative min-h-screen w-full flex flex-col justify-between px-4 sm:px-8 pt-24 sm:pt-28 pb-0 overflow-hidden z-10"
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
        {/* ── LAYER 2 // MID: the wordmark the portrait stands in front of ──
            Centred with flex, never a transform — GSAP owns this wrapper's
            transform and a Tailwind -translate-* would be overwritten. */}
        <div
          data-parallax-layer="2"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center will-change-transform"
        >
          <div className="w-full mt-[12vh] max-md:mt-[4svh] flex flex-col items-center justify-center text-center select-none hero-wordmark-enter">
            <HeadingReveal
              as="span"
              className="hero-wordmark font-sans font-black tracking-tighter uppercase whitespace-nowrap leading-[0.82]"
              style={{
                fontSize: "clamp(4.5rem, 19vw, 18rem)",
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
              On phones the box is a tall panel standing on the bottom edge: `cover` then
              keeps the full image height and trims the sides, and since the subject is
              centred, the face and shoulders fill the screen instead of letterboxing. */}
          <div className="relative w-full h-full max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:h-[80svh]">
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

        {/* ── LAYER 4 // FRONT: side columns on wide screens, top and bottom rows on phones ── */}
        <div
          data-parallax-layer="4"
          className="pointer-events-none absolute inset-0 z-40 will-change-transform"
        >
          <HeroAside />
        </div>
      </section>
    </div>
  );
};

export default LandoAboutHero;

