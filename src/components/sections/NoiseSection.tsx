"use client";

import React, { useEffect, useRef, useState } from "react";
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

/* The wall: a grid of look-alike website tiles on a plane tipped away from
   the viewer, so the rows recede like an audience. The centre cell is the
   one site that stands out. Odd counts, so there is a true centre. */
const COLS = 15;
const ROWS = 11;
const CENTRE = Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2);
const TILT = 32; // degrees the wall leans back (kept in step with .ns-grid)

/** How far each layer of the section before this one drifts as it leaves,
    as a share of the screen width: the deeper, the slower (sideways parallax) */
const EXIT_DEPTH: Record<string, number> = { "1": 0.12, "2": 0.24, "3": 0.38, "4": 0.6 };

/** The pain, one line at a time; each one makes the wall more alike */
const PAIN = [
  "One template, reused a thousand times.",
  "The same stock photo. The same “Learn more”.",
  "“We’re passionate about quality.” So is everyone.",
];

/* Scroll units of the pinned sequence (one unit = 0.8 of the screen height,
   0.6 on phones). The order is the argument: the problem, the one that is
   different, who made it, what to do now.
     0    - 1     the wall slides in from the right as the hero drifts away
     1.05 - 1.9   headline, then the pain line by line; the crowd turns uniform
     1.95 - 3.0   the standout site lifts out and becomes a full browser window
     3.0  - 3.5   its credit: Ahmad's mark draws itself, "Designed & built by"
     3.2  - 3.9   "That one? I built it." and the call to action
     4.1  - 4.8   the mark flies up and docks into the navbar logo
     4.8  - 5.2   a beat to act                                                 */
const TOTAL = 5.2;

/* ── The tiles, drawn once per variant on a canvas ──────────────────────────
   The crowd is greyscale on purpose; the one standout tile is drawn in the
   site's colours, so it is the only colour on screen from the first frame. */
