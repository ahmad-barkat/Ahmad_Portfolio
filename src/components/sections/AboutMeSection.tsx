"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { LiquidMaskReveal } from "@/components/ui/liquid-mask-reveal";
import { DRAGON_REVEAL, DRAGON_REVEAL_ID } from "@/components/ui/reveal-presets";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function AboutMeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const letterSpansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageStageRef = useRef<HTMLDivElement>(null);

  const [isHovering, setIsHovering] = useState(false);

  const headingText = "HI, I'M AHMAD.";

  // Every letter is its own inline-block so it can be staggered, which also lets
  // the browser break a line between any two of them. Now that the heading only
  // gets 7 columns it would ("HI, I'M AH / MAD."), so the letters
  // are grouped into unbreakable words and wrapping happens at spaces only.
  const headingWords = React.useMemo(() => {
    let cursor = 0;
    return headingText.split(" ").map((word) => {
      const start = cursor;
      cursor += word.length + 1; // +1 for the space that is no longer rendered
      return { word, start };
    });
  }, []);

  // GSAP Text Reveal Animation triggered on scroll
  useEffect(() => {
    if (!sectionRef.current || !headingRef.current) return;

    const ctx = gsap.context(() => {
      const letters = letterSpansRef.current.filter(Boolean);

      // Letter-by-letter reveal using the exact text-reveal-animation standard
      if (letters.length > 0) {
        gsap.fromTo(
          letters,
          { yPercent: 110, rotateZ: 4, opacity: 0 },
          {
            yPercent: 0,
            rotateZ: 0,
            opacity: 1,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.03,
            scrollTrigger: {
              trigger: headingRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // Staggered reveal for bio paragraph & badges
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current.children,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: contentRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // Dragon stage entrance
      if (imageStageRef.current) {
        gsap.fromTo(
          imageStageRef.current,
          { scale: 0.92, opacity: 0, x: 40 },
          {
            scale: 1,
            opacity: 1,
            x: 0,
            duration: 1.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: imageStageRef.current,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Hovering lifts the aura behind the artwork; the artwork itself stays put so
  // the revealed trail keeps registering with the dragon underneath it.
  const handleDragonHoverEnter = () => setIsHovering(true);
  const handleDragonHoverLeave = () => setIsHovering(false);

  return (
    <section
      id="about-me"
      ref={sectionRef}
      className="sec-gradient relative w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-14 2xl:px-20 bg-[#072A5E] text-[#E8F6FF] overflow-hidden"
    >
      {/* ── Ambient radial aura ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 25%, rgba(59, 167, 242,0.15), transparent 55%), radial-gradient(circle at 85% 75%, rgba(127, 231, 214,0.06), transparent 50%), radial-gradient(circle at 70% 10%, rgba(59, 167, 242,0.08), transparent 45%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 20%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, #000 20%)",
        }}
      />

      {/* ── Ink-stroke decorative BG kanji ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 select-none overflow-hidden leading-none"
        style={{
          fontSize: "clamp(6rem, 20vw, 18rem)",
          fontWeight: 900,
          color: "transparent",
          WebkitTextStroke: "1px rgba(59, 167, 242,0.055)",
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.05em",
          lineHeight: 0.85,
          userSelect: "none",
        }}
      >
        龍
      </div>

      <div className="relative z-10 w-full">
        {/* ── Section tag ── */}
        <div className="flex items-center gap-3 mb-8">
          <span className="w-8 h-[1px] bg-[#3BA7F2]" />
          <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#3BA7F2] font-bold">
            ABOUT // THE PERSON BEHIND THE WORK
          </span>
        </div>

        {/* ── One 50/50 row: every word on the left half, the dragon on the
            right. `items-center` floats the artwork against the tall copy
            column instead of pinning it to the top. ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-12 xl:gap-16 items-center">
          {/* ── LEFT HALF: heading, bio, badges, CTAs ── */}
          <div className="relative z-10 flex flex-col">
            <div className="overflow-hidden mb-10 sm:mb-12">
              <h2
                ref={headingRef}
                className="font-sans font-black uppercase tracking-tighter text-[#E8F6FF] leading-none flex flex-wrap gap-x-[0.24em]"
                style={{ fontSize: "clamp(2.6rem, 6vw, 7rem)" }}
                aria-label={headingText}
              >
                {headingWords.map(({ word, start }) => (
                  <span key={start} className="inline-flex whitespace-nowrap">
                    {word.split("").map((char, offset) => {
                      const index = start + offset;
                      return (
                        <span
                          key={index}
                          className="overflow-hidden inline-block"
                          style={{ verticalAlign: "bottom" }}
                        >
                          <span
                            ref={(el) => {
                              letterSpansRef.current[index] = el;
                            }}
                            className="inline-block transform"
                            style={{
                              color:
                                char === "."
                                  ? "#7FE7D6"
                                  : index === 0
                                  ? "#3BA7F2"
                                  : undefined,
                            }}
                          >
                            {char}
                          </span>
                        </span>
                      );
                    })}
                  </span>
                ))}
              </h2>
            </div>

            <div ref={contentRef} className="flex flex-col gap-7">

              {/* Role badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#3BA7F2]/30 bg-[#03102A]/90 backdrop-blur-md w-fit">
                <span className="w-2 h-2 rounded-full bg-[#7FE7D6]" />
                <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.28em] text-[#3BA7F2] uppercase font-bold">
                  FULL-STACK DEVELOPER · WORKING WORLDWIDE
                </span>
              </div>

              {/* Primary bio */}
              <p className="max-w-[44rem] font-sans font-normal text-base sm:text-lg text-[#E8F6FF] leading-relaxed">
                I&apos;m{" "}
                <span className="text-[#E8F6FF] font-bold underline decoration-[#3BA7F2] decoration-2 underline-offset-4">
                  AHMAD Barkat
                </span>
                , a full-stack developer who designs and builds websites and web apps for startups and growing businesses. Over the past year I&apos;ve shipped six projects, from a property platform for a Dubai developer to agency and brand sites and interactive portfolios, each taken from first sketch to launch.
              </p>

              {/* Working together */}
              <p className="max-w-[44rem] font-sans text-sm sm:text-base text-[#E8F6FF]/70 leading-relaxed">
                You work with one person the whole way through. The person on your first call is the one{" "}
                <span className="text-[#3BA7F2] font-semibold">designing your screens, writing your code and answering your messages</span>
                , and the one still there when something needs fixing after launch.
              </p>

              {/* Stack paragraph */}
              <p className="max-w-[44rem] font-sans text-sm sm:text-base text-[#E8F6FF]/70 leading-relaxed">
                I work mostly in <strong className="text-[#E8F6FF]">Next.js</strong>,{" "}
                <strong className="text-[#E8F6FF]">React</strong> and <strong className="text-[#E8F6FF]">TypeScript</strong>,
                adding <strong className="text-[#E8F6FF]">GSAP</strong> and <strong className="text-[#E8F6FF]">Three.js</strong> only
                when motion or 3D helps the product. I care as much about how fast a page loads and who can use it as about how it looks.
              </p>

              {/* Stat badges */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "SPECIALITY", value: "Fast, animated websites" },
                  { label: "CORE STACK", value: "Next.js · React · TypeScript" },
                  { label: "HOURS", value: "UTC+5, overlaps UK, EU & Gulf" },
                  { label: "REPLIES", value: "Within one working day" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="p-3.5 rounded-xl border border-[#3BA7F2]/20 bg-[#03102A]/80 flex flex-col gap-1 hover:border-[#3BA7F2]/50 transition-all duration-300"
                  >
                    <span className="font-mono text-[8px] sm:text-[9px] tracking-widest text-[#3BA7F2] uppercase">
                      {label}
                    </span>
                    <span className="font-sans font-bold text-xs sm:text-sm text-[#E8F6FF]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/contact"
                  className="group relative inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-full bg-[#3BA7F2] text-[#072A5E] font-sans font-black text-xs uppercase tracking-widest transition-all duration-300 hover:bg-[#7FE7D6] active:scale-95"
                >
                  <span>START A PROJECT</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform duration-300 group-hover:translate-x-1">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#3BA7F2]/30 hover:border-[#7FE7D6] text-[#E8F6FF] font-mono text-xs uppercase tracking-wider transition-all duration-300 hover:text-[#7FE7D6]"
                >
                  <span>SEE MY WORK</span>
                </Link>
            </div>
          </div>
          </div>

          {/* ── DRAGON: no frame, no chrome — just the artwork on the page ── */}
          <div
            ref={imageStageRef}
            className="relative z-0 w-full flex flex-col items-center lg:items-end"
            onMouseEnter={handleDragonHoverEnter}
            onMouseLeave={handleDragonHoverLeave}
          >
            {/* Aura instead of a card: it lifts on hover so the artwork still
                answers the cursor without anything being drawn around it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-700"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, rgba(59, 167, 242,0.22), transparent 68%)",
                opacity: isHovering ? 1 : 0.4,
              }}
            />

            {/* The artwork is 3:2 and already transparent, so the box matches its
                aspect and the dragon bleeds straight onto the section. */}
            <div
              id={DRAGON_REVEAL_ID}
              className="relative z-10 w-full max-w-[720px] aspect-[1281/974] lg:w-[138%] lg:max-w-none"
            >
              <LiquidMaskReveal
                imageBase="/dragon-skitched.webp?v=3"
                imageHover="/dragon-filled.webp?v=3"
                altBase="Dragon — Crimson Sketch Form"
                altHover="Dragon — Unleashed Wrath Form"
                fitMode="contain-center"
                {...DRAGON_REVEAL}
                className="w-full h-full"
              />
            </div>

            <div className="relative z-10 mt-4 flex flex-col items-center gap-1.5 px-4">
              <span className="font-mono text-[9px] tracking-[0.32em] uppercase text-[#3BA7F2]/75 font-bold">
                Hover to unleash
              </span>
              <p className="text-center font-mono text-[10px] tracking-[0.26em] text-[#E8F6FF]/30 uppercase">
                The dragon doesn&apos;t breathe fire. It ships features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutMeSection;
