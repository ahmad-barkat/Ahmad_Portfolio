"use client";

/**
 * PRELOADER — shows before the loading screen while frames load.
 * Displays an animated green particle tunnel / "warp drive" effect
 * using pure Canvas — no dependencies other than GSAP.
 *
 * While this plays, the 300 4K laptop frames are preloading in the background.
 * Once enough frames are ready, onReady() is called → transitions to LoadingScreen.
 */

import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";

interface PreloaderProps {
  onReady: () => void;
  totalFrames: number;
  imagesRef: React.MutableRefObject<(HTMLImageElement | null)[]>;
  loadedRef: React.MutableRefObject<boolean[]>;
}

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
}

const STAR_COUNT   = 800;
const READY_THRESHOLD = 0.25; // start loading screen after 25% frames loaded

export default function Preloader({ onReady, totalFrames, imagesRef, loadedRef }: PreloaderProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const rootRef      = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number | null>(null);
  const starsRef     = useRef<Star[]>([]);
  const speedRef     = useRef(3);
  const calledRef    = useRef(false);
  const progressRef  = useRef(0);
  const barRef       = useRef<HTMLDivElement>(null);
  const labelRef     = useRef<HTMLSpanElement>(null);
  const dotRef       = useRef<HTMLDivElement>(null);

  const initStars = useCallback((w: number, h: number) => {
    starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
      x:  (Math.random() - 0.5) * w * 2,
      y:  (Math.random() - 0.5) * h * 2,
      z:  Math.random() * w,
      pz: 0,
    }));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Fade trail
    ctx.fillStyle = "rgba(8,28,21,0.25)";
    ctx.fillRect(0, 0, W, H);

    const speed = speedRef.current;

    starsRef.current.forEach((star) => {
      star.pz = star.z;
      star.z  -= speed;

      if (star.z <= 0) {
        star.x  = (Math.random() - 0.5) * W * 2;
        star.y  = (Math.random() - 0.5) * H * 2;
        star.z  = W;
        star.pz = W;
      }

      const sx  = (star.x / star.z)  * W + cx;
      const sy  = (star.y / star.z)  * H + cy;
      const px  = (star.x / star.pz) * W + cx;
      const py  = (star.y / star.pz) * H + cy;

      const size    = Math.max(0.1, (1 - star.z / W) * 2.5);
      const alpha   = Math.min(1, (1 - star.z / W) * 1.4);

      // Color: near = bright mint, far = dark green
      const t = 1 - star.z / W;
      const r = Math.round(82  * t + 27  * (1 - t));
      const g = Math.round(183 * t + 106 * (1 - t));
      const b = Math.round(136 * t + 79  * (1 - t));

      ctx.beginPath();
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth   = size;
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    });

    // Center glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.15);
    grad.addColorStop(0,   "rgba(82,183,136,0.12)");
    grad.addColorStop(0.5, "rgba(64,145,108,0.04)");
    grad.addColorStop(1,   "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }, []);

  const loop = useCallback(() => {
    draw();

    // Check how many frames are loaded
    const loaded = loadedRef.current.filter(Boolean).length;
    const pct    = loaded / totalFrames;
    progressRef.current = pct;

    if (barRef.current)  barRef.current.style.width = `${pct * 100}%`;
    if (labelRef.current) labelRef.current.textContent = `${Math.round(pct * 100)}%`;

    // Accelerate stars as we near ready
    speedRef.current = 3 + pct * 18;

    if (pct >= READY_THRESHOLD && !calledRef.current) {
      calledRef.current = true;

      // Warp speed burst then exit
      gsap.to(speedRef, {
        current: 80,
        duration: 0.8,
        ease: "power3.in",
        onComplete: () => {
          gsap.to(rootRef.current, {
            autoAlpha: 0,
            duration:  0.5,
            ease:      "power2.inOut",
            onComplete: () => {
              if (rafRef.current) cancelAnimationFrame(rafRef.current);
              onReady();
            },
          });
        },
      });
      return; // stop scheduling new frames, GSAP takes over
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [draw, totalFrames, loadedRef, onReady]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars(canvas.width, canvas.height);
  }, [initStars]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize, { passive: true });
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [resize, loop]);

  return (
    <div
      ref={rootRef}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        backgroundColor: "#081C15",
        overflow: "hidden",
      }}
    >
      {/* Star field canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />

      {/* Center content */}
      <div style={{
        position:       "absolute", inset: 0,
        display:        "flex", flexDirection: "column",
        alignItems:     "center", justifyContent: "center",
        pointerEvents:  "none", zIndex: 2,
      }}>
        {/* Monogram */}
        <div ref={dotRef} style={{
          fontFamily:    "Cartefield, serif",
          fontSize:      "clamp(3rem, 10vw, 7rem)",
          color:         "#52B788",
          lineHeight:    1,
          letterSpacing: "0.06em",
          marginBottom:  "clamp(1.5rem, 4vw, 3rem)",
          textShadow:    "0 0 40px rgba(82,183,136,0.4)",
        }}>
          MAB
        </div>

        {/* Status label */}
        <span style={{
          fontFamily:    "var(--font-mono, monospace)",
          fontSize:      "clamp(0.55rem, 1.5vw, 0.75rem)",
          color:         "#40916C",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          marginBottom:  "clamp(1rem, 3vw, 1.8rem)",
        }}>
          Entering the dimension
        </span>

        {/* Progress bar */}
        <div style={{
          width:           "clamp(160px, 35vw, 320px)",
          height:          "1px",
          backgroundColor: "#1B4332",
          position:        "relative",
          overflow:        "hidden",
        }}>
          <div ref={barRef} style={{
            position:        "absolute", left: 0, top: 0,
            height:          "100%", width: "0%",
            backgroundColor: "#52B788",
            boxShadow:       "0 0 8px #52B788",
            transition:      "width 0.1s linear",
          }} />
        </div>

        {/* Percentage */}
        <span ref={labelRef} style={{
          fontFamily:    "var(--font-mono, monospace)",
          fontSize:      "clamp(0.55rem, 1.4vw, 0.7rem)",
          color:         "#2D6A4F",
          letterSpacing: "0.2em",
          marginTop:     "0.6rem",
        }}>
          0%
        </span>
      </div>

      {/* Corner decoration */}
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => {
        const isTop    = pos.includes("top");
        const isLeft   = pos.includes("left");
        return (
          <div key={pos} style={{
            position: "absolute",
            top:      isTop    ? "clamp(1rem, 3vw, 2rem)" : "auto",
            bottom:   !isTop   ? "clamp(1rem, 3vw, 2rem)" : "auto",
            left:     isLeft   ? "clamp(1rem, 3vw, 2rem)" : "auto",
            right:    !isLeft  ? "clamp(1rem, 3vw, 2rem)" : "auto",
            width:    "clamp(20px, 3vw, 32px)",
            height:   "clamp(20px, 3vw, 32px)",
            borderTop:    isTop  ? "1px solid #2D6A4F" : "none",
            borderBottom: !isTop ? "1px solid #2D6A4F" : "none",
            borderLeft:   isLeft  ? "1px solid #2D6A4F" : "none",
            borderRight:  !isLeft ? "1px solid #2D6A4F" : "none",
            opacity: 0.6,
          }} />
        );
      })}
    </div>
  );
}