function drawTemplate(variant: number | "star"): string {
  const W = 480;
  const H = 300;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return "";
  const css = getComputedStyle(document.documentElement);
  const font = css.getPropertyValue("--font-sans").trim() || "sans-serif";
  const serif = css.getPropertyValue("--font-serif").trim() || "serif";
  const rect = (x: number, y: number, w: number, h: number, col: string | CanvasGradient, r = 0) => {
    g.fillStyle = col;
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fill();
  };
  const text = (t: string, x: number, y: number, size: number, col: string, weight = 700, align: CanvasTextAlign = "left", family = font) => {
    g.fillStyle = col;
    g.font = `${weight} ${size}px ${family}`;
    g.textAlign = align;
    g.fillText(t, x, y);
  };

  if (variant === "star") {
    // "Your Brand": deep royal, one bold promise, art in the site's colours
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0e418f");
    bg.addColorStop(1, "#061f4a");
    rect(0, 0, W, H, bg);
    text("Your", 22, 36, 16, "#e8f6ff", 800);
    text("Brand", 64, 36, 16, "#7fe7d6", 800);
    [270, 312, 354].forEach((x) => rect(x, 26, 30, 6, "rgba(232,246,255,0.45)", 3));
    rect(400, 18, 60, 22, "#7fe7d6", 11);
    text("Be the one", 24, 104, 30, "#e8f6ff", 800);
    text("they", 24, 138, 30, "#e8f6ff", 800);
    text("remember.", 92, 140, 34, "#7fe7d6", 400, "left", serif);
    rect(24, 156, 170, 7, "rgba(232,246,255,0.4)", 3);
    rect(24, 182, 104, 30, "#e8f6ff", 15);
    text("Get started", 76, 202, 12, "#0b3d91", 800, "center");
    const art = g.createRadialGradient(360, 130, 10, 360, 130, 120);
    art.addColorStop(0, "#7fe7d6");
    art.addColorStop(0.45, "#3ba7f2");
    art.addColorStop(1, "rgba(59,167,242,0)");
    g.fillStyle = art;
    g.beginPath();
    g.arc(360, 130, 110, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e8f6ff";
    g.beginPath();
    g.arc(392, 104, 22, 0, Math.PI * 2);
    g.fill();
    [24, 172, 320].forEach((x) => rect(x, 236, 136, 46, "rgba(232,246,255,0.08)", 8));
    return c.toDataURL("image/webp", 0.9);
  }

  // The stock photo: the universal image placeholder, a sun over two hills
  const photo = (x: number, y: number, w: number, h: number) => {
    rect(x, y, w, h, "#9aa0a8", 8);
    g.save();
    g.beginPath();
    g.roundRect(x, y, w, h, 8);
    g.clip();
    g.fillStyle = "#b9bec5";
    g.beginPath();
    g.arc(x + w * 0.72, y + h * 0.3, h * 0.11, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#7d838c";
    g.beginPath();
    g.moveTo(x, y + h);
    g.lineTo(x + w * 0.34, y + h * 0.48);
    g.lineTo(x + w * 0.6, y + h);
    g.fill();
    g.fillStyle = "#6c727a";
    g.beginPath();
    g.moveTo(x + w * 0.38, y + h);
    g.lineTo(x + w * 0.7, y + h * 0.58);
    g.lineTo(x + w, y + h * 0.9);
    g.lineTo(x + w, y + h);
    g.fill();
    g.restore();
  };

  rect(0, 0, W, H, "#d3d6db");
  rect(22, 20, 18, 18, "#6c727a", 4);
  text("LOGO", 48, 35, 15, "#5d636b", 800);
  [270, 310, 350, 390].forEach((x) => rect(x, 26, 28, 6, "#a3a8af", 3));
  rect(426, 19, 36, 20, "#7d838c", 10);

  if (variant === 0) {
    text("We are passionate", 24, 98, 27, "#4a5058", 800);
    text("about quality.", 24, 130, 27, "#4a5058", 800);
    rect(24, 146, 170, 7, "#a3a8af", 3);
    rect(24, 160, 140, 7, "#a3a8af", 3);
    rect(24, 182, 96, 28, "#6c727a", 14);
    text("Learn more", 72, 201, 12, "#d3d6db", 700, "center");
    photo(250, 66, 206, 148);
  } else if (variant === 1) {
    photo(24, 62, 432, 120);
    text("Welcome to our website", W / 2, 120, 24, "#eef0f2", 800, "center");
    rect(192, 136, 96, 26, "#d3d6db", 13);
    text("Learn more", W / 2, 154, 12, "#5d636b", 700, "center");
    rect(24, 196, 200, 7, "#a3a8af", 3);
  } else {
    photo(24, 66, 206, 148);
    text("Solutions for", 250, 98, 26, "#4a5058", 800);
    text("your business.", 250, 129, 26, "#4a5058", 800);
    rect(250, 146, 180, 7, "#a3a8af", 3);
    rect(250, 160, 150, 7, "#a3a8af", 3);
    rect(250, 182, 96, 28, "#6c727a", 14);
    text("Get started", 298, 201, 12, "#d3d6db", 700, "center");
  }
  [24, 172, 320].forEach((x) => {
    rect(x, 232, 136, 52, "#c3c7cd", 8);
    g.fillStyle = "#9aa0a8";
    g.beginPath();
    g.arc(x + 22, 258, 10, 0, Math.PI * 2);
    g.fill();
    rect(x + 42, 250, 70, 6, "#a3a8af", 3);
    rect(x + 42, 262, 50, 6, "#b3b8be", 3);
  });
  return c.toDataURL("image/webp", 0.82);
}

/** Each tile's own template before the wall turns uniform (fixed, not random) */
const variantOf = (i: number) => (i * 7 + Math.floor(i / COLS)) % 3;

/** A box's place and size relative to another element's top-left */
function boxIn(el: Element, origin: Element) {
  const a = el.getBoundingClientRect();
  const o = origin.getBoundingClientRect();
  return { x: a.left - o.left, y: a.top - o.top, w: a.width, h: a.height };
}

/**
 * "Stand out from the noise": the problem, the one that is different, who
 * made it, and what to do now. The section before (the hero) pins and drifts
 * away, each of its layers at its own pace, as this screen slides in sideways
 * over it: a wall of grey look-alike websites with one site in colour. Three
 * lines of pain make the crowd ever more alike; then the standout site lifts
 * out into a full browser window, Ahmad's mark draws itself in its credit,
 * the call to action appears, and the mark flies up into the navbar logo.
 */
export function NoiseSection({ from = "hero" }: { from?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tiles, setTiles] = useState<{ t: string[]; star: string } | null>(null);
  const { transitionTo } = usePageTransition();

  // The templates, drawn once the fonts are in
  useEffect(() => {
    let gone = false;
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!gone) setTiles({ t: [0, 1, 2].map((v) => drawTemplate(v)), star: drawTemplate("star") });
    });
    return () => {
      gone = true;
    };
  }, []);

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
        const wall = q(".ns-wall")[0] as HTMLElement;
        const star = q(".ns-star")[0] as HTMLElement;
        const win = q(".ns-window")[0] as HTMLElement;
        const mark = q(".ns-credit__mark")[0] as HTMLElement;
        const ghost = q(".ns-ghost")[0] as HTMLElement;
        const legs = q(".ns-credit__legs")[0] as unknown as SVGPathElement;
        const nav = document.querySelector<HTMLElement>(".nav-logo .logo-mark");

        // One screen, measured the way ScrollTrigger measures it (phones'
        // vh and innerHeight differ while the address bar moves)
        // The window's real height places the pitch under it on phones
        const setScreen = () => {
          wrapRef.current?.style.setProperty("--ns-h", `${window.innerHeight}px`);
          wrapRef.current?.style.setProperty("--ns-win-h", `${win.offsetHeight}px`);
        };
        setScreen();
        ScrollTrigger.addEventListener("refreshInit", setScreen);
        const ro = new ResizeObserver(setScreen);
        ro.observe(win);

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
          },
        });

        // The slide in (x: 0 too: GSAP reads the CSS starting offset as a px x)
        tl.fromTo(stage, { x: 0, xPercent: 100 }, { x: 0, xPercent: 0, duration: 1, ease: "power2.inOut" }, 0);

        // Headline, then the pain, line by line; the crowd turns uniform with it
        tl.fromTo(q(".ns-title--a .rw-i"), { yPercent: 115 }, { yPercent: 0, duration: 0.45, stagger: 0.04, ease: "power3.out" }, 1.05);
        tl.fromTo(q(".ns-pain__label"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, 1.15);
        q(".ns-pain__line").forEach((line, i) => {
          tl.fromTo(line, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, 1.25 + i * 0.22);
        });
        tl.fromTo(wall, { "--same": 0 }, { "--same": 1, duration: 0.7 }, 1.25);

        // The standout lifts out of the wall and turns to face the viewer
        // (rotateX -TILT undoes the wall's lean); the crowd dims
        tl.fromTo(star, { rotationX: 0, z: 0, scale: 1 }, { rotationX: -TILT, z: 80, scale: 1.7, duration: 0.5, ease: "power2.in" }, 1.95);
        tl.fromTo(wall, { "--dim": 0 }, { "--dim": 1, duration: 0.8 }, 1.95);
        tl.to(q(".ns-head--a, .ns-pain"), { opacity: 0, y: -16, duration: 0.35 }, 2.0);

        // ...and becomes the full browser window: the window starts on the
        // tile's box on screen and grows into its own place
        tl.fromTo(
          win,
          {
            autoAlpha: 0,
            x: () => boxIn(star, stage).x - win.offsetLeft,
            y: () => boxIn(star, stage).y - win.offsetTop,
            scale: () => boxIn(star, stage).w / win.offsetWidth,
          },
          { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.7, ease: "power3.inOut" },
          2.3,
        );
        tl.to(star, { opacity: 0, duration: 0.15 }, 2.4);

        // Who made it: the mark draws itself, then the credit
        tl.fromTo(q(".ns-credit"), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, 3);
        tl.fromTo(legs, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.35, ease: "power1.inOut" }, 3.05);
        tl.fromTo(q(".ns-credit__fill"), { opacity: 0 }, { opacity: 1, duration: 0.15 }, 3.35);
        tl.fromTo(q(".ns-credit__text > *"), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.08, ease: "power2.out" }, 3.15);

        // The claim and the call to action
        tl.fromTo(q(".ns-title--b .rw-i"), { yPercent: 115 }, { yPercent: 0, duration: 0.45, stagger: 0.05, ease: "power3.out" }, 3.2);
        tl.fromTo(q(".ns-lede"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 3.45);
        tl.fromTo(q(".ns-cta"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 3.6);

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
            duration: 0.6,
            ease: "power3.inOut",
            // Measured when the flight starts, not at load: the window has
            // only reached its place by then
            immediateRender: false,
          },
          4.1,
        );
        tl.fromTo(ghost, { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, 4.1);
        tl.fromTo(mark, { opacity: 1 }, { opacity: 0, duration: 0.02 }, 4.1);
        // Royal on the light credit bar, ice in flight, the logo's own colour on landing
        tl.fromTo(ghost, { color: "#0b3d91" }, { color: "#e8f6ff", duration: 0.2, immediateRender: false }, 4.1);
        tl.to(ghost, { color: () => (nav ? getComputedStyle(nav).color : "#041b3f"), duration: 0.15 }, 4.55);
        tl.to(ghost, { opacity: 0, duration: 0.08 }, 4.7);
        if (nav) {
          tl.fromTo(nav, { scale: 1 }, { scale: 1.3, duration: 0.08, ease: "power2.out", transformOrigin: "50% 50%" }, 4.7);
          tl.to(nav, { scale: 1, duration: 0.12, ease: "power2.inOut" }, 4.78);
        }
        tl.to({}, { duration: TOTAL - 4.9 }, 4.9);

        return () => {
          ro.disconnect();
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

  return (
    // The wrapper overlaps the hero's screen (margin -1 screen), so this pin
    // starts on the same scroll as the hero's: the hero holds, this slides over
    <div ref={wrapRef} className="ns-wrap">
      <section ref={sectionRef} id="noise" className="ns" aria-labelledby="ns-title-b">
        <noscript>
          <style>{`.ns-wrap{margin-top:0}.ns-stage{transform:none!important}.ns-head--a,.ns-pain{display:none}.ns-title--b .rw-i{transform:none!important}.ns-window,.ns-credit,.ns-credit__text>*,.ns-lede,.ns-cta{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <div className="ns-stage">
          <div
            className="ns-wall"
            aria-hidden="true"
            style={
              tiles
                ? ({
                    "--ns-t0": `url(${tiles.t[0]})`,
                    "--ns-t1": `url(${tiles.t[1]})`,
                    "--ns-t2": `url(${tiles.t[2]})`,
                    "--ns-star": `url(${tiles.star})`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <div className="ns-plane">
              <div className="ns-grid">
                {Array.from({ length: COLS * ROWS }, (_, i) =>
                  i === CENTRE ? (
                    <div key={i} className="ns-tile ns-star">
                      <span className="ns-star__face" />
                    </div>
                  ) : (
                    <div key={i} className="ns-tile" data-v={variantOf(i)} />
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Act one: the problem */}
          <header className="ns-head ns-head--a">
            <h2 className="ns-title ns-title--a">
              <span className="ns-line"><RevealText>Stand out from</RevealText></span>{" "}
              <span className="ns-line"><RevealText>the <em>noise…</em></RevealText></span>
            </h2>
          </header>

          <div className="ns-pain">
            <p className="ns-pain__label">Most websites, every day</p>
            {PAIN.map((line) => (
              <p key={line} className="ns-pain__line">
                {line}
              </p>
            ))}
          </div>

          {/* Act two: the one that is different, and who made it */}
          <div className="ns-window">
            <div className="ns-browser">
              <div className="ns-browser__bar" aria-hidden="true">
                <i />
                <i />
                <i />
                <span className="ns-browser__url">yourbrand.com</span>
              </div>
              <div className="ns-site" aria-hidden="true">
                <div className="ns-site__nav">
                  <b>
                    Your<span>Brand</span>
                  </b>
                  <span>Work</span>
                  <span>About</span>
                  <span>Contact</span>
                  <em>Book a call</em>
                </div>
                <div className="ns-site__hero">
                  <div className="ns-site__copy">
                    <small>Your city · Since day one</small>
                    <strong>
                      Be the one they <em>remember.</em>
                    </strong>
                    <p>One clear promise, told your way, on a site that loads before they lose interest.</p>
                    <div className="ns-site__actions">
                      <span className="ns-site__btn">Get started</span>
                      <span className="ns-site__link">See how it works</span>
                    </div>
                  </div>
                  <div className="ns-site__art">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
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
          </div>

          {/* Act three: the claim, and what to do now */}
          <div className="ns-pitch">
            <h2 id="ns-title-b" className="ns-title ns-title--b">
              <span className="ns-line"><RevealText>That one?</RevealText></span>{" "}
              <span className="ns-line"><RevealText>I <em>built</em> it.</RevealText></span>
            </h2>
            <p className="ns-lede">
              A site that looks like no one else&rsquo;s and turns visitors into enquiries. Yours could be the next one they remember.
            </p>
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
