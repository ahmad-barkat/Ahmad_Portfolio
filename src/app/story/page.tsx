"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";
import StorySection from "@/components/sections/StorySection";
import WillemLoader from "@/components/ui/WillemLoader";
import HeadingReveal from "@/components/ui/HeadingReveal";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 333;
const frameSrc = (n: number) =>
  `/laptop/${String(n + 1).padStart(3, "0")}.png`;
const TUNNEL_COLORS = ["#E8F6FF", "#7FE7D6", "#3BA7F2", "#2E93E8", "#E8F6FF", "#A5EEE2"];

type Phase = "preload" | "laptop" | "story" | "tunnel";


export default function StoryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("preload");
  // Transition from preloader to laptop scene
  const handleLoaderComplete = useCallback(() => {
    phaseRef.current = "laptop";
    setPhase("laptop");
  }, []);

  // Navigate directly to /nav as soon as score hits 100
  const handleStoryComplete = useCallback(() => {
    router.push("/");
  }, [router]);

  /* ── shared image store ── */
  const imgs = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const loaded = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));

  /* ── canvas / DOM refs ── */
  const lapC = useRef<HTMLCanvasElement>(null);
  const tunC = useRef<HTMLCanvasElement>(null);
  const lapSec = useRef<HTMLElement>(null);
  const lapTxt = useRef<HTMLDivElement>(null);
  const tunRoot = useRef<HTMLDivElement>(null);

  /* ── animation state refs ── */
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
     PHASE 2 — LAPTOP SCENE DRAW FUNCTION
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

  /* ════════════════════════════════════════
     PRIORITIZED PROGRESSIVE FRAME LOADING
  ════════════════════════════════════════ */
  useEffect(() => {
    let isCancelled = false;

    // Helper to load a single frame
    const loadFrame = (i: number): Promise<void> => {
      return new Promise((resolve) => {
        if (isCancelled || imgs.current[i]) {
          resolve();
          return;
        }
        const img = new window.Image();
        img.decoding = "async";
        img.src = frameSrc(i);
        img.onload = () => {
          if (!isCancelled) {
            loaded.current[i] = true;
            if (i === 0) drawFrame(0);
          }
          resolve();
        };
        img.onerror = () => {
          if (!isCancelled) loaded.current[i] = false;
          resolve();
        };
        imgs.current[i] = img;
      });
    };

    // Stage 1: Load critical opening frames immediately (0 to 20)
    const CRITICAL_BATCH = 20;
    const initialPromises: Promise<void>[] = [];
    for (let i = 0; i < Math.min(CRITICAL_BATCH, TOTAL_FRAMES); i++) {
      initialPromises.push(loadFrame(i));
    }

    // Stage 2: Stream remaining frames in smooth, controlled batches of 15
    Promise.all(initialPromises).then(async () => {
      if (isCancelled) return;
      const BATCH_SIZE = 15;
      for (let i = CRITICAL_BATCH; i < TOTAL_FRAMES; i += BATCH_SIZE) {
        if (isCancelled) break;
        const chunk: Promise<void>[] = [];
        for (let j = i; j < Math.min(i + BATCH_SIZE, TOTAL_FRAMES); j++) {
          chunk.push(loadFrame(j));
        }
        await Promise.all(chunk);
        // Micro-yield to main thread so animations & scroll never stutter
        await new Promise((r) => setTimeout(r, 16));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [drawFrame]);

  /* Lock scroll during preload so user cannot scroll before loader completes */
  useEffect(() => {
    if (phase === "preload") {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [phase]);

  const setupCanvas = useCallback(() => {
    const canvas = lapC.current;
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
    drawFrame(pending.current || 0);
  }, [drawFrame]);

  // Mount-time canvas sizing, resize listener, and continuous RAF loop
  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas, { passive: true });

    const loop = () => {
      lapRaf.current = requestAnimationFrame(loop);
      if (!dirty.current) return;
      dirty.current = false;
      drawFrame(pending.current);
    };
    lapRaf.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", setupCanvas);
      if (lapRaf.current) cancelAnimationFrame(lapRaf.current);
    };
  }, [setupCanvas, drawFrame]);

  // ScrollTrigger lifecycle tied to laptop/story phases
  useEffect(() => {
    const canvas = lapC.current;
    const section = lapSec.current;

    if (phase === "laptop" || phase === "story") {
      if (lapInitialized.current) return;
      lapInitialized.current = true;

      if (!canvas || !section) return;

      window.scrollTo(0, 0);

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
        lapCtxRef.current?.revert();
        lapCtxRef.current = null;
        lapInitialized.current = false;
      }
    }
  }, [phase]);

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
      ctx.fillStyle = `rgba(11, 61, 145,${spd < 60 ? 0.35 : 0.12})`;
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
      glow.addColorStop(0, `rgba(59, 167, 242,${0.5 * spd / 120})`);
      glow.addColorStop(0.1, `rgba(46, 147, 232,${0.2 * spd / 120})`);
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
        router.push("/");
      });

    return () => {
      if (tunRaf.current) cancelAnimationFrame(tunRaf.current);
    };
  }, [phase]);



  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <main style={{ backgroundColor: "#0B3D91", margin: 0, padding: 0, overflow: "visible" }}>

      {/* ── PRELOAD — Willem-style loading animation ── */}
      {phase === "preload" && (
        <WillemLoader
          onComplete={handleLoaderComplete}
          background="#0B3D91"
          color="#E8F6FF"
          finalImageClassName="willem__cover-image--laptop"
        />
      )}

      {/* ── LAPTOP SCENE ── */}
      <section ref={lapSec} className="laptop-section laptop-scene-enter">
        <div className="laptop-sticky">
          {/* Inner clip wrapper — clips canvas overflow without breaking sticky */}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
            <canvas ref={lapC} className="laptop-canvas" />
            <div className="laptop-fade-top" />
            <div className="laptop-fade-bottom" />
          </div>
          <div ref={lapTxt} className="laptop-text">
            <HeadingReveal as="h2" className="laptop-text-heading" immediate={true} delay={0.4}>
              It all Begins with a Laptop
            </HeadingReveal>
            <div className="laptop-text-line" />
          </div>
          <div className="laptop-scroll-hint">
            <span className="laptop-scroll-label">Scroll</span>
            <svg className="laptop-scroll-icon" width="16" height="24" viewBox="0 0 16 24" fill="none" aria-hidden="true">
              <path d="M8 4 L8 20 M4 16 L8 20 L12 16" stroke="#3BA7F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </section>

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
