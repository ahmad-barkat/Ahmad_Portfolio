"use client";

import React, { useEffect, useRef } from "react";
import type * as THREE from "three";
import { loadThree } from "./load-three";
import { useActivate } from "./use-activate";
import gsap from "gsap";
import { sampleShape, sampleWord, type ShapeDrawer } from "./particle-shapes";

export interface ParticleFieldProps {
  /** One drawer per symbol, in order. */
  shapes: readonly ShapeDrawer[];
  /** Optional word under each symbol, spelled in smaller particles. */
  words?: readonly string[];
  /**
   * Where the field is between symbols, read every frame: 0 is the first symbol,
   * 1 the second, 2.5 halfway from the third to the fourth. The caller drives it
   * straight from scroll, so the field morphs exactly as fast as the reader moves.
   */
  position: React.MutableRefObject<number>;
  /** Reports whether WebGL came up, so the caller can show a static fallback. */
  onReady?: (live: boolean) => void;
  className?: string;
}

/** Radius of a symbol as a share of the field's shorter side. */
export const FIELD_FIT = 0.4;

// Share of each morph over which particle start times are spread. Each particle
// then travels for the remaining (1 - DELAY_SPAN), so all of them land together.
const DELAY_SPAN = 0.4;

/* Layout inside the field, in symbol radii (y up). With a word the symbol
   shrinks and lifts, and the word sits under it. */
const SYMBOL_SCALE = 0.74;
const SYMBOL_LIFT = 0.24;
const WORD_SCALE = 0.78;
const WORD_DROP = -0.9;
/** Share of the particles that spell the word */
const WORD_SHARE = 0.36;

/* The physics, per 60fps frame. Every particle is a mass on a spring to its
   home on the symbol, pushed about by a slow current and by the cursor.
   Most are held firmly enough to keep the shape; the "loose" ones are held
   so softly that they wander well off it, which is what makes it airy. */
const SPRING = 0.024; // pull home
const SPRING_LOOSE = 0.0035;
const DAMPING = 0.9; // velocity kept each frame
const FLOW = 0.11; // the current's push on a held particle
const FLOW_LOOSE = 0.3;
const REPEL_RADIUS = 120; // px
const REPEL = 1.9; // push at the cursor's centre
const LOOSE_SHARE = 0.16;

const PALETTE = [
  { hex: "#3BA7F2", weight: 0.5 },
  { hex: "#7FE7D6", weight: 0.32 },
  { hex: "#E8F6FF", weight: 0.18 },
];

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uGather;

  attribute vec3 aColor;
  attribute float aRand;
  attribute float aLoose;
  attribute float aSize;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * aSize * (0.55 + aRand * 0.85) * (1.0 - aLoose * 0.3) * uPixelRatio;
    vColor = aColor;
    float twinkle = 0.8 + 0.2 * sin(uTime * 1.7 + aRand * 18.85);
    vAlpha = (0.34 + aRand * 0.5) * (1.0 - aLoose * 0.5) * uGather * twinkle;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * vAlpha);
  }
