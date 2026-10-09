"use client";

import React, { useEffect, useRef } from "react";
import type * as THREE from "three";
import { loadThree } from "./load-three";
import { useActivate } from "./use-activate";
import gsap from "gsap";
import { sampleShape, type ShapeDrawer } from "./particle-shapes";

export interface ParticleFieldProps {
  /** One drawer per symbol, in order. */
  shapes: readonly ShapeDrawer[];
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

const PALETTE = [
  { hex: "#3BA7F2", weight: 0.5 },
  { hex: "#7FE7D6", weight: 0.32 },
  { hex: "#E8F6FF", weight: 0.18 },
];

const vertexShader = /* glsl */ `
  uniform float uMix;
  uniform float uGather;
  uniform float uTime;
  uniform float uScale;
  uniform float uFlow;
  uniform float uScatter;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uRepel;
  uniform vec2 uMouse;

  attribute vec3 aB;
  attribute vec3 aScatter;
  attribute vec3 aHalo;
  attribute vec3 aColor;
  attribute float aDelay;
  attribute float aRand;
  attribute float aLoose;

  varying vec3 vColor;
  varying float vAlpha;

  float ease(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  float stagger(float x) {
    return clamp((x - aDelay) / ${(1 - DELAY_SPAN).toFixed(2)}, 0.0, 1.0);
  }

  void main() {
    // Morph from symbol A (position) to symbol B, bowing out mid-flight so the
    // particles swirl across rather than sliding in straight lines.
    float t = stagger(uMix);
    vec3 p = mix(position, aB, ease(t)) + aScatter * sin(3.14159265 * t) * uScatter;

    // A little fuzz off the line; the loose few drift well clear of it.
    p += aHalo;

    // Entrance: the symbol condenses out of a wide, faint cloud.
    float g = ease(stagger(uGather));
    p = mix(aScatter * 3.2 + aHalo * 5.0, p, g);

    p *= uScale;

    // Flow. Two slow travelling waves shared by neighbouring particles read as
    // liquid; a small bob of each particle's own reads as air. Both stay a few
    // pixels, so the symbol always holds its shape.
    float ph = aRand * 6.2831853;
    vec2 wave = vec2(
      sin(p.y * 0.021 + uTime * 0.8) + 0.6 * sin(p.x * 0.013 - uTime * 0.55),
      cos(p.x * 0.019 + uTime * 0.7) + 0.6 * sin(p.y * 0.015 + uTime * 0.45 + 1.7)
    );
    vec2 bob = vec2(sin(uTime * 1.1 + ph), cos(uTime * 0.9 + ph * 1.7));
    p.xy += (wave * 0.9 + bob * (0.35 + aLoose * 2.4)) * uFlow;

    vec4 world = modelMatrix * vec4(p, 1.0);

    // Cursor repulsion, in the same pixel space as uMouse.
    vec2 d = world.xy - uMouse;
    float dist = length(d);
    float push = (1.0 - smoothstep(0.0, 120.0, dist)) * uRepel;
    world.xy += (dist > 0.001 ? d / dist : vec2(0.0)) * push * 28.0;

    gl_Position = projectionMatrix * viewMatrix * world;
    gl_PointSize = uSize * (0.5 + aRand * 0.9) * (1.0 - aLoose * 0.35) * uPixelRatio;
    vColor = aColor;
    float twinkle = 0.82 + 0.18 * sin(uTime * 1.9 + ph * 3.0);
    vAlpha = (0.32 + aRand * 0.5) * (1.0 - aLoose * 0.55) * (0.2 + 0.8 * g) * twinkle;
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

/**
 * A fixed particle field that re-forms from one symbol into the next as its
 * `position` moves. Morph state lives entirely in the shader as a function of
 * position, so scrolling back plays the morph backwards and nothing is ever
 * replayed or interrupted. Per frame the CPU writes a handful of uniforms; the
 * two symbol buffers are re-uploaded only when position crosses a whole number.
 */
export function ParticleField({ shapes, position, onReady, className }: ParticleFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const active = useActivate(wrapRef);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!active || !wrap || !shapes.length) return;
    let gone = false;
    let teardown: void | (() => void);
    loadThree().then((THREE) => {
      if (gone) return;
      teardown = ((): void | (() => void) => {

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const vw = window.innerWidth;
        // Sized to the field: a phone's field is a quarter of a desktop's area.
        const COUNT = vw >= 1024 ? 11000 : vw >= 768 ? 8000 : 5000;

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

        const n = shapes.length;
        const targets = shapes.map((draw) => sampleShape(draw, COUNT, 384));

        const a = new Float32Array(targets[0]);
        const b = new Float32Array(targets[Math.min(1, n - 1)]);
        const scatter = new Float32Array(COUNT * 3);
        const halo = new Float32Array(COUNT * 3);
        const delay = new Float32Array(COUNT);
        const rand = new Float32Array(COUNT);
        const loose = new Float32Array(COUNT);
        const colors = new Float32Array(COUNT * 3);

        const palette = PALETTE.map((p) => ({ color: new THREE.Color(p.hex), weight: p.weight }));
        for (let i = 0; i < COUNT; i++) {
          const ang = Math.random() * Math.PI * 2;
          const m = 0.15 + Math.random() * 0.45;
          scatter[i * 3] = Math.cos(ang) * m;
          scatter[i * 3 + 1] = Math.sin(ang) * m;
          scatter[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

          // Heavily skewed: nearly every particle hugs the line, a few wander off it.
          const l = Math.pow(Math.random(), 4);
          loose[i] = l;
          const ha = Math.random() * Math.PI * 2;
          const hm = 0.008 + Math.random() * 0.012 + l * 0.24;
          halo[i * 3] = Math.cos(ha) * hm;
          halo[i * 3 + 1] = Math.sin(ha) * hm;
          halo[i * 3 + 2] = 0;

          delay[i] = Math.random() * DELAY_SPAN;
          rand[i] = Math.random();

          let pick = Math.random();
          const swatch = palette.find((p) => (pick -= p.weight) <= 0) ?? palette[0];
          colors[i * 3] = swatch.color.r;
          colors[i * 3 + 1] = swatch.color.g;
          colors[i * 3 + 2] = swatch.color.b;
        }

        const geometry = new THREE.BufferGeometry();
        const aAttr = new THREE.BufferAttribute(a, 3);
        const bAttr = new THREE.BufferAttribute(b, 3);
        geometry.setAttribute("position", aAttr);
        geometry.setAttribute("aB", bAttr);
        geometry.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
        geometry.setAttribute("aHalo", new THREE.BufferAttribute(halo, 3));
        geometry.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
        geometry.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
        geometry.setAttribute("aLoose", new THREE.BufferAttribute(loose, 1));
        geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

        const small = vw < 768;
        const uniforms = {
          uMix: { value: 0 },
          uGather: { value: reduce ? 1 : 0 },
          uTime: { value: 0 },
          uScale: { value: Math.min(width, height) * FIELD_FIT },
          uFlow: { value: reduce ? 0 : small ? 2.6 : 3.4 },
          uScatter: { value: reduce ? 0 : 1 },
          uSize: { value: small ? 2.1 : 2.3 },
          uPixelRatio: { value: pixelRatio },
          uRepel: { value: 0 },
          uMouse: { value: new THREE.Vector2(-9999, -9999) },
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

        // ── Position → which pair of symbols, and how far between them ──────────
        let segment = 0;
        let smooth = Math.min(n - 1, Math.max(0, position.current));

        const setSegment = (s: number) => {
          if (s === segment) return;
          segment = s;
          a.set(targets[s]);
          b.set(targets[Math.min(s + 1, n - 1)]);
          aAttr.needsUpdate = bAttr.needsUpdate = true;
        };

        // ── Cursor ────────────────────────────────────────────────────────────────
        const mouse = { x: -9999, y: -9999 };
        const onMove = (e: PointerEvent) => {
          mouse.x = e.clientX;
          mouse.y = e.clientY;
        };
        if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });

        // ── Frame ─────────────────────────────────────────────────────────────────
        const render = (time: number, deltaMs = 16) => {
          const target = Math.min(n - 1, Math.max(0, position.current));
          // A short, frame-rate independent ease on top of the scroll smoothing, so
          // a hard flick still pours from one symbol into the next.
          smooth = reduce ? target : smooth + (target - smooth) * (1 - Math.exp(-deltaMs / 110));
          if (Math.abs(target - smooth) < 1e-4) smooth = target;

          const s = Math.min(n - 2, Math.floor(smooth));
          setSegment(Math.max(0, s));
          uniforms.uMix.value = n > 1 ? smooth - segment : 0;

          if (!reduce) {
            uniforms.uTime.value = time;
            const r = wrap.getBoundingClientRect();
            const mx = mouse.x - r.left;
            const my = mouse.y - r.top;
            const inside = mx >= 0 && my >= 0 && mx <= r.width && my <= r.height;
            uniforms.uMouse.value.set(mx - width / 2, height / 2 - my);
            uniforms.uRepel.value += ((inside ? 1 : 0) - uniforms.uRepel.value) * 0.08;
          }

          renderer.render(scene, camera);
        };

        let ticking = false;
        let started = false;
        const start = () => {
          if (ticking) return;
          ticking = true;
          gsap.ticker.add(render);
          if (!started) {
            started = true;
            if (!reduce) gsap.to(uniforms.uGather, { value: 1, duration: 2.2, ease: "none" });
          }
        };
        const stop = () => {
          if (!ticking) return;
          ticking = false;
          gsap.ticker.remove(render);
        };

        // Only spend GPU time while the field is actually on screen.
        const io = new IntersectionObserver(
          ([entry]) => (entry.isIntersecting ? start() : stop()),
          { rootMargin: "120px 0px" }
        );
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
          uniforms.uScale.value = Math.min(width, height) * FIELD_FIT;
          if (!ticking) render(uniforms.uTime.value);
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
  }, [active, shapes, position]);

  return <div ref={wrapRef} aria-hidden="true" className={className} />;
}

export default ParticleField;
