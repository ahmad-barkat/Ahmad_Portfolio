"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { LOGO_CURSOR, LOGO_LEGS, LogoMark } from "@/components/ui/Logo";
import { RevealText } from "@/components/ui/RevealText";
import { TextRoll } from "@/components/ui/TextRoll";
import ButtonWithIcon from "@/components/ui/button-with-icon";
import { usePageTransition } from "@/components/ui/TransitionProvider";
import { CONTACT_EMAIL, EMAIL_HREF } from "@/data/contact";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/* The photo: a cinema audience (Krists Luhaers, Unsplash License), baked to an
   ink-to-ice duotone, plus one person cut out of the colour original, his
   tracksuit recoloured in the site's royal with mint stripes. He is in colour
   from the start: the one who is different, before anyone looks for him. The
   cut-out's box, as a share of the photo, keeps the two in register.
   crowd-soft.webp is the same crowd out of focus, for the focus pull. */
const PHOTO_RATIO = 1.5;
const ONE = { left: 42.433, top: 49.2, width: 9, height: 13 };
const ONE_CX = (ONE.left + ONE.width / 2) / 100;
const ONE_CY = (ONE.top + ONE.height / 2) / 100;

/** How far each layer of the section before this one drifts as it leaves,
    as a share of the screen width: the deeper, the slower (sideways parallax) */
const EXIT_DEPTH: Record<string, number> = { "1": 0.12, "2": 0.24, "3": 0.38, "4": 0.6 };

/** One line per beat, in the same place: the problem, the find, the payoff */
const BEATS = [
  "Every site looks the same. Visitors scroll past.",
  "Found you. That’s how your customers should feel.",
  "Stand out, and the competition disappears.",
];

/* Scroll units of the pinned sequence (one unit = 0.8 of the screen height,
   0.6 on phones), about 3.4 screens in all. One focus at a time:
     0    - 0.9   the crowd slides in from the right as the hero drifts away
     0.6  - 1.15  "Stand out from the noise.", then the house lights go down
     0.85 - 2.55  depth: the front row rises over the rows behind it
     1.15 - 1.65  a spotlight searches the crowd (it follows the cursor)
     1.65 - 2.0   it finds the one, who rises a little out of his seat
     1.75 - 2.35  focus pull: the crowd behind goes soft, he stays sharp
     2.0  - 2.55  the camera pushes in and the rest of the crowd disappears
     2.6  - 3.35  "That one is you.", Ahmad's signature, the call to action
     3.45 - 3.97  the mark flies up and docks into the navbar logo
     3.97 - 4.2   a beat to act                                                 */
const TOTAL = 4.2;