`;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * A particle field that re-forms from one symbol (and its word) into the next
 * as its `position` moves. Each particle is simulated on the CPU: a spring
 * pulls it to its home on the current shape, a slow current keeps it drifting,
 * and the cursor scatters it with real momentum, so it springs back rather
 * than sliding. Homes are a function of position, so scrolling back plays
 * the morph backwards. The loop runs only while the field is on screen.
 */
export function ParticleField({ shapes, words, position, onReady, className }: ParticleFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const active = useActivate(wrapRef);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!active || !wrap || !shapes.length) return;
    let gone = false;
    let teardown: void | (() => void);
    Promise.all([loadThree(), document.fonts?.ready]).then(([THREE]) => {
      if (gone) return;
      teardown = ((): void | (() => void) => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const vw = window.innerWidth;
        // Sized to the field and to the CPU: every particle is simulated in JS
        const COUNT = vw >= 1024 ? 6500 : vw >= 768 ? 5000 : 3400;

        let renderer: THREE.WebGLRenderer;
        try {
          renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: "high-performance",
          });
        } catch {
          onReadyRef.current?.(false);
          return;
        }

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(pixelRatio);
        renderer.setClearColor(0x000000, 0);
        const canvas = renderer.domElement;
        canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
        wrap.appendChild(canvas);

        let width = Math.max(1, wrap.clientWidth);
        let height = Math.max(1, wrap.clientHeight);
        renderer.setSize(width, height, false);

        // Orthographic, one world unit per CSS pixel, origin at the field's centre.
        const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -1000, 1000);
        camera.position.z = 10;
        const scene = new THREE.Scene();

        // ── Homes on every shape, in symbol radii ────────────────────────────────
        // The first particles always form the symbol and the rest the word, so a
        // morph carries symbol into symbol and word into word.
        const n = shapes.length;
        const hasWords = !!words && words.length >= n;
        const wordCount = hasWords ? Math.round(COUNT * WORD_SHARE) : 0;
        const symbolCount = COUNT - wordCount;
        const fontFamily =
          getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim() || "system-ui, sans-serif";

        const targets = shapes.map((draw, k) => {
          const out = new Float32Array(COUNT * 2);
          const sym = sampleShape(draw, symbolCount, 384);
          const sScale = hasWords ? SYMBOL_SCALE : 1;
          const sLift = hasWords ? SYMBOL_LIFT : 0;
          for (let i = 0; i < symbolCount; i++) {
            out[i * 2] = sym[i * 3] * sScale;
            out[i * 2 + 1] = sym[i * 3 + 1] * sScale + sLift;
          }
          if (hasWords) {
            const word = sampleWord(words![k], wordCount, fontFamily);
            for (let i = 0; i < wordCount; i++) {
              const j = symbolCount + i;
              out[j * 2] = word[i * 3] * WORD_SCALE;
              out[j * 2 + 1] = word[i * 3 + 1] * WORD_SCALE + WORD_DROP;
            }
          }
          return out;
        });

        // ── Per-particle constants and state ─────────────────────────────────────
        const pos = new Float32Array(COUNT * 3); // drawn positions, px
        const vel = new Float32Array(COUNT * 2);
        const scatter = new Float32Array(COUNT * 2); // mid-morph bow, in radii
        const delay = new Float32Array(COUNT);
        const phase = new Float32Array(COUNT);
        const rand = new Float32Array(COUNT);
        const loose = new Float32Array(COUNT);
        const size = new Float32Array(COUNT);
        const colors = new Float32Array(COUNT * 3);

        const palette = PALETTE.map((p) => ({ color: new THREE.Color(p.hex), weight: p.weight }));
        let scale = Math.min(width, height) * FIELD_FIT;
        for (let i = 0; i < COUNT; i++) {
          const ang = Math.random() * Math.PI * 2;
          const m = 0.15 + Math.random() * 0.45;
          scatter[i * 2] = Math.cos(ang) * m;
          scatter[i * 2 + 1] = Math.sin(ang) * m;
          delay[i] = Math.random() * DELAY_SPAN;
          phase[i] = Math.random() * Math.PI * 2;
          rand[i] = Math.random();
          loose[i] = Math.random() < LOOSE_SHARE ? 1 : 0;
          size[i] = i >= symbolCount ? 0.82 : 1;

          let pick = Math.random();
          const swatch = palette.find((p) => (pick -= p.weight) <= 0) ?? palette[0];
          colors[i * 3] = swatch.color.r;
          colors[i * 3 + 1] = swatch.color.g;
          colors[i * 3 + 2] = swatch.color.b;

          // Entrance: everything starts as a wide, faint cloud and is pulled in
          // by its spring, so the first shape condenses out of the air
          if (reduce) {
            pos[i * 3] = targets[0][i * 2] * scale;
            pos[i * 3 + 1] = targets[0][i * 2 + 1] * scale;
          } else {
            const r = scale * (0.8 + Math.random() * 1.6);
            const a = Math.random() * Math.PI * 2;
            pos[i * 3] = Math.cos(a) * r;
            pos[i * 3 + 1] = Math.sin(a) * r;
          }
        }

        const geometry = new THREE.BufferGeometry();
        const posAttr = new THREE.BufferAttribute(pos, 3);
        posAttr.setUsage(THREE.DynamicDrawUsage);
        geometry.setAttribute("position", posAttr);
        geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
        geometry.setAttribute("aLoose", new THREE.BufferAttribute(loose, 1));
        geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

        const small = vw < 768;
        const uniforms = {
          uTime: { value: 0 },
          uSize: { value: small ? 2.3 : 2.6 },
          uPixelRatio: { value: pixelRatio },
          uGather: { value: reduce ? 1 : 0 },
        };

        const material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
        });

        const points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        scene.add(points);

        // ── Cursor, in field px (y up) ───────────────────────────────────────────
        const mouse = { x: -9999, y: -9999 };
        const onMove = (e: PointerEvent) => {
          mouse.x = e.clientX;
          mouse.y = e.clientY;
        };
        if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });

        // ── Frame ────────────────────────────────────────────────────────────────
        let smooth = Math.min(n - 1, Math.max(0, position.current));
        const span = 1 - DELAY_SPAN;

        const step = (time: number, deltaMs = 16) => {
          const dt = Math.min(2, deltaMs / 16.67);
          const target = Math.min(n - 1, Math.max(0, position.current));
          // A short, frame-rate independent ease on top of the scroll smoothing
          smooth = reduce ? target : smooth + (target - smooth) * (1 - Math.exp(-deltaMs / 110));
          if (Math.abs(target - smooth) < 1e-4) smooth = target;
          const seg = Math.max(0, Math.min(n - 2, Math.floor(smooth)));
          const mix = n > 1 ? smooth - seg : 0;
          const A = targets[seg];
          const B = targets[Math.min(seg + 1, n - 1)];
          const bow = Math.sin(Math.PI * mix);

          const r = wrap.getBoundingClientRect();
          const mx = mouse.x - r.left - width / 2;
          const my = height / 2 - (mouse.y - r.top);
          const near = !reduce && Math.abs(mx) < width / 2 + REPEL_RADIUS && Math.abs(my) < height / 2 + REPEL_RADIUS;
          const R2 = REPEL_RADIUS * REPEL_RADIUS;
          const t = time;
          const damp = Math.pow(DAMPING, dt);

          for (let i = 0; i < COUNT; i++) {
            // Home on the morph between this pair of shapes, bowing out mid-flight
            const k = Math.min(1, Math.max(0, (mix - delay[i]) / span));
            const e = ease(k);
            const sb = Math.sin(Math.PI * k);
            const hx = ((A[i * 2] + (B[i * 2] - A[i * 2]) * e) + scatter[i * 2] * sb) * scale;
            const hy = ((A[i * 2 + 1] + (B[i * 2 + 1] - A[i * 2 + 1]) * e) + scatter[i * 2 + 1] * sb) * scale;

            const px = i * 3;
            if (reduce) {
              pos[px] = hx;
              pos[px + 1] = hy;
              continue;
            }

            let x = pos[px];
            let y = pos[px + 1];
            const vi = i * 2;
            let vx = vel[vi];
            let vy = vel[vi + 1];
            const isLoose = loose[i] === 1;
            // Letters are thin: the word's particles are held closer, so it reads
            const inWord = i >= symbolCount;

            // Spring home (softer while a morph is mid-flight, so it pours)
            const kk = (isLoose ? SPRING_LOOSE : inWord ? SPRING * 1.6 : SPRING) * (1 - bow * 0.35);
            vx += (hx - x) * kk * dt;
            vy += (hy - y) * kk * dt;

            // A slow current: two waves shared by neighbours read as air moving
            const ph = phase[i];
            const f = (isLoose ? FLOW_LOOSE : inWord ? FLOW * 0.4 : FLOW) * dt;
            vx += (Math.sin(y * 0.013 + t * 0.55 + ph * 0.35) + 0.5 * Math.sin(t * 0.9 + ph)) * f;
            vy += (Math.cos(x * 0.012 - t * 0.47 + ph * 0.35) + 0.5 * Math.cos(t * 0.8 + ph * 1.3)) * f;

            // The cursor scatters them
            if (near) {
              const dx = x - mx;
              const dy = y - my;
              const d2 = dx * dx + dy * dy;
              if (d2 < R2 && d2 > 0.01) {
                const d = Math.sqrt(d2);
                const push = (1 - d / REPEL_RADIUS) * REPEL * dt;
                vx += (dx / d) * push;
                vy += (dy / d) * push;
              }
            }

            vx *= damp;
            vy *= damp;
            x += vx * dt;
            y += vy * dt;
            vel[vi] = vx;
            vel[vi + 1] = vy;
            pos[px] = x;
            pos[px + 1] = y;
          }
          posAttr.needsUpdate = true;
          uniforms.uTime.value = t;
          renderer.render(scene, camera);
        };

        let ticking = false;
        let started = false;
        const start = () => {
          if (ticking) return;
          ticking = true;
          gsap.ticker.add(step);
          if (!started) {
            started = true;
            if (!reduce) gsap.to(uniforms.uGather, { value: 1, duration: 1.6, ease: "power1.out" });
          }
        };
        const stop = () => {
          if (!ticking) return;
          ticking = false;
          gsap.ticker.remove(step);
        };

        // Only spend time on the field while it is actually on screen.
        const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
          rootMargin: "120px 0px",
        });
        io.observe(wrap);

        const ro = new ResizeObserver(() => {
          width = Math.max(1, wrap.clientWidth);
          height = Math.max(1, wrap.clientHeight);
          renderer.setSize(width, height, false);
          camera.left = -width / 2;
          camera.right = width / 2;
          camera.top = height / 2;
          camera.bottom = -height / 2;
          camera.updateProjectionMatrix();
          scale = Math.min(width, height) * FIELD_FIT;
          if (!ticking) step(uniforms.uTime.value);
        });
        ro.observe(wrap);

        onReadyRef.current?.(true);

        return () => {
          io.disconnect();
          ro.disconnect();
          stop();
          gsap.killTweensOf(uniforms.uGather);
          window.removeEventListener("pointermove", onMove);
          geometry.dispose();
          material.dispose();
          renderer.dispose();
          canvas.remove();
        };
      })();
    });
    return () => {
      gone = true;
      teardown?.();
    };
  }, [active, shapes, words, position]);

  return <div ref={wrapRef} aria-hidden="true" className={className} />;
}

export default ParticleField;
