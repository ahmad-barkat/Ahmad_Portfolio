"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { gsap } from "gsap";

// -- Ribbon marquee content --------------------------------------------------
const MARQUEE_BANDS = [
  {
    items: [
      { text: "FRONTEND AS RITUAL", kanji: "覚悟" },
      { text: "THE FUTURE WEARS A MASK", kanji: "侍" },
      { text: "CRAFT OVER HYPE", kanji: "執念" },
      { text: "FRONTEND AS RITUAL", kanji: "覚悟" },
    ],
    direction: "fwd",
  },
  {
    items: [
      { text: "PIXELS ARE A PROMISE", kanji: "無双" },
      { text: "CRAFT OVER HYPE", kanji: "美学" },
      { text: "EGO SOLD SEPARATELY", kanji: "孤高" },
      { text: "PIXELS ARE A PROMISE", kanji: "無双" },
    ],
    direction: "rev",
  },
  {
    items: [
      { text: "CODE LIKE A SAMURAI", kanji: "斬" },
      { text: "NO SECOND TRY", kanji: "魂" },
      { text: "PRECISION & PASSION", kanji: "極" },
      { text: "CODE LIKE A SAMURAI", kanji: "斬" },
    ],
    direction: "fwd",
  },
];

const REPEAT = 4;

interface TrailPoint {
  x: number;
  y: number;
  age: number; // 0 = fresh, 1 = fully faded
  pressure: number; // 0..1 size multiplier
}

