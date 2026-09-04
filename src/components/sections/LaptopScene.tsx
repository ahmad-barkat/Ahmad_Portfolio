"use client";

import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 300;
const BATCH_SIZE   = 20;
const frameSrc = (n: number) =>
  `/laptop/ezgif-frame-${String(n).padStart(3, "0")}.jpg`;

interface LaptopSceneProps {
  imagesRef:  React.MutableRefObject<(HTMLImageElement | null)[]>;
  loadedRef:  React.MutableRefObject<boolean[]>;
  onZoomDone: () => void;
}

export default function LaptopScene({ imagesRef, loadedRef, onZoomDone }: LaptopSceneProps) {
  const sectionRef   = useRef<HTMLElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const textRef      = useRef<HTMLDivElement>(null);
  const frameObj     = useRef({ frame: 0 });
  const ctxRef       = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef       = useRef<number | null>(null);
  const pendingFrame = useRef(0);
  const isDirty      = useRef(false);
  const triggeredRef = useRef(false);

  // ── RAF-batched draw ──────────────────────────────────────────
  const scheduleDrawFrame = useCallback((index: number) => {
    pendingFrame.current = index;
    isDirty.current = true;
  }, []);

  const drawPending = useCallback(() => {
    rafRef.current = requestAnimationFrame(drawPending);
    if (!isDirty.current) return;
    isDirty.current = false;

    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    const index  = pendingFrame.current;
    const img    = imagesRef.current[index];
    if (!canvas || !ctx || !img || !loadedRef.current[index]) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih) return;

    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, [imagesRef, loadedRef]);

  // ── Resize with DPR ───────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }
    scheduleDrawFrame(Math.round(frameObj.current.frame));
  }, [scheduleDrawFrame]);

  // ── Batch preload ─────────────────────────────────────────────
  const preloadBatch = useCallback((startIdx: number) => {
    const end = Math.min(startIdx + BATCH_SIZE, TOTAL_FRAMES);
    for (let i = startIdx; i < end; i++) {
      if (imagesRef.current[i]) continue;
      const img = new window.Image();
      img.decoding = "async";
      img.src = frameSrc(i + 1);
      img.onload = () => {
        loadedRef.current[i] = true;
        if (i === 0) scheduleDrawFrame(0);
        if (i === end - 1 && end < TOTAL_FRAMES) preloadBatch(end);
      };
      imagesRef.current[i] = img;
    }
  }, [imagesRef, loadedRef, scheduleDrawFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });
    rafRef.current = requestAnimationFrame(drawPending);
    preloadBatch(0);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start:   "top top",
          end:     "bottom bottom",
          scrub:   0.5,
        },
      });

      // Frame sequence
      tl.to(frameObj.current, {
        frame:  TOTAL_FRAMES - 1,
        ease:   "none",
        onUpdate() {
          const f = Math.round(frameObj.current.frame);
          scheduleDrawFrame(f);
          const ahead = Math.min(f + BATCH_SIZE, TOTAL_FRAMES - 1);
          if (!imagesRef.current[ahead]) preloadBatch(ahead);
        },
      });

      // Text: fade in → fade out
      tl.fromTo(textRef.current,
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" },
        0.05
      );
      tl.to(textRef.current,
        { autoAlpha: 0, y: -20, duration: 0.10, ease: "power2.in" },
        0.38
      );

      // ── Zoom into screen + trigger time tunnel ────────────────
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start:   "55% top",
        end:     "bottom bottom",
        scrub:   1,
        onUpdate(self) {
          if (!canvasRef.current) return;
          const s = 1 + self.progress * 0.22;
          canvasRef.current.style.transform = `scale(${s})`;

          // At the very end of scroll, trigger time travel
          if (self.progress >= 0.98 && !triggeredRef.current) {
            triggeredRef.current = true;
            onZoomDone();
          }
        },
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      window.removeEventListener("resize", resizeCanvas);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawPending, resizeCanvas, preloadBatch, scheduleDrawFrame, imagesRef, loadedRef, onZoomDone]);

  return (
    <section ref={sectionRef} className="laptop-section">
      <div className="laptop-sticky">
        <canvas ref={canvasRef} className="laptop-canvas" />

        <div ref={textRef} className="laptop-text">
          <h2 className="laptop-text-heading">It all Begins with a Laptop</h2>
          <div className="laptop-text-line" />
        </div>

        <div className="laptop-scroll-hint">
          <span className="laptop-scroll-label">Scroll</span>
          <svg className="laptop-scroll-icon" width="16" height="24" viewBox="0 0 16 24" fill="none" aria-hidden="true">
            <path d="M8 4 L8 20 M4 16 L8 20 L12 16" stroke="#52B788" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="laptop-fade-top" />
        <div className="laptop-fade-bottom" />
      </div>
    </section>
  );
}
