"use client";

/**
 * TIME TRAVEL TUNNEL
 * Triggered after user scrolls to the end of the laptop scene.
 * Canvas-based warp tunnel → streaks of light → emerges into the portfolio.
 * Pure Canvas + GSAP, no external assets.
 */

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { gsap } from "gsap";

export interface TimeTunnelHandle {
  play: (onDone: () => void) => void;
}

interface Streak {
  angle:  number;
  dist:   number;
  speed:  number;
  length: number;
  alpha:  number;
  color:  string;
  width:  number;
}

const STREAK_COUNT = 300;
const COLORS = [
  "#D8F3DC", "#B7E4C7", "#95D5B2",
  "#74C69D", "#52B788", "#40916C",
  "#ffffff",
];

function makeStreak(W: number, H: number): Streak {
  const maxDist = Math.sqrt(W * W + H * H) * 0.6;
  return {
    angle:  Math.random() * Math.PI * 2,
    dist:   Math.random() * maxDist * 0.2 + 20,
    speed:  Math.random() * 18 + 6,
    length: Math.random() * 120 + 40,
    alpha:  Math.random() * 0.8 + 0.2,
    color:  COLORS[Math.floor(Math.random() * COLORS.length)],
    width:  Math.random() * 1.5 + 0.3,
  };
}

const TimeTravelTunnel = forwardRef<TimeTunnelHandle>((_, ref) => {
  const rootRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);
  const stateRef  = useRef({
    active:    false,
    phase:     0,        // 0=idle 1=ramp 2=warp 3=exit
    speed:     0,
    brightness:0,
    vignette:  1,
    done:      false,
  });
  const streaksRef = useRef<Streak[]>([]);
  const onDoneRef  = useRef<(() => void) | null>(null);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    streaksRef.current = Array.from({ length: STREAK_COUNT }, () =>
      makeStreak(canvas.width, canvas.height)
    );
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    const W  = canvas.width;
    const H  = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Background
    ctx.fillStyle = `rgba(8,28,21,${s.phase >= 2 ? 0.15 : 0.4})`;
    ctx.fillRect(0, 0, W, H);

    if (!s.active) return;

    // Draw streaks radiating from center
    streaksRef.current.forEach((streak) => {
      streak.dist += streak.speed * (s.speed / 30);
      const maxDist = Math.sqrt(W * W + H * H) * 0.65;
      if (streak.dist > maxDist) {
        Object.assign(streak, makeStreak(W, H));
        streak.dist = 5;
      }

      const x1 = cx + Math.cos(streak.angle) * streak.dist;
      const y1 = cy + Math.sin(streak.angle) * streak.dist;
      const len = streak.length * (s.speed / 30);
      const x0 = cx + Math.cos(streak.angle) * Math.max(0, streak.dist - len);
      const y0 = cy + Math.sin(streak.angle) * Math.max(0, streak.dist - len);

      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, streak.color + Math.round(streak.alpha * 255 * (s.speed / 80)).toString(16).padStart(2, "0"));

      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth   = streak.width * (0.5 + s.speed / 60);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    });

    // Center wormhole glow
    const innerR = W * 0.04 * (s.speed / 80);
    const outerR = W * 0.5;
    const worm = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    worm.addColorStop(0,    `rgba(82,183,136,${0.6 * s.speed / 80})`);
    worm.addColorStop(0.08, `rgba(64,145,108,${0.3 * s.speed / 80})`);
    worm.addColorStop(0.3,  `rgba(27,67,50,${0.1  * s.speed / 80})`);
    worm.addColorStop(1,    "transparent");
    ctx.fillStyle = worm;
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vig = ctx.createRadialGradient(cx, cy, W * 0.2, cx, cy, W * 0.9);
    vig.addColorStop(0, "transparent");
    vig.addColorStop(1, `rgba(8,28,21,${s.vignette})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // White flash on exit
    if (s.brightness > 0) {
      ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
      ctx.fillRect(0, 0, W, H);
    }
  }, []);

  const loop = useCallback(() => {
    render();
    rafRef.current = requestAnimationFrame(loop);
  }, [render]);

  useImperativeHandle(ref, () => ({
    play(onDone: () => void) {
      onDoneRef.current = onDone;
      const root  = rootRef.current;
      const s     = stateRef.current;
      if (!root) return;

      // Show the tunnel
      gsap.set(root, { autoAlpha: 1 });
      s.active = true;
      s.phase  = 1;

      const tl = gsap.timeline();

      // Phase 1: Ramp up (0.8s) — enter warp
      tl.to(s, { speed: 80, duration: 0.9, ease: "power3.in" })
        .to(s, { vignette: 0.4, duration: 0.9, ease: "power2.in" }, "<");

      // Phase 2: Full warp (1.2s) — time travel
      tl.to(s, { speed: 120, duration: 1.2, ease: "power1.inOut" }, "+=0")
        .to(s, { vignette: 0.1, duration: 0.6 }, "<0.3")
        .add(() => { s.phase = 2; });

      // Phase 3: Flash exit (0.5s) — arrive at present
      tl.to(s, { brightness: 1, duration: 0.35, ease: "power3.in" })
        .to(s, {
          brightness: 0,
          speed:      0,
          vignette:   1,
          duration:   0.5,
          ease:       "power2.out",
        })
        .add(() => { s.phase = 3; })

        // Fade out tunnel
        .to(root, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" })
        .add(() => {
          s.active = false;
          onDoneRef.current?.();
        });
    },
  }));

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
        position:  "fixed", inset: 0,
        zIndex:    9000,
        opacity:   0, visibility: "hidden",
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
});

TimeTravelTunnel.displayName = "TimeTravelTunnel";
export default TimeTravelTunnel;