export default function HeroSection() {
  const rootRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Raw mouse
  const cursorRaw   = useRef({ x: -9999, y: -9999 });
  // Smoothed lerped cursor
  const cursorSmooth = useRef({ x: -9999, y: -9999 });
  // Velocity for pressure simulation
  const cursorVel   = useRef({ x: 0, y: 0 });

  // Trail points ring buffer
  const trailRef    = useRef<TrailPoint[]>([]);
  const rafRef      = useRef<number | null>(null);
  const canvasReady = useRef(false);
  const isActive    = useRef(false); // mouse entered screen

  // ── Canvas init ────────────────────────────────────────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = "100%";
    canvas.style.height = "100%";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Fill entire canvas with the hero background color so everything
    // starts "covered" — cursor scratches reveal through it
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#081C15";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    canvasReady.current = true;
    canvas.classList.add("ready");
  }, []);

  // ── Draw loop ──────────────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    rafRef.current = requestAnimationFrame(drawLoop);
    const canvas = canvasRef.current;
    if (!canvas || !canvasReady.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── 1. Lerp smooth cursor toward raw mouse ─────────────────────────────
    const lerpFactor = 0.11; // 0.11 = smooth but not sluggish
    const prevX = cursorSmooth.current.x;
    const prevY = cursorSmooth.current.y;

    cursorSmooth.current.x += (cursorRaw.current.x - cursorSmooth.current.x) * lerpFactor;
    cursorSmooth.current.y += (cursorRaw.current.y - cursorSmooth.current.y) * lerpFactor;

    // Velocity magnitude → pressure (bigger blob when moving fast)
    const vx = cursorSmooth.current.x - prevX;
    const vy = cursorSmooth.current.y - prevY;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const pressure = Math.min(1, speed / 12); // normalize 0..1

    const { x, y } = cursorSmooth.current;

    // ── 2. Emit a new trail point every frame if near screen ───────────────
    if (isActive.current && x > -1000) {
      trailRef.current.push({ x, y, age: 0, pressure });
      // Limit trail length to avoid runaway memory
      if (trailRef.current.length > 200) {
        trailRef.current.shift();
      }
    }

    // ── 3. Age existing trail points ───────────────────────────────────────
    //  age increases at 0.008 per frame ≈ ~8 second full fade at 60fps
    //  This creates long, slowly-disappearing water scars
    for (let i = trailRef.current.length - 1; i >= 0; i--) {
      trailRef.current[i].age += 0.008;
      if (trailRef.current[i].age >= 1) {
        trailRef.current.splice(i, 1);
      }
    }

    // ── 4. Re-fill canvas each frame with the overlay color (semi-opaque)
    //  This makes old scars "heal" back — classic water effect
    //  fillRect with very low alpha = slow fade-in of the overlay
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(8, 28, 21, 0.018)"; // very low opacity = slow heal
    ctx.fillRect(0, 0, W, H);

    // ── 5. Erase (reveal) each trail point using destination-out ──────────
    ctx.globalCompositeOperation = "destination-out";

    trailRef.current.forEach((pt) => {
      const fadeOut = 1 - pt.age; // 1 = opaque erase, 0 = transparent
      const baseRadius = W < 768 ? 75 : 120;
      // Bigger when moving fast (pressure), smoothly tapered at edges
      const radius = baseRadius * (0.6 + 0.4 * pt.pressure) * (0.5 + 0.5 * fadeOut);

      const grad = ctx.createRadialGradient(
        pt.x * dpr, pt.y * dpr, 0,
        pt.x * dpr, pt.y * dpr, radius * dpr,
      );
      // Center fully erased, soft Gaussian feather toward edge
      grad.addColorStop(0,    `rgba(0,0,0,${(fadeOut * 0.95).toFixed(3)})`);
      grad.addColorStop(0.45, `rgba(0,0,0,${(fadeOut * 0.75).toFixed(3)})`);
      grad.addColorStop(0.75, `rgba(0,0,0,${(fadeOut * 0.35).toFixed(3)})`);
      grad.addColorStop(1,    "rgba(0,0,0,0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x * dpr, pt.y * dpr, radius * dpr, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = "source-over";

    // ── 6. Draw the glowing cursor ring on top ─────────────────────────────
    if (isActive.current && x > -1000) {
      const ringRadius = (W < 768 ? 34 : 44) * (1 + pressure * 0.25);
      ctx.save();
      ctx.scale(1, 1); // no dpr here — draw in CSS pixels for HiDPI ring

      // Outer diffuse glow
      const glowGrad = ctx.createRadialGradient(
        x * dpr, y * dpr, ringRadius * dpr * 0.6,
        x * dpr, y * dpr, ringRadius * dpr * 2.2,
      );
      glowGrad.addColorStop(0, "rgba(82,183,136,0.18)");
      glowGrad.addColorStop(1, "rgba(82,183,136,0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(x * dpr, y * dpr, ringRadius * dpr * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Crisp glowing ring — drawn with strokeStyle
      ctx.beginPath();
      ctx.arc(x * dpr, y * dpr, ringRadius * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(82,183,136,0.85)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.shadowColor = "#52B788";
      ctx.shadowBlur = 16 * dpr;
      ctx.stroke();

      // Tiny inner dot
      ctx.beginPath();
      ctx.arc(x * dpr, y * dpr, 3 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = "#52B788";
      ctx.shadowColor = "#52B788";
      ctx.shadowBlur = 10 * dpr;
      ctx.fill();

      ctx.restore();
    }
  }, []);

  // ── Mouse handlers ─────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: MouseEvent) => {
    cursorRaw.current.x = e.clientX;
    cursorRaw.current.y = e.clientY;
    if (!isActive.current) {
      cursorSmooth.current.x = e.clientX;
      cursorSmooth.current.y = e.clientY;
      isActive.current = true;
    }
  }, []);

  // Mobile: auto-sweep reveal
  const autoRevealMobile = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    isActive.current = true;
    cursorRaw.current = { x: cx, y: cy };
    cursorSmooth.current = { x: cx, y: cy };
    let t = 0;
    const sweep = setInterval(() => {
      t += 0.018;
      cursorRaw.current.x = cx + Math.sin(t) * cx * 0.7;
      cursorRaw.current.y = cy + Math.cos(t * 0.6) * cy * 0.5;
      if (t > Math.PI * 5) clearInterval(sweep);
    }, 16);
  }, []);

  // ── GSAP entrance animations ───────────────────────────────────────────────
  const runEntryAnimation = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      root.querySelectorAll(".hero-corner"),
      { scale: 0, autoAlpha: 0 },
      { scale: 1, autoAlpha: 0.4, duration: 0.5, stagger: 0.08 },
      0,
    );
    tl.fromTo(
      root.querySelector(".hero-hud-brand"),
      { x: -24, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.7 },
      0.2,
    );
    tl.fromTo(
      root.querySelector(".hero-hud-right"),
      { x: 20, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.7 },
      0.35,
    );
    tl.fromTo(
      root.querySelector(".hero-watermark"),
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 1.0 },
      0.4,
    );
    tl.fromTo(
      [
        root.querySelector(".hero-portrait-base"),
        root.querySelector(".hero-portrait-top"),
      ],
      { scale: 1.06, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.1, stagger: 0.1 },
      0.3,
    );
    tl.fromTo(
      root.querySelectorAll(".hero-marquee-band"),
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.8, stagger: 0.1 },
      0.6,
    );
    tl.fromTo(
      root.querySelector(".hero-hud-scroll"),
      { y: 10, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6 },
      1.0,
    );
  }, []);

  useEffect(() => {
    initCanvas();
    rafRef.current = requestAnimationFrame(drawLoop);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    autoRevealMobile();
    const animTimer = setTimeout(runEntryAnimation, 80);
    const onResize = () => initCanvas();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      clearTimeout(animTimer);
    };
  }, [initCanvas, drawLoop, onMouseMove, autoRevealMobile, runEntryAnimation]);

  return (
    <section ref={rootRef} className="hero-root" aria-label="Hero section">

      {/* 1. Dot-grid texture overlay */}
      <div className="hero-grid-overlay" aria-hidden="true" />

      {/* 2. Bottom portrait — REVEALED when canvas scratch mask is moved */}
      <div className="hero-portrait-base" style={{ opacity: 0 }}>
        <Image
          src="/hero_char_2.png"
          alt="Ahmad Barkat - revealed portrait"
          fill
          priority
          sizes="100vw"
          quality={100}
          style={{ objectFit: "contain", objectPosition: "center bottom" }}
          draggable={false}
        />
      </div>

      {/* 3. Canvas mask for water-scar scratch reveal effect */}
      <canvas
        ref={canvasRef}
        className="hero-mask-canvas"
        aria-hidden="true"
        style={{ mixBlendMode: "multiply" }}
      />

      {/* 4. Top portrait — base masked character (swords) */}
      <div className="hero-portrait-top" style={{ opacity: 0 }}>
        <Image
          src="/hero_char_1.png"
          alt="Ahmad Barkat - base portrait"
          fill
          priority
          sizes="100vw"
          quality={100}
          style={{ objectFit: "contain", objectPosition: "center bottom" }}
          draggable={false}
        />
      </div>

      {/* 5. Giant background watermark text */}
      <div className="hero-watermark" aria-hidden="true">
        AHMAD BARKAT
      </div>

      {/* 6. High-Impact Diagonal Marquee Ribbon Bands */}
      <div className="hero-marquees" aria-hidden="true">
        {MARQUEE_BANDS.map((band, i) => {
          const trackItems = Array.from({ length: REPEAT }, () => band.items).flat();
          return (
            <div key={i} className="hero-marquee-band" style={{ opacity: 0 }}>
              <div className={`hero-marquee-track hero-marquee-track--${band.direction}`}>
                {trackItems.map((item, j) => (
                  <span key={j} className="hero-marquee-item">
                    <span>{item.text}</span>
                    <span className="hero-kanji-tag">{item.kanji}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 7. Green stroke flash */}
      <div className="hero-red-stroke" aria-hidden="true" />

      {/* 8. Corner brackets */}
      <div className="hero-corner hero-corner--tl" aria-hidden="true" />
      <div className="hero-corner hero-corner--tr" aria-hidden="true" />
      <div className="hero-corner hero-corner--bl" aria-hidden="true" />
      <div className="hero-corner hero-corner--br" aria-hidden="true" />

      {/* 9. HUD Chrome Layer */}
      <div className="hero-hud" aria-hidden="true">

        {/* Top-Left: Brand Header */}
        <div className="hero-hud-brand" style={{ opacity: 0 }}>
          <span className="hero-hud-name">Ahmad Barkat</span>
          <span className="hero-hud-sub">PORTFOLIO 25.26</span>
        </div>

        {/* Right Side: Hover Reveal Hint & Available Status */}
        <div className="hero-hud-right" style={{ opacity: 0 }}>
          <div className="hero-reveal-hint">
            <span className="hero-reveal-dot" />
            <span>HOVER TO REVEAL</span>
          </div>
          <span className="hero-hud-status">
            AVAILABLE FOR WORK 2026
          </span>
        </div>

        {/* Bottom-Center: Scroll Hint */}
        <div className="hero-hud-scroll" style={{ opacity: 0 }}>
          <span className="hero-hud-scroll-label">Scroll</span>
          <div className="hero-hud-scroll-line" />
        </div>
      </div>

    </section>
  );
}