/** A box's place and size relative to another element's top-left */
function boxIn(el: Element, origin: Element) {
  const a = el.getBoundingClientRect();
  const o = origin.getBoundingClientRect();
  return { x: a.left - o.left, y: a.top - o.top, w: a.width, h: a.height };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * "Stand out from the noise": a whole audience in grey, and one person in
 * the site's colours. The hero pins and drifts away as this screen slides in
 * over it; the house lights go down and a spotlight searches the crowd (the
 * visitor steers it) and finds him. He rises a little, the crowd behind him
 * goes out of focus, the front row slides past in depth, and the camera
 * pushes in while everyone else fades into the dark. Then "That one is you.", Ahmad's signature with his
 * email, the call to action, and his mark flies up into the navbar logo.
 */
export function NoiseSection({ from = "hero" }: { from?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { transitionTo } = usePageTransition();

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const prev = document.getElementById(from);
      const q = gsap.utils.selector(section);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const unit = () => window.innerHeight * (window.innerWidth < 768 ? 0.6 : 0.8);
        const stage = q(".ns-stage")[0] as HTMLElement;
        const scenes = q(".ns-scene");
        const one = q(".ns-one")[0] as HTMLElement;
        const oneImg = q(".ns-one__img")[0] as HTMLElement;
        const dark = q(".ns-dark")[0] as HTMLElement;
        const front = q(".ns-front")[0] as HTMLElement;
        const mark = q(".ns-credit__mark")[0] as HTMLElement;
        const ghost = q(".ns-ghost")[0] as HTMLElement;
        const legs = q(".ns-credit__legs")[0] as unknown as SVGPathElement;
        const nav = document.querySelector<HTMLElement>(".nav-logo .logo-mark");

        // Phones and portrait tablets frame the one in the middle, text below
        const tall = () => stage.clientWidth < 768 || stage.clientWidth < stage.clientHeight;

        // The photo covers the stage at its own ratio; when it is wider than
        // the screen it slides so the one stays in view
        const scene = { w: 0, h: 0, l: 0, t: 0 };
        const setScreen = () => {
          wrapRef.current?.style.setProperty("--ns-h", `${window.innerHeight}px`);
          const W = stage.clientWidth;
          const H = stage.clientHeight;
          scene.w = Math.max(W, H * PHOTO_RATIO);
          scene.h = scene.w / PHOTO_RATIO;
          scene.l = scene.w > W ? Math.min(0, Math.max(W - scene.w, W * 0.6 - scene.w * ONE_CX)) : 0;
          scene.t = (H - scene.h) / 2;
          stage.style.setProperty("--sc-w", `${scene.w}px`);
          stage.style.setProperty("--sc-h", `${scene.h}px`);
          stage.style.setProperty("--sc-l", `${scene.l}px`);
          stage.style.setProperty("--sc-t", `${scene.t}px`);
        };
        setScreen();
        ScrollTrigger.addEventListener("refreshInit", setScreen);

        // Where the camera takes the one: right of centre beside the words,
        // or high and centred on tall screens
        const push = () => (tall() ? 2.2 : 2.4);
        const shotX = () => (tall() ? 0.5 : 0.68) * stage.clientWidth - (scene.l + scene.w * ONE_CX);
        const shotY = () => (tall() ? 0.36 : 0.5) * stage.clientHeight - (scene.t + scene.h * ONE_CY);

        // The section before holds still while this one slides over it, each
        // of its layers drifting left at its own pace
        if (prev) {
          const layers = prev.querySelectorAll<HTMLElement>("[data-parallax-layer]");
          const exit = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: prev,
              start: "bottom bottom",
              end: () => `+=${unit()}`,
              pin: true,
              pinSpacing: false,
              scrub: 0.8,
              invalidateOnRefresh: true,
              refreshPriority: 2,
            },
          });
          if (layers.length) {
            layers.forEach((l) => {
              const d = EXIT_DEPTH[l.dataset.parallaxLayer ?? ""] ?? 0.3;
              exit.to(l, { x: () => -window.innerWidth * d, opacity: d > 0.5 ? 0 : 0.5, duration: 1 }, 0);
            });
          } else {
            exit.to(prev.children, { x: () => -window.innerWidth * 0.32, opacity: 0.25, duration: 1 }, 0);
          }
        }

        /* ── The spotlight: steered by the cursor (or a tap), drifting on its
           own when left alone, and pulled onto the one as `lock` rises. The
           one shows in colour wherever the light finds them. ── */
        const state = { lock: 0, color: 0, rise: 0 };
        const pointer = { x: -1, y: -1, at: -1e9 };
        const pos = { x: 0, y: 0, ready: false };
        const tilt = { x: 0, y: 0 };
        let raf = 0;

        const onPointer = (e: PointerEvent) => {
          if (e.type === "pointermove" && e.pointerType !== "mouse") return;
          const r = stage.getBoundingClientRect();
          pointer.x = e.clientX - r.left;
          pointer.y = e.clientY - r.top;
          pointer.at = performance.now();
        };
        stage.addEventListener("pointermove", onPointer);
        stage.addEventListener("pointerdown", onPointer);

        const drift = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const written = new Map<string, string>();
        const write = (el: HTMLElement, prop: string, value: string) => {
          const key = `${el.className}|${prop}`;
          if (written.get(key) === value) return;
          written.set(key, value);
          el.style.setProperty(prop, value);
        };

        const frame = (now: number) => {
          raf = requestAnimationFrame(frame);
          const W = stage.clientWidth;
          const H = stage.clientHeight;
          const b = boxIn(one, stage);
          const cx = b.x + b.w / 2;
          const cy = b.y + b.h / 2;

          // Steered for 2.5s after the last move, then it wanders the rows
          const t = now / 1000;
          // Touch screens: the light rests on the crowd (a tap still moves it),
          // so a phone is not repainting the whole stage every frame
          const steered = now - pointer.at < 2500;
          const tx = steered ? pointer.x : W * (drift ? 0.5 + Math.sin(t * 0.45) * 0.3 : 0.42);
          const ty = steered ? pointer.y : H * (drift ? 0.6 + Math.sin(t * 0.7 + 1.2) * 0.14 : 0.62);
          if (!pos.ready) Object.assign(pos, { x: tx, y: ty, ready: true });
          pos.x += (tx - pos.x) * 0.1;
          pos.y += (ty - pos.y) * 0.1;

          const lock = state.lock * state.lock * (3 - 2 * state.lock);
          const search = Math.min(W, H) * 0.26;
          const sx = pos.x + (cx - pos.x) * lock;
          const sy = pos.y + (cy - pos.y) * lock;
          const sr = search + (Math.max(b.h * 0.85, 64) - search) * lock;
          // Written only when they change: every write repaints the stage
          write(dark, "--sx", `${sx.toFixed(1)}px`);
          write(dark, "--sy", `${sy.toFixed(1)}px`);
          write(dark, "--sr", `${sr.toFixed(1)}px`);

          // Once found they lean, a little, towards the visitor's cursor
          const live = steered ? 1 : 0;
          const goalX = live * clamp01(state.color) * ((pointer.x - cx) / W) * 16;
          const goalY = live * clamp01(state.color) * ((pointer.y - cy) / H) * -10;
          tilt.x += (goalX - tilt.x) * 0.08;
          tilt.y += (goalY - tilt.y) * 0.08;
          // ...and rise out of their seat, the shadow beneath them growing
          const rise = state.rise;
          write(
            oneImg,
            "transform",
            `translateY(${(-rise * 7).toFixed(2)}%) rotateY(${tilt.x.toFixed(2)}deg) rotateX(${tilt.y.toFixed(2)}deg) scale(${(1 + state.color * 0.03 + rise * 0.05).toFixed(3)})`,
          );
          write(
            oneImg,
            "filter",
            `drop-shadow(0 ${(10 + rise * 12).toFixed(1)}px ${(14 + rise * 10).toFixed(1)}px rgba(0, 0, 0, ${(0.55 + rise * 0.2).toFixed(2)}))`,
          );
        };
        let running = false;
        const run = (on: boolean) => {
          if (on === running) return;
          running = on;
          cancelAnimationFrame(raf);
          if (on) raf = requestAnimationFrame(frame);
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${unit() * TOTAL}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            refreshPriority: 1,
            // The light runs only while the stage is on screen: the pin
            // starts with the hero's, so wait until the stage slides in
            onUpdate: (self) => run(self.isActive && self.progress > 0.08),
            onToggle: (self) => run(self.isActive && self.progress > 0.08),
          },
        });

        // The slide in (x: 0 too: GSAP reads the CSS starting offset as a px x)
        tl.fromTo(stage, { x: 0, xPercent: 100 }, { x: 0, xPercent: 0, duration: 0.9, ease: "power2.inOut" }, 0);

        // The headline, then the house lights go down and the search begins
        // y: 0 too: on a refresh GSAP re-reads the hidden offset as px
        tl.fromTo(q(".ns-title--a .rw-i"), { y: 0, yPercent: 115 }, { y: 0, yPercent: 0, duration: 0.35, stagger: 0.04, ease: "power3.out" }, 0.6);
        tl.fromTo(dark, { "--dark": 0 }, { "--dark": 0.86, duration: 0.3 }, 0.85);
        // The front row has no spotlight: it darkens with the house lights
        tl.fromTo(q(".ns-front__shade"), { opacity: 0 }, { opacity: 0.86, duration: 0.3 }, 0.85);
        // Depth: the front row rises over the rows behind faster than they
        // move, as if the camera sank between them (up only: it covers what
        // it passes, so the seam never opens)
        tl.fromTo(front, { y: 0 }, { y: () => -scene.h * 0.014, duration: 1.7, ease: "power1.inOut" }, 0.85);
        tl.fromTo(q(".ns-beat--0, .ns-hint"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.95);
        // The camera breathes in a little while the light searches
        tl.fromTo(scenes, { scale: 1 }, { scale: 1.06, duration: 0.8 }, 0.85);

        // Found: the light settles on the one, who turns to colour
        tl.to(q(".ns-beat--0, .ns-hint"), { autoAlpha: 0, y: -10, duration: 0.15 }, 1.65);
        tl.to(state, { lock: 1, duration: 0.35, ease: "power1.inOut" }, 1.65);
        tl.to(state, { color: 1, duration: 0.2 }, 1.78);
        tl.to(state, { rise: 1, duration: 0.5, ease: "power2.inOut" }, 1.7);
        // Focus pull: the crowd behind him goes soft; he stays sharp
        tl.fromTo(q(".ns-crowd--soft"), { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.inOut" }, 1.75);
        tl.fromTo(q(".ns-beat--1"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.15, ease: "power2.out" }, 1.8);
        tl.to(q(".ns-head--a"), { autoAlpha: 0, y: -16, duration: 0.25 }, 1.9);

        // The camera pushes in on them while the rest of the crowd disappears
        tl.to(scenes, { scale: push, x: shotX, y: shotY, duration: 0.55, ease: "power2.inOut" }, 2.0);
        tl.to(dark, { "--dark": 0.97, duration: 0.45 }, 2.05);
        tl.to(q(".ns-front__shade"), { opacity: 0.97, duration: 0.45 }, 2.05);
        tl.to(q(".ns-beat--1"), { autoAlpha: 0, y: -10, duration: 0.12 }, 2.05);
        tl.fromTo(q(".ns-beat--2"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.15, ease: "power2.out" }, 2.15);
        tl.to(q(".ns-beat--2"), { autoAlpha: 0, y: -10, duration: 0.12 }, 2.55);

        // "That one is you.", then who makes sure of it, then what to do now
        tl.fromTo(q(".ns-title--b .rw-i"), { y: 0, yPercent: 115 }, { y: 0, yPercent: 0, duration: 0.3, stagger: 0.04, ease: "power3.out" }, 2.6);
        tl.fromTo(q(".ns-sign"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 2.85);
        tl.fromTo(legs, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.25, ease: "power1.inOut" }, 2.9);
        tl.fromTo(q(".ns-credit__fill"), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 3.12);
        tl.fromTo(q(".ns-cta"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 3.15);

        // The mark flies up into the navbar logo, which answers with a nudge
        tl.fromTo(
          ghost,
          {
            x: () => boxIn(mark, stage).x,
            y: () => boxIn(mark, stage).y,
            width: () => boxIn(mark, stage).w,
            height: () => boxIn(mark, stage).h,
          },
          {
            x: () => (nav ? boxIn(nav, stage).x : 0),
            y: () => (nav ? boxIn(nav, stage).y : 0),
            width: () => nav?.getBoundingClientRect().width ?? 24,
            height: () => nav?.getBoundingClientRect().height ?? 24,
            duration: 0.4,
            ease: "power3.inOut",
            // Measured when the flight starts, not at load: the signature has
            // only reached its place by then
            immediateRender: false,
          },
          3.45,
        );
        tl.fromTo(ghost, { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, 3.45);
        tl.fromTo(mark, { opacity: 1 }, { opacity: 0, duration: 0.02 }, 3.45);
        // Royal on the light signature card, ice in flight, the logo's own colour on landing
        tl.fromTo(ghost, { color: "#0b3d91" }, { color: "#e8f6ff", duration: 0.15, immediateRender: false }, 3.45);
        tl.to(ghost, { color: () => (nav ? getComputedStyle(nav).color : "#041b3f"), duration: 0.1 }, 3.75);
        tl.to(ghost, { opacity: 0, duration: 0.06 }, 3.85);
        if (nav) {
          tl.fromTo(nav, { scale: 1 }, { scale: 1.3, duration: 0.06, ease: "power2.out", transformOrigin: "50% 50%" }, 3.85);
          tl.to(nav, { scale: 1, duration: 0.08, ease: "power2.inOut" }, 3.91);
        }
        tl.to({}, { duration: TOTAL - 3.99 }, 3.99);

        return () => {
          run(false);
          stage.removeEventListener("pointermove", onPointer);
          stage.removeEventListener("pointerdown", onPointer);
          ScrollTrigger.removeEventListener("refreshInit", setScreen);
          if (nav) gsap.set(nav, { clearProps: "transform" });
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [from] },
  );

  const go = (href: string, color: string, label: string) => (e: React.MouseEvent<HTMLElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    transitionTo(href, e.currentTarget as HTMLElement, color, label);
  };

  const oneBox: React.CSSProperties = {
    left: `${ONE.left}%`,
    top: `${ONE.top}%`,
    width: `${ONE.width}%`,
    height: `${ONE.height}%`,
  };

  return (
    // The wrapper overlaps the hero's screen (margin -1 screen), so this pin
    // starts on the same scroll as the hero's: the hero holds, this slides over
    <div ref={wrapRef} className="ns-wrap">
      <section ref={sectionRef} id="noise" className="ns" aria-labelledby="ns-title-a">
        <noscript>
          <style>{`.ns-wrap{margin-top:0}.ns-stage{transform:none!important}.ns-beat,.ns-hint{display:none}.ns-dark{--dark:.55!important}.ns-one{opacity:1!important}.ns-title .rw-i{transform:none!important}.ns-sign,.ns-cta{opacity:1!important;visibility:visible!important;transform:none!important}.ns-credit__legs{stroke-dashoffset:0}.ns-credit__fill{opacity:1}`}</style>
        </noscript>
        <div className="ns-stage" data-cursor="minimal">
          {/* The crowd, in grey */}
          <div className="ns-scene ns-scene--crowd">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="ns-crowd"
              src="/stand-out/crowd-2000.webp"
              srcSet="/stand-out/crowd-1000.webp 1000w, /stand-out/crowd-2000.webp 2000w"
              sizes="(max-aspect-ratio: 3/2) 150vh, 100vw"
              width={2000}
              height={1333}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              alt="A cinema audience in grey, with one young man in a royal-blue tracksuit shown in colour."
            />
            {/* The same crowd out of focus, for the focus pull */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="ns-crowd ns-crowd--soft"
              src="/stand-out/crowd-soft.webp"
              width={1000}
              height={667}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              alt=""
              aria-hidden="true"
            />
          </div>

          {/* The house lights, with the spotlight cut out of them */}
          <div className="ns-dark" aria-hidden="true" />

          {/* The one, in colour, in register with the crowd beneath */}
          <div className="ns-scene ns-scene--one" aria-hidden="true">
            <div className="ns-one" style={oneBox}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ns-one__img" src="/stand-out/standout.webp" alt="" loading="lazy" decoding="async" />
            </div>
          </div>

          {/* The front row again, cut along their heads, in front of him: it
              moves at its own pace for depth (the same file, already loaded) */}
          <div className="ns-scene ns-scene--front" aria-hidden="true">
            <div className="ns-front">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="ns-crowd"
                src="/stand-out/crowd-2000.webp"
                srcSet="/stand-out/crowd-1000.webp 1000w, /stand-out/crowd-2000.webp 2000w"
                sizes="(max-aspect-ratio: 3/2) 150vh, 100vw"
                width={2000}
                height={1333}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                alt=""
              />
              <div className="ns-front__shade" />
            </div>
          </div>

          <div className="ns-grain" aria-hidden="true" />

          <header className="ns-head ns-head--a">
            <h2 id="ns-title-a" className="ns-title ns-title--a">
              <span className="ns-line"><RevealText>Stand out from</RevealText></span>{" "}
              <span className="ns-line"><RevealText>the <em>noise.</em></RevealText></span>
            </h2>
          </header>

          <div className="ns-beats">
            {BEATS.map((line, i) => (
              <p key={line} className={`ns-beat ns-beat--${i}`}>
                {line}
              </p>
            ))}
            <p className="ns-hint" aria-hidden="true">
              <span className="ns-hint--mouse">Move your cursor to search the crowd</span>
              <span className="ns-hint--touch">Tap the crowd to look around</span>
            </p>
          </div>

          {/* The payoff: who it is, who makes sure of it, what to do now */}
          <div className="ns-final">
            <h3 className="ns-title ns-title--b">
              <span className="ns-line"><RevealText>That one</RevealText></span>{" "}
              <span className="ns-line"><RevealText>is <em>you.</em></RevealText></span>
            </h3>
            <div className="ns-sign">
              <p className="ns-sign__lead">I make sure of it.</p>
              <div className="ns-credit">
                <svg className="ns-credit__mark" viewBox="0 0 48 48" aria-hidden="true">
                  <path className="ns-credit__legs" d={LOGO_LEGS} pathLength={1} />
                  <path className="ns-credit__fill" d={LOGO_LEGS} />
                  <rect className="ns-credit__cursor" {...LOGO_CURSOR} />
                </svg>
                <span className="ns-credit__text">
                  <span>
                    Designed &amp; built by <b>Ahmad Barkat</b>
                  </span>
                  <a href={EMAIL_HREF} className="ns-credit__mail">
                    {CONTACT_EMAIL}
                  </a>
                </span>
              </div>
            </div>
            <div className="ns-cta">
              <ButtonWithIcon onClick={go("/contact", "#3BA7F2", "CONTACT")}>Make my site stand out</ButtonWithIcon>
              <a href="/projects" className="ftr-link ns-cta__link" onClick={go("/projects", "#0B3D91", "PROJECTS")}>
                <TextRoll className="ftr-link__roll" style={{ lineHeight: 1.25 }}>
                  See real projects
                </TextRoll>
              </a>
            </div>
          </div>

          {/* The mark on its way to the navbar */}
          <span className="ns-ghost" aria-hidden="true">
            <LogoMark />
          </span>
        </div>
      </section>
    </div>
  );
}

export default NoiseSection;
