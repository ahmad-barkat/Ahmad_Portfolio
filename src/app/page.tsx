"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";
import StorySection from "@/components/sections/StorySection";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 333;
const frameSrc = (n: number) =>
  `/laptop/${String(n + 1).padStart(3, "0")}.png`;
const TUNNEL_COLORS = ["#D8F3DC", "#95D5B2", "#52B788", "#40916C", "#ffffff", "#B7E4C7"];

type Phase = "preload" | "laptop" | "story" | "tunnel";



export default function Home() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("preload");
  const [pct, setPct] = useState(0);

  // Navigate directly to /nav as soon as score hits 100
  const handleStoryComplete = useCallback(() => {
    router.push("/nav");
  }, [router]);

  /* ── shared image store ── */
  const imgs = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const loaded = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));

  /* ── canvas / DOM refs ── */
  const preC = useRef<HTMLCanvasElement>(null);
  const lapC = useRef<HTMLCanvasElement>(null);
  const tunC = useRef<HTMLCanvasElement>(null);
  const lapSec = useRef<HTMLElement>(null);
  const lapTxt = useRef<HTMLDivElement>(null);
  const tunRoot = useRef<HTMLDivElement>(null);

  /* ── animation state refs ── */
  const preRaf = useRef<number | null>(null);
  const lapRaf = useRef<number | null>(null);
  const tunRaf = useRef<number | null>(null);
  const triggered = useRef(false);
  const frameObj = useRef({ frame: 0 });
  const pending = useRef(0);
  const dirty = useRef(false);
  const tunSpd = useRef(0);
  const tunBrt = useRef(0);
  const streaks = useRef<{ a: number; d: number; s: number; l: number; al: number; c: string; w: number }[]>([]);
  // phaseRef: updated synchronously before setPhase() so cleanup knows the next phase
  const phaseRef = useRef<Phase>("preload");
  // lapCtxRef: persists the gsap.context across phase changes for cross-effect cleanup
  const lapCtxRef = useRef<ReturnType<typeof gsap.context> | null>(null);
  const lapInitialized = useRef(false);

  /* ════════════════════════════════════════
     PHASE 1 — PRELOAD
  ════════════════════════════════════════ */
  useEffect(() => {
    if (phase !== "preload") return;
    const canvas = preC.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 500 }, () => ({
      x: (Math.random() - 0.5) * canvas.width * 2,
      y: (Math.random() - 0.5) * canvas.height * 2,
      z: Math.random() * canvas.width,
      pz: 0,
    }));

    let speed = 3;
    let total = 0;
    let exiting = false;

    const triggerExit = () => {
      if (exiting) return;
      exiting = true;
      let t = 0;
      const container = canvas.parentElement;
      const burst = setInterval(() => {
        speed = Math.min(150, speed + 15);
        if (++t > 6) {
          clearInterval(burst);
          let op = 1;
          const fade = setInterval(() => {
            op -= 0.1;
            if (container) container.style.opacity = String(Math.max(0, op));
            if (op <= 0) {
              clearInterval(fade);
              setPhase("laptop");
            }
          }, 16);
        }
      }, 40);
    };

    // Safety timeout: transition after 2s max so user is never stuck
    const safetyTimer = setTimeout(() => {
      triggerExit();
    }, 2000);

    const onFrameComplete = (i: number) => {
      total++;
      setPct(Math.round((total / TOTAL_FRAMES) * 100));
      // Once 35 frames (or all) are loaded, start transition
      if ((total >= 35 || total >= TOTAL_FRAMES) && !exiting) {
        clearTimeout(safetyTimer);
        triggerExit();
      }
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new window.Image();
      img.decoding = "async";
      img.src = frameSrc(i);
      img.onload = () => {
        loaded.current[i] = true;
        onFrameComplete(i);
      };
      img.onerror = () => {
        loaded.current[i] = false;
        onFrameComplete(i);
      };
      imgs.current[i] = img;
    }

    const loop = () => {
      preRaf.current = requestAnimationFrame(loop);
      const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
      ctx.fillStyle = "rgba(8,28,21,0.2)";
      ctx.fillRect(0, 0, W, H);
      stars.forEach(s => {
        s.pz = s.z; s.z -= speed;
        if (s.z <= 0) {
          s.x = (Math.random() - .5) * W * 2;
          s.y = (Math.random() - .5) * H * 2;
          s.z = W; s.pz = W;
        }
        const sx = (s.x / s.z) * W + cx, sy = (s.y / s.z) * H + cy;
        const px = (s.x / s.pz) * W + cx, py = (s.y / s.pz) * H + cy;
        const t = 1 - s.z / W;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${Math.round(82 * t + 27 * (1 - t))},${Math.round(183 * t + 106 * (1 - t))},${Math.round(136 * t + 79 * (1 - t))},${Math.min(1, t * 1.4)})`;
        ctx.lineWidth = Math.max(0.1, t * 2.5);
        ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      });
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * .25);
      g.addColorStop(0, `rgba(82,183,136,${0.2 * speed / 150})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    };
    preRaf.current = requestAnimationFrame(loop);

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize, { passive: true });
    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener("resize", resize);
      if (preRaf.current) cancelAnimationFrame(preRaf.current);
    };
  }, [phase]);

  /* ════════════════════════════════════════
     PHASE 2 — LAPTOP SCENE
  ════════════════════════════════════════ */
  const drawFrame = useCallback((idx: number) => {
    const canvas = lapC.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imgs.current[idx];
    if (!img || !loaded.current[idx]) return;

    // Use actual canvas buffer size (already DPR-scaled) for cover-fit
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih) return;

    // Cover-fit: fill the canvas while maintaining aspect ratio
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    // Highest quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  useEffect(() => {
    const canvas = lapC.current;
    const section = lapSec.current;

    const setupCanvas = () => {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      const c = canvas.getContext("2d");
      if (c) {
        c.imageSmoothingEnabled = true;
        c.imageSmoothingQuality = "high";
      }
    };

    if (phase === "laptop" || phase === "story") {
      if (lapInitialized.current) return;
      lapInitialized.current = true;

      if (!canvas || !section) return;

      const dpr = window.devicePixelRatio || 1;

      setupCanvas();
      window.addEventListener("resize", setupCanvas, { passive: true });

      // RAF draw loop
      const loop = () => {
        lapRaf.current = requestAnimationFrame(loop);
        if (!dirty.current) return;
        dirty.current = false;
        drawFrame(pending.current);
      };
      lapRaf.current = requestAnimationFrame(loop);
      drawFrame(0);

      // Wait 2 frames for DOM layout to settle, then init ScrollTrigger
      let ctx2: ReturnType<typeof gsap.context> | null = null;

      const initScrollTrigger = () => {
        // Force ScrollTrigger to recalculate page height
        ScrollTrigger.refresh();

        ctx2 = gsap.context(() => {
          // Frame sequence tied to scroll
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.5,
              // markers: true, // uncomment to debug positions
            },
          });

          tl.to(frameObj.current, {
            frame: TOTAL_FRAMES - 1,
            ease: "none",
            onUpdate() {
              pending.current = Math.round(frameObj.current.frame);
              dirty.current = true;
            },
          });

          // Text cinematic sweep: right → center → left (synced to scroll)
          // 0%–12%  : fade in, slide from right into center
          // 12%–55% : glide left across the laptop, passing "through" it
          // 40%–55% : simultaneously fade out as it exits left
          tl.fromTo(lapTxt.current,
            { autoAlpha: 0, xPercent: -50, x: "55vw" },
            { autoAlpha: 1, x: "0vw", xPercent: -50, duration: 0.12, ease: "power2.out" },
            0.0
          )
            .to(lapTxt.current,
              { x: "-80vw", xPercent: -50, duration: 0.43, ease: "none" },
              0.12
            )
            .to(lapTxt.current,
              { autoAlpha: 0, duration: 0.18, ease: "power1.in" },
              0.37
            );

          // Zoom + trigger tunnel at end of scroll
          ScrollTrigger.create({
            trigger: section,
            start: "58% top",
            end: "bottom bottom",
            scrub: 1,
            onUpdate(self) {
              canvas.style.transform = `scale(${1 + self.progress * 0.22})`;
              if (self.progress >= 0.97 && !triggered.current) {
                triggered.current = true;
                // Update phaseRef BEFORE setState so cleanup reads the right next-phase
                phaseRef.current = "story";
                setPhase("story"); // go to story section first, then tunnel
              } else if (self.progress < 0.97 && triggered.current) {
                triggered.current = false;
                phaseRef.current = "laptop";
                setPhase("laptop");
              }
            },
          });
        }, section);
        // Store in ref so other effects can revert it (e.g. when entering tunnel)
        lapCtxRef.current = ctx2;
      };

      // Use two rAF frames to guarantee layout is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(initScrollTrigger);
      });

    } else {
      if (lapInitialized.current) {
        window.removeEventListener("resize", setupCanvas);
        if (lapRaf.current) cancelAnimationFrame(lapRaf.current);
        lapCtxRef.current?.revert();
        lapCtxRef.current = null;
        lapInitialized.current = false;
      }
    }
  }, [phase, drawFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lapRaf.current) cancelAnimationFrame(lapRaf.current);
      lapCtxRef.current?.revert();
    };
  }, []);

  /* ════════════════════════════════════════
     LAPTOP CLEANUP — handled in the main effect now
  ════════════════════════════════════════ */

  /* ════════════════════════════════════════
     PHASE 3 — TIME TUNNEL
  ════════════════════════════════════════ */
  useEffect(() => {
    if (phase !== "tunnel") return;
    const canvas = tunC.current;
    const root = tunRoot.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const W = canvas.width, H = canvas.height;

    streaks.current = Array.from({ length: 300 }, () => ({
      a: Math.random() * Math.PI * 2,
      d: Math.random() * Math.sqrt(W * W + H * H) * 0.12 + 10,
      s: Math.random() * 12 + 4,
      l: Math.random() * 130 + 50,
      al: Math.random() * 0.8 + 0.2,
      c: TUNNEL_COLORS[Math.floor(Math.random() * TUNNEL_COLORS.length)],
      w: Math.random() * 1.5 + 0.3,
    }));

    tunSpd.current = 0;
    tunBrt.current = 0;
    root.style.opacity = "1";
    root.style.visibility = "visible";

    const loop = () => {
      tunRaf.current = requestAnimationFrame(loop);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const spd = tunSpd.current;
      ctx.fillStyle = `rgba(8,28,21,${spd < 60 ? 0.35 : 0.12})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const maxD = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) * 0.65;
      streaks.current.forEach(s => {
        s.d += s.s * (spd / 40);
        if (s.d > maxD) s.d = 5;
        const len = s.l * (spd / 40);
        const x1 = cx + Math.cos(s.a) * s.d, y1 = cy + Math.sin(s.a) * s.d;
        const x0 = cx + Math.cos(s.a) * Math.max(0, s.d - len);
        const y0 = cy + Math.sin(s.a) * Math.max(0, s.d - len);
        const alpha = Math.min(1, s.al * (spd / 40));
        const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, "transparent");
        g.addColorStop(1, s.c + hex);
        ctx.beginPath();
        ctx.strokeStyle = g;
        ctx.lineWidth = s.w * (0.4 + spd / 80);
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      });
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.5);
      glow.addColorStop(0, `rgba(82,183,136,${0.5 * spd / 120})`);
      glow.addColorStop(0.1, `rgba(64,145,108,${0.2 * spd / 120})`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (tunBrt.current > 0) {
        ctx.fillStyle = `rgba(255,255,255,${tunBrt.current})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    tunRaf.current = requestAnimationFrame(loop);

    gsap.timeline()
      .to(tunSpd, { current: 120, duration: 1.0, ease: "power3.in" })
      .to(tunSpd, { current: 180, duration: 1.2, ease: "power1.inOut" })
      .to(tunBrt, { current: 1, duration: 0.3, ease: "power4.in" })
      .to(tunBrt, { current: 0, duration: 0.5, ease: "power2.out" })
      .to(tunSpd, { current: 0, duration: 0.5, ease: "power2.out" }, "<")
      .to(root, { opacity: 0, duration: 0.5 }, "-=0.3")
      .add(() => {
        if (tunRaf.current) cancelAnimationFrame(tunRaf.current);
        router.push("/nav");
      });

    return () => {
      if (tunRaf.current) cancelAnimationFrame(tunRaf.current);
    };
  }, [phase]);



  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <main style={{ backgroundColor: "#081C15", margin: 0, padding: 0, overflow: "visible" }}>

      {/* ── PRELOAD ── */}
      {phase === "preload" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, backgroundColor: "#081C15", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <canvas ref={preC} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", pointerEvents: "none" }}>
            <div style={{ fontFamily: "Cartefield,serif", fontSize: "clamp(3rem,10vw,7rem)", color: "#52B788", letterSpacing: "0.06em", textShadow: "0 0 40px rgba(82,183,136,0.5)", marginBottom: "clamp(1rem,3vw,2rem)" }}>MAB</div>
            <div style={{ fontFamily: "monospace", fontSize: "clamp(0.55rem,1.5vw,0.75rem)", color: "#40916C", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "clamp(1rem,3vw,2rem)" }}>Entering the dimension</div>
            <div style={{ width: "clamp(160px,35vw,300px)", height: "1px", backgroundColor: "#1B4332", position: "relative", overflow: "hidden", margin: "0 auto" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, backgroundColor: "#52B788", boxShadow: "0 0 8px #52B788", transition: "width 0.1s linear" }} />
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "clamp(0.55rem,1.4vw,0.7rem)", color: "#2D6A4F", letterSpacing: "0.2em", marginTop: "0.6rem" }}>{pct}%</div>
          </div>
          {(["tl", "tr", "bl", "br"] as const).map(p => (
            <div key={p} style={{ position: "absolute", top: p[0] === "t" ? "clamp(1rem,3vw,2rem)" : "auto", bottom: p[0] === "b" ? "clamp(1rem,3vw,2rem)" : "auto", left: p[1] === "l" ? "clamp(1rem,3vw,2rem)" : "auto", right: p[1] === "r" ? "clamp(1rem,3vw,2rem)" : "auto", width: "clamp(20px,3vw,32px)", height: "clamp(20px,3vw,32px)", borderTop: p[0] === "t" ? "1px solid #2D6A4F" : "none", borderBottom: p[0] === "b" ? "1px solid #2D6A4F" : "none", borderLeft: p[1] === "l" ? "1px solid #2D6A4F" : "none", borderRight: p[1] === "r" ? "1px solid #2D6A4F" : "none", opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* ── LAPTOP SCENE ── */}
      {(phase === "laptop" || phase === "tunnel" || phase === "story") && (
        <section ref={lapSec} className="laptop-section">
          <div className="laptop-sticky">
            {/* Inner clip wrapper — clips canvas overflow without breaking sticky */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
              <canvas ref={lapC} className="laptop-canvas" />
              <div className="laptop-fade-top" />
              <div className="laptop-fade-bottom" />
            </div>
            <div ref={lapTxt} className="laptop-text">
              <h2 className="laptop-text-heading">It all Begins with a Laptop</h2>
              <div className="laptop-text-line" />
            </div>
            <div className="laptop-scroll-hint">
              <span className="laptop-scroll-label">Scroll</span>
              <svg className="laptop-scroll-icon" width="16" height="24" viewBox="0 0 16 24" fill="none" aria-hidden="true">
                <path d="M8 4 L8 20 M4 16 L8 20 L12 16" stroke="#52B788" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/* ── Scroll-driven decorations removed ── */}
          </div>
        </section>
      )}

      {/* ── STORY SECTION (between laptop and tunnel) ── */}
      {(phase === "story" || phase === "tunnel") && (
        <StorySection onComplete={handleStoryComplete} />
      )}

      {/* ── TUNNEL ── */}
      <div ref={tunRoot} style={{ position: "fixed", inset: 0, zIndex: 9000, opacity: 0, visibility: "hidden", pointerEvents: "none" }}>
        <canvas ref={tunC} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>



    </main>
  );
}
