"use client";

import { useEffect, useRef } from "react";

interface Point3D { x: number; y: number; z: number }

function rotateY(p: Point3D, a: number): Point3D {
  return {
    x: p.x * Math.cos(a) - p.z * Math.sin(a),
    y: p.y,
    z: p.x * Math.sin(a) + p.z * Math.cos(a),
  };
}
function rotateX(p: Point3D, a: number): Point3D {
  return {
    x: p.x,
    y: p.y * Math.cos(a) - p.z * Math.sin(a),
    z: p.y * Math.sin(a) + p.z * Math.cos(a),
  };
}
function project(p: Point3D, cx: number, cy: number, fov: number) {
  const z = p.z + fov;
  const s = fov / Math.max(z, 1);
  return { sx: cx + p.x * s, sy: cy + p.y * s, depth: (p.z + 300) / 600 };
}

export default function ContactGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed internal resolution — CSS will scale it
    const W = 700, H = 700;
    canvas.width = W;
    canvas.height = H;
    const cx = W / 2, cy = H / 2;
    const FOV = 700;

    const R = 200;          // globe radius
    const ORBIT_R = 295;    // orbit ring radius
    const ORBIT_TILT = 0.4; // radians

    // ── Build sphere segments ──────────────────────────────────────────────
    type Seg = { a: Point3D; b: Point3D };
    const segs: Seg[] = [];
    const LATS = 14, LONS = 18, STEPS = 80;

    for (let i = 1; i < LATS; i++) {
      const phi = (Math.PI * i) / LATS - Math.PI / 2;
      for (let j = 0; j < STEPS; j++) {
        const t0 = (2 * Math.PI * j) / STEPS;
        const t1 = (2 * Math.PI * (j + 1)) / STEPS;
        const cp = Math.cos(phi), sp = Math.sin(phi);
        segs.push({
          a: { x: R * cp * Math.cos(t0), y: R * sp, z: R * cp * Math.sin(t0) },
          b: { x: R * cp * Math.cos(t1), y: R * sp, z: R * cp * Math.sin(t1) },
        });
      }
    }
    for (let j = 0; j < LONS; j++) {
      const theta = (2 * Math.PI * j) / LONS;
      for (let i = 0; i < STEPS; i++) {
        const p0 = (Math.PI * i) / STEPS - Math.PI / 2;
        const p1 = (Math.PI * (i + 1)) / STEPS - Math.PI / 2;
        segs.push({
          a: { x: R * Math.cos(p0) * Math.cos(theta), y: R * Math.sin(p0), z: R * Math.cos(p0) * Math.sin(theta) },
          b: { x: R * Math.cos(p1) * Math.cos(theta), y: R * Math.sin(p1), z: R * Math.cos(p1) * Math.sin(theta) },
        });
      }
    }

    // ── Equator ────────────────────────────────────────────────────────────
    const equatorPts: Point3D[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = (2 * Math.PI * i) / 120;
      equatorPts.push({ x: (R + 2) * Math.cos(t), y: 0, z: (R + 2) * Math.sin(t) });
    }

    // ── Orbit ring ────────────────────────────────────────────────────────
    const orbitSegs: Seg[] = [];
    for (let i = 0; i < 120; i++) {
      const a0 = (2 * Math.PI * i) / 120;
      const a1 = (2 * Math.PI * (i + 1)) / 120;
      orbitSegs.push({
        a: { x: ORBIT_R * Math.cos(a0), y: ORBIT_R * Math.sin(a0) * Math.sin(ORBIT_TILT), z: ORBIT_R * Math.sin(a0) * Math.cos(ORBIT_TILT) },
        b: { x: ORBIT_R * Math.cos(a1), y: ORBIT_R * Math.sin(a1) * Math.sin(ORBIT_TILT), z: ORBIT_R * Math.sin(a1) * Math.cos(ORBIT_TILT) },
      });
    }

    // ── State ──────────────────────────────────────────────────────────────
    let rotY = 0;
    const BASE_ROT_X = 0.2;
    let mx = 0, my = 0;      // smoothed mouse offset (radians)
    let tmx = 0, tmy = 0;    // target
    let orbitAngle = 0;
    let raf: number;

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      tmx = ((e.clientX - rect.left) / rect.width  - 0.5) * 0.5;
      tmy = ((e.clientY - rect.top)  / rect.height - 0.5) * 0.3;
    };
    window.addEventListener("mousemove", onMouse);

    // ── Draw loop ─────────────────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      rotY += 0.0028;
      mx += (tmx - mx) * 0.045;
      my += (tmy - my) * 0.045;
      const ax = BASE_ROT_X + my;
      const ay = rotY + mx;

      const transform = (p: Point3D) => rotateX(rotateY(p, ay), ax);

      // Globe wireframe
      for (const seg of segs) {
        const ra = transform(seg.a);
        const rb = transform(seg.b);
        const pa = project(ra, cx, cy, FOV);
        const pb = project(rb, cx, cy, FOV);
        const alpha = 0.06 + ((pa.depth + pb.depth) / 2) * 0.38;
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.strokeStyle = `rgba(82,183,136,${alpha.toFixed(3)})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }

      // Equator ring
      ctx.beginPath();
      for (let i = 0; i < equatorPts.length; i++) {
        const rp = transform(equatorPts[i]);
        const p = project(rp, cx, cy, FOV);
        if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = "rgba(149,213,178,0.5)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Orbit ring
      for (const seg of orbitSegs) {
        const ra = transform(seg.a);
        const rb = transform(seg.b);
        const pa = project(ra, cx, cy, FOV);
        const pb = project(rb, cx, cy, FOV);
        const alpha = 0.08 + ((pa.depth + pb.depth) / 2) * 0.35;
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.strokeStyle = `rgba(116,198,157,${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      // Satellite + trail
      orbitAngle += 0.009;
      const mkSat = (a: number): Point3D => ({
        x: ORBIT_R * Math.cos(a),
        y: ORBIT_R * Math.sin(a) * Math.sin(ORBIT_TILT),
        z: ORBIT_R * Math.sin(a) * Math.cos(ORBIT_TILT),
      });
      const satP  = project(transform(mkSat(orbitAngle)),       cx, cy, FOV);
      const trailP = project(transform(mkSat(orbitAngle - 0.1)), cx, cy, FOV);

      // Trail
      ctx.beginPath();
      ctx.moveTo(satP.sx, satP.sy);
      ctx.lineTo(trailP.sx, trailP.sy);
      ctx.strokeStyle = `rgba(149,213,178,${(0.15 + satP.depth * 0.45).toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Satellite dot
      const satSize = 4.5 + satP.depth * 4;
      ctx.beginPath();
      ctx.arc(satP.sx, satP.sy, satSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(216,243,220,${(0.5 + satP.depth * 0.5).toFixed(2)})`;
      ctx.fill();

      // Core ambient glow
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.6);
      g.addColorStop(0, "rgba(82,183,136,0.07)");
      g.addColorStop(1, "rgba(8,28,21,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.6, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
