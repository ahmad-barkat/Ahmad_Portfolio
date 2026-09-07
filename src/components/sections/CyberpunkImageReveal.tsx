"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

interface CyberpunkImageRevealProps {
  baseImage: string;
  revealImage: string;
  className?: string;
}

export const CyberpunkImageReveal: React.FC<CyberpunkImageRevealProps> = ({
  baseImage,
  revealImage,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mouse lerp tracking
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const radiusRef = useRef({ r: 0, targetR: 0 });
  const isHoveredRef = useRef(false);

  const [maskPath, setMaskPath] = useState<string>("circle(0px at 50% 50%)");
  const [isHovered, setIsHovered] = useState(false);

  // Organic Wavy Energy & Canvas Aura Loop (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resizeCanvas = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      time += 0.04;
      if (!containerRef.current || !canvas) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth liquid lerp physics (0.12)
      const lerp = 0.12;
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * lerp;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * lerp;
      radiusRef.current.r += (radiusRef.current.targetR - radiusRef.current.r) * lerp;

      const { x, y } = mousePos.current;
      const r = radiusRef.current.r;

      if (r > 1) {
        // Generate Organic Wavy Polygon Path for CSS clip-path mask
        const numPoints = 64;
        const points: [number, number][] = [];

        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          // Multi-frequency organic sine/cosine wave distortion
          const wave =
            Math.sin(angle * 5 + time * 2) * 9 +
            Math.cos(angle * 3 - time * 1.5) * 6 +
            Math.sin(angle * 8 + time * 3) * 4;
          const currentR = Math.max(10, r + wave);
          const px = x + Math.cos(angle) * currentR;
          const py = y + Math.sin(angle) * currentR;
          points.push([px, py]);
        }

        const pathStr = `polygon(${points
          .map(([px, py]) => `${px.toFixed(1)}px ${py.toFixed(1)}px`)
          .join(", ")})`;

        setMaskPath(pathStr);

        // ── DRAW GLOWING ORGANIC LASER / ENERGY TENDRIOL OUTLINE ON CANVAS ──
        ctx.save();
        ctx.scale(dpr, dpr);

        ctx.beginPath();
        points.forEach(([px, py], idx) => {
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();

        // Multi-pass glowing aura line
        ctx.strokeStyle = "rgba(82, 183, 136, 0.9)";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#52B788";
        ctx.shadowBlur = 25;
        ctx.stroke();

        ctx.strokeStyle = "rgba(116, 198, 157, 0.6)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.restore();
      } else {
        setMaskPath("circle(0px at 50% 50%)");
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mousePos.current.targetX = x;
    mousePos.current.targetY = y;
    radiusRef.current.targetR = 175;
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mousePos.current.x = x;
    mousePos.current.y = y;
    mousePos.current.targetX = x;
    mousePos.current.targetY = y;
    radiusRef.current.targetR = 175;
    isHoveredRef.current = true;
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    radiusRef.current.targetR = 0;
    isHoveredRef.current = false;
    setIsHovered(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    mousePos.current.targetX = x;
    mousePos.current.targetY = y;
    radiusRef.current.targetR = 150;
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseLeave}
      className={`relative cursor-none select-none overflow-visible flex items-end justify-center ${className}`}
      style={{
        height: "88vh",
        width: "100%",
        maxWidth: "650px",
        background: "transparent",
        backgroundColor: "transparent",
      }}
    >
      {/* 
        BASE LAYER: Samurai Cutout with Swords
        WHEN HOVERED: Swords smoothly fade out (opacity 0) matching attached reference image 5!
      */}
      <div
        className="absolute inset-0 z-10 h-full w-full flex items-end justify-center pointer-events-none bg-transparent transition-opacity duration-700 ease-out"
        style={{
          opacity: isHovered ? 0 : 1,
        }}
      >
        <Image
          src={baseImage}
          alt="Ahmad Barkat - Samurai Cutout with Swords"
          fill
          sizes="(max-width: 768px) 95vw, 650px"
          priority
          quality={100}
          className="object-contain object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* 
        REVEAL LAYER: Executive Suit Cutout (Unmasked, No Swords)
        Fades in smoothly on hover AND clipped by the organic wavy energy laser boundary mask!
      */}
      <div
        className="absolute inset-0 z-20 h-full w-full flex items-end justify-center pointer-events-none bg-transparent transition-opacity duration-700 ease-out"
        style={{
          opacity: isHovered ? 1 : 0,
          clipPath: maskPath,
          WebkitClipPath: maskPath,
        }}
      >
        <Image
          src={revealImage}
          alt="Ahmad Barkat - Executive Suit Cutout Unmasked"
          fill
          sizes="(max-width: 768px) 95vw, 650px"
          priority
          quality={100}
          className="object-contain object-bottom drop-shadow-[0_20px_50px_rgba(82,183,136,0.4)]"
        />
      </div>

      {/* FULL UNMASKED SUIT BACKGROUND REVEAL LAYER (Ensures smooth sword disappearance under lens) */}
      <div
        className="absolute inset-0 z-15 h-full w-full flex items-end justify-center pointer-events-none bg-transparent transition-opacity duration-700 ease-out"
        style={{
          opacity: isHovered ? 1 : 0,
        }}
      >
        <Image
          src={revealImage}
          alt="Ahmad Barkat - Executive Suit Base"
          fill
          sizes="(max-width: 768px) 95vw, 650px"
          priority
          quality={100}
          className="object-contain object-bottom opacity-20 filter blur-sm"
        />
      </div>

      {/* ORGANIC GLOWING ENERGY LASER CANVAS BORDER */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-30 pointer-events-none"
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {/* IDLE HINT / INSTRUCTION ACCENT */}
      <div
        className={`pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 transform rounded-full bg-[#081C15]/90 px-6 py-2.5 backdrop-blur-md transition-all duration-500 border border-[#52B788]/40 ${
          isHovered ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="flex items-center gap-2.5 text-[11px] tracking-[0.25em] text-[#F0EDE8] uppercase font-mono whitespace-nowrap">
          <span className="h-2 w-2 animate-ping rounded-full bg-[#52B788]" />
          <span>Hover figure to reveal identity</span>
        </div>
      </div>
    </div>
  );
};
