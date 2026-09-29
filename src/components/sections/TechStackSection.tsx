"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import { TECH_ICONS } from "./tech-stack-icons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface Tech {
  name: string;
  kind: string;
  /** Relative size: 1 small, 2 medium, 3 large */
  size: 1 | 2 | 3;
  /** Kept on narrow screens, where only the core of the stack fits legibly */
  core?: boolean;
}

/* The toolkit. Edit freely: size is how central the tool is to the work.
   Each ball carries the tool's mark in its pentagons (see tech-stack-icons). */
const STACK: Tech[] = [
  { name: "React", kind: "UI library", size: 3, core: true },
  { name: "Next.js", kind: "Framework", size: 3, core: true },
  { name: "TypeScript", kind: "Language", size: 3, core: true },
  { name: "JavaScript", kind: "Language", size: 2, core: true },
  { name: "GSAP", kind: "Animation", size: 2, core: true },
  { name: "Three.js", kind: "3D / WebGL", size: 2, core: true },
  { name: "Node.js", kind: "Runtime", size: 2, core: true },
  { name: "Tailwind", kind: "Styling", size: 2, core: true },
  { name: "PostgreSQL", kind: "Database", size: 2, core: true },
  { name: "Figma", kind: "Design", size: 2, core: true },
  { name: "HTML", kind: "Markup", size: 1 },
  { name: "CSS", kind: "Styling", size: 1 },
  { name: "Framer Motion", kind: "Animation", size: 1 },
  { name: "Lenis", kind: "Scroll", size: 1 },
  { name: "WebGL", kind: "Graphics", size: 1 },
  { name: "tRPC", kind: "API", size: 1 },
  { name: "Prisma", kind: "ORM", size: 1 },
  { name: "Stripe", kind: "Payments", size: 1, core: true },
  { name: "Sanity", kind: "CMS", size: 1 },
  { name: "Vercel", kind: "Deploy", size: 1, core: true },
  { name: "Git", kind: "Version control", size: 1, core: true },
  { name: "D3", kind: "Data viz", size: 1 },
  { name: "Docker", kind: "Containers", size: 1, core: true },
];

/* ── The physics ─────────────────────────────────────────────────────────
   A 3D world measured in ball radii (a medium ball is 1 unit) and seconds.
   Every ball is pulled towards an attractor that sits inside a glass bubble,
   and the bubble trails the pointer. The bubble is solid: at rest the balls
   pack around it, and when it moves fast it knocks them loose, spinning,
   until the pull brings them back. The world steps at a fixed 120 Hz so it
   feels the same on 60, 120 and 144 Hz screens. */
const STEP = 1 / 120;
const MAX_STEPS = 6; // per frame, so a stalled tab doesn't fast-forward
const SOLVER_PASSES = 3;
const ATTRACT = 34; // pull towards the attractor, units/s² (the same at any range)
const LINEAR_DAMPING = 0.85; // per second, applied as v /= 1 + damping·dt
const ANGULAR_DAMPING = 0.9;
const FOLLOW = 12; // how quickly the bubble catches the pointer, per second
const RESTITUTION = 0.32; // ball against ball
const BUBBLE_RESTITUTION = 0.9; // the bubble hits harder than the balls do
const FRICTION = 0.35; // surface grip: what sets balls spinning on contact
const SLOP = 0.004; // overlap left alone, so resting contacts don't buzz
const CORRECTION = 0.7; // share of the remaining overlap fixed per pass
const MAX_SPEED = 42;
const DEPTH = 5; // balls stay within ±DEPTH of the attractor's plane
const SIZE_SCALE: Record<Tech["size"], number> = { 1: 0.92, 2: 1, 3: 1.08 };
/** Below this stage width, only the core of the stack is shown */
const NARROW = 560;
const FOV = 30;

/* ── The ball's skin ─────────────────────────────────────────────────────
   A classic football: a truncated icosahedron blown up into a sphere. Its 12
   pentagons face the icosahedron's vertices and its 20 hexagons face the
   icosahedron's faces. The pentagons sit slightly further out (1.0265×), so
   a point belongs to whichever face plane its ray reaches first. */
const PHI = (1 + Math.sqrt(5)) / 2;
const PENT_WEIGHT = 1 / 1.0265315;
/** A pentagon's inradius on its plane, relative to the plane's distance */
const PENT_INRADIUS = 0.2957;
/** The mark's box, in pentagon inradii: the mark fills nearly all of it */
const LOGO_SPAN = 1.8;

function evenPerms([a, b, c]: number[]) {
  return [
    [a, b, c],
    [b, c, a],
    [c, a, b],
  ];
}

function signed(base: number[][]) {
  const out = new Map<string, THREE.Vector3>();
  for (const p of base) {
    for (const sx of [1, -1]) {
      for (const sy of [1, -1]) {
        for (const sz of [1, -1]) {
          const v = new THREE.Vector3(p[0] * sx, p[1] * sy, p[2] * sz).normalize();
          out.set(v.toArray().map((n) => n.toFixed(4)).join(), v);
        }
      }
    }
  }
  return [...out.values()];
}

const pentagonNormals = () => signed(evenPerms([0, 1, PHI]));
const hexagonNormals = () => signed([[1, 1, 1], ...evenPerms([0, PHI, 1 / PHI])]);

const SKIN_HEAD = /* glsl */ `
uniform vec3 uPent[12];
uniform vec3 uHex[20];
uniform sampler2D uLogo;
uniform vec3 uPentColor;
uniform vec3 uHexColor;
uniform vec3 uSeamColor;
uniform vec3 uLogoColor;
varying vec3 vObjDir;
`;

const SKIN_BODY = /* glsl */ `
  vec3 dir = normalize(vObjDir);
  float s1 = -2.0;
  float s2 = -2.0;
  vec3 face = vec3(0.0, 0.0, 1.0);
  float isPent = 0.0;
  for (int i = 0; i < 12; i++) {
    float s = dot(dir, uPent[i]) * ${PENT_WEIGHT.toFixed(6)};
    if (s > s1) { s2 = s1; s1 = s; face = uPent[i]; isPent = 1.0; }
    else if (s > s2) { s2 = s; }
  }
  for (int i = 0; i < 20; i++) {
    float s = dot(dir, uHex[i]);
    if (s > s1) { s2 = s1; s1 = s; face = uHex[i]; isPent = 0.0; }
    else if (s > s2) { s2 = s; }
  }
  // Distance from the nearest seam, and a soft, antialiased stitch line
  float edge = s1 - s2;
  float aa = fwidth(edge);
  float seam = 1.0 - smoothstep(0.006 - aa, 0.006 + aa, edge);

  // The pentagon's own flat coordinates, for its mark
  vec3 up = abs(face.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 t1 = normalize(cross(up, face));
  vec3 t2 = cross(face, t1);
  vec3 onPlane = dir / max(dot(dir, face), 0.2) - face;
  vec2 logoUv = vec2(dot(onPlane, t1), dot(onPlane, t2)) / ${(PENT_INRADIUS * LOGO_SPAN).toFixed(4)} + 0.5;
  vec2 gx = dFdx(logoUv);
  vec2 gy = dFdy(logoUv);
  float logo = 0.0;
  if (isPent > 0.5 && all(greaterThan(logoUv, vec2(0.0))) && all(lessThan(logoUv, vec2(1.0)))) {
    logo = textureGrad(uLogo, logoUv, gx, gy).a;
  }

  vec3 skin = isPent > 0.5 ? mix(uPentColor, uLogoColor, logo) : uHexColor;
  skin = mix(skin, uSeamColor, seam);
  // Panels puff out between the stitches, so the grooves sit in shade
  skin *= mix(0.8, 1.0, smoothstep(0.0, 0.05, edge));
  diffuseColor.rgb = skin;
  float logoMark = logo * isPent;
`;

/** The marks are lifted a little, so they stay crisp white on the shaded side */
const SKIN_LIGHT = /* glsl */ `
  #include <emissivemap_fragment>
  totalEmissiveRadiance += uLogoColor * logoMark * 0.3;
`;

const BUBBLE_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const BUBBLE_FRAG = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  float facing = clamp(dot(n, v), 0.0, 1.0);
  float rim = pow(1.0 - facing, 2.6);
  vec3 light = normalize(vec3(-0.35, 0.75, 0.55));
  float spec = pow(max(dot(reflect(-light, n), v), 0.0), 220.0);
  // Light gathers in the lower rim, as it does in a glass ball
  float lower = smoothstep(0.1, -0.85, n.y) * rim;
  vec3 color = mix(vec3(0.72, 0.8, 1.0), vec3(1.0), rim * 0.7 + spec);
  float alpha = 0.06 + rim * 0.42 + lower * 0.3 + spec * 0.9;
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;

/** The tool's mark, white on transparent, for the pentagons */
function logoTexture(t: Tech) {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#ffffff";
    const path = TECH_ICONS[t.name];
    if (path) {
      const s = (size * 0.94) / 24;
      g.translate(size / 2, size / 2);
      g.scale(s, s);
      g.translate(-12, -12);
      g.fill(new Path2D(path));
    } else {
      // No mark on file: set the name instead
      let px = 184;
      g.textAlign = "center";
      g.textBaseline = "middle";
      do {
        g.font = `800 ${px}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        px -= 4;
      } while (g.measureText(t.name).width > size * 0.92 && px > 48);
      g.fillText(t.name, size / 2, size / 2 + px * 0.04);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

interface Ball {
  tech: Tech;
  mesh: THREE.Mesh;
  p: THREE.Vector3;
  v: THREE.Vector3;
  w: THREE.Vector3;
  r: number;
  inv: number; // 1 / mass
  invI: number; // 1 / moment of inertia (solid sphere: 2/5 m r²)
}

export function TechStackSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);

  // Copy entrance
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-ts-fade]", {
          y: 24,
          autoAlpha: 0,
          duration: 0.95,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: stageRef.current, start: "top 75%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const chip = chipRef.current;
    if (!stage || !canvas || !chip) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      stage.dataset.fallback = "true";
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envMap = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.75;
    room.dispose();

    // A soft key from the top left and a blue bounce from below, like a
    // studio shot against the backdrop
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-6, 9, 10);
    scene.add(key);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3ba7f2, 0.9));

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);

    const geometry = new THREE.SphereGeometry(1, 64, 48);
    const pentagons = pentagonNormals();
    const hexagons = hexagonNormals();
    // The site's royal blue and ice white
    const pentColor = new THREE.Color("#0b3d91");
    const hexColor = new THREE.Color("#eef8ff");
    const seamColor = new THREE.Color("#9db3cf");
    const logoColor = new THREE.Color("#ffffff");

    const textures: THREE.Texture[] = [];
    const materials: THREE.Material[] = [];
    const all: Ball[] = STACK.map((tech) => {
      const logo = logoTexture(tech);
      textures.push(logo);
      const material = new THREE.MeshStandardMaterial({ roughness: 0.46, metalness: 0 });
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, {
          uPent: { value: pentagons },
          uHex: { value: hexagons },
          uLogo: { value: logo },
          uPentColor: { value: pentColor },
          uHexColor: { value: hexColor },
          uSeamColor: { value: seamColor },
          uLogoColor: { value: logoColor },
        });
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vObjDir;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjDir = position;");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>\n${SKIN_HEAD}`)
          .replace("#include <map_fragment>", SKIN_BODY)
          .replace("#include <emissivemap_fragment>", SKIN_LIGHT);
      };
      material.customProgramCacheKey = () => "ts-football";
      materials.push(material);
      const mesh = new THREE.Mesh(geometry, material);
      // Start every ball at its own turn, so the marks face all ways
      mesh.quaternion.setFromEuler(new THREE.Euler(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3));
      mesh.visible = false;
      scene.add(mesh);
      return {
        tech,
        mesh,
        p: new THREE.Vector3(),
        v: new THREE.Vector3(),
        w: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
        r: SIZE_SCALE[tech.size],
        inv: 1,
        invI: 1,
      };
    });
    all.forEach((b) => {
      const m = b.r ** 3;
      b.inv = 1 / m;
      b.invI = 1 / (0.4 * m * b.r * b.r);
    });
    let balls: Ball[] = all;

    const bubbleMaterial = new THREE.ShaderMaterial({
      vertexShader: BUBBLE_VERT,
      fragmentShader: BUBBLE_FRAG,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    materials.push(bubbleMaterial);
    const bubble = new THREE.Mesh(geometry, bubbleMaterial);
    bubble.renderOrder = 1;
    scene.add(bubble);

    // The bubble (and the attractor inside it), where it is headed, and home
    const bub = { x: 0, y: 0, vx: 0, vy: 0, r: 1.7 };
    const target = { x: 0, y: 0 };
    const home = { x: 0, y: 0 };
    const ptr = { x: 0, y: 0, active: false, mouse: true, over: false };
    let started = false;

    let W = 0;
    let H = 0;
    let ppu = 50; // px per unit on the attractor's plane
    let camZ = 30;
    let halfW = 10; // half the visible world at z = 0
    let halfH = 6;
    let pageLeft = 0;
    let pageTop = 0;

    const render = () => renderer.render(scene, camera);

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      pageLeft = rect.left + window.scrollX;
      pageTop = rect.top + window.scrollY;
      if (!rect.width || !rect.height) return;
      if (rect.width === W && rect.height === H) return;
      W = rect.width;
      H = rect.height;

      const narrow = W < NARROW;
      balls = all.filter((b) => !narrow || b.tech.core);
      all.forEach((b) => (b.mesh.visible = started && balls.includes(b)));
      bub.r = narrow ? 1.4 : 1.7;
      // A medium ball's radius in px: under 5% of the width, a touch larger
      // than the reference so the marks read, and larger still on phones
      // where fewer balls are shown
      ppu = narrow ? Math.max(24, Math.min(48, W * 0.1)) : Math.max(32, Math.min(72, W * 0.046, H * 0.09));
      halfW = W / 2 / ppu;
      halfH = H / 2 / ppu;
      camZ = halfH / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      camera.aspect = W / H;
      camera.position.set(0, 0, camZ);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      home.x = narrow ? 0 : halfW * 0.16;
      home.y = narrow ? halfH * 0.08 : halfH * 0.04;
      if (!ptr.active) {
        target.x = home.x;
        target.y = home.y;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(W, H, false);
    };

    /* ── Stepping the world ── */
    const n = new THREE.Vector3();
    const rel = new THREE.Vector3();
    const tang = new THREE.Vector3();
    const imp = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    const tmp2 = new THREE.Vector3();
    const bubVel = new THREE.Vector3();
    const dq = new THREE.Quaternion();
    let fastest = 0;
    let fastestSpin = 0;

    /**
     * Friction where two surfaces touch, which is what sets balls spinning.
     * `n` points from a to b and `rel` is b's surface velocity against a's;
     * a null `a` is the bubble, which nothing can push or turn.
     */
    const grip = (a: Ball | null, b: Ball, jn: number) => {
      tang.copy(rel).addScaledVector(n, -rel.dot(n));
      const slide = tang.length();
      if (slide < 1e-5) return;
      const invA = a ? a.inv : 0;
      const k = 1 / (3.5 * (invA + b.inv)); // tangential effective mass
      const press = jn + (1 / (invA + b.inv)) * ATTRACT * STEP;
      const jt = Math.min(slide * k, FRICTION * press);
      imp.copy(tang).multiplyScalar(jt / slide); // impulse on a; b gets -imp
      tmp.crossVectors(n, imp);
      if (a) {
        a.v.addScaledVector(imp, a.inv);
        a.w.addScaledVector(tmp, a.r * a.invI);
      }
      b.v.addScaledVector(imp, -b.inv);
      b.w.addScaledVector(tmp, b.r * b.invI);
    };

    const step = (dt: number) => {
      // The bubble trails its target; its velocity is what it hits with
      const k = 1 - Math.exp(-FOLLOW * dt);
      const nx = bub.x + (target.x - bub.x) * k;
      const ny = bub.y + (target.y - bub.y) * k;
      bub.vx = (nx - bub.x) / dt;
      bub.vy = (ny - bub.y) / dt;
      bub.x = nx;
      bub.y = ny;
      bubVel.set(bub.vx, bub.vy, 0);

      const linDrag = 1 / (1 + LINEAR_DAMPING * dt);
      const angDrag = 1 / (1 + ANGULAR_DAMPING * dt);
      for (const b of balls) {
        // The attractor pulls with the same strength at any range, easing
        // off only right at its centre
        tmp.set(bub.x - b.p.x, bub.y - b.p.y, -b.p.z);
        const d = tmp.length();
        if (d > 1e-4) b.v.addScaledVector(tmp, (ATTRACT * Math.min(1, d) * dt) / d);
        b.v.multiplyScalar(linDrag);
        b.w.multiplyScalar(angDrag);
        const sp = b.v.length();
        if (sp > MAX_SPEED) b.v.multiplyScalar(MAX_SPEED / sp);
        b.p.addScaledVector(b.v, dt);
        if (Math.abs(b.p.z) > DEPTH) {
          b.p.z = Math.sign(b.p.z) * DEPTH;
          if (b.v.z * b.p.z > 0) b.v.z *= -0.3;
        }
      }

      for (let pass = 0; pass < SOLVER_PASSES; pass++) {
        const bounce = pass === 0;
        for (let i = 0; i < balls.length; i++) {
          const a = balls[i];
          for (let j = i + 1; j < balls.length; j++) {
            const b = balls[j];
            n.subVectors(b.p, a.p);
            const reach = a.r + b.r;
            const d2 = n.lengthSq();
            if (d2 >= reach * reach) continue;
            const d = Math.sqrt(d2) || 1e-4;
            n.divideScalar(d);
            const sum = a.inv + b.inv;
            const fix = (Math.max(0, reach - d - SLOP) * CORRECTION) / sum;
            a.p.addScaledVector(n, -fix * a.inv);
            b.p.addScaledVector(n, fix * b.inv);
            // b's surface velocity against a's, at the point they touch
            tmp.crossVectors(b.w, n).multiplyScalar(-b.r);
            tmp2.crossVectors(a.w, n).multiplyScalar(a.r);
            rel.subVectors(b.v, a.v).add(tmp).sub(tmp2);
            const vn = rel.dot(n);
            let jn = 0;
            if (vn < 0) {
              jn = (-(1 + (bounce ? RESTITUTION : 0)) * vn) / sum;
              a.v.addScaledVector(n, -jn * a.inv);
              b.v.addScaledVector(n, jn * b.inv);
            }
            if (bounce) grip(a, b, jn);
          }
        }
        // The bubble: solid, and unmoved by what it hits
        for (const b of balls) {
          n.set(b.p.x - bub.x, b.p.y - bub.y, b.p.z);
          const reach = bub.r + b.r;
          const d2 = n.lengthSq();
          if (d2 >= reach * reach) continue;
          const d = Math.sqrt(d2) || 1e-4;
          n.divideScalar(d);
          b.p.addScaledVector(n, reach - d);
          tmp.crossVectors(b.w, n).multiplyScalar(-b.r);
          rel.subVectors(b.v, bubVel).add(tmp);
          const vn = rel.dot(n);
          let jn = 0;
          if (vn < 0) {
            jn = (-(1 + (bounce ? BUBBLE_RESTITUTION : 0)) * vn) / b.inv;
            b.v.addScaledVector(n, jn * b.inv);
          }
          if (bounce) grip(null, b, jn);
        }
      }

      fastest = 0;
      fastestSpin = 0;
      for (const b of balls) {
        const spin = b.w.length();
        if (spin > 1e-6) {
          dq.setFromAxisAngle(tmp.copy(b.w).divideScalar(spin), spin * dt);
          b.mesh.quaternion.premultiply(dq);
        }
        fastest = Math.max(fastest, b.v.length());
        fastestSpin = Math.max(fastestSpin, spin);
      }
    };

    const place = () => {
      for (const b of balls) {
        b.mesh.position.copy(b.p);
        b.mesh.scale.setScalar(b.r);
      }
      bubble.position.set(bub.x, bub.y, 0);
      bubble.scale.setScalar(bub.r);
    };

    /* ── Entry: the balls fly in from all round the stage ── */
    const start = () => {
      started = true;
      bub.x = target.x;
      bub.y = target.y;
      const reach = Math.hypot(halfW, halfH) + 3;
      all.forEach((b, i) => {
        const a = i * 2.39996 + 0.6;
        const rr = reach + (i % 4) * 1.2;
        b.p.set(home.x + Math.cos(a) * rr, home.y + Math.sin(a) * rr, (((i * 7) % 5) - 2) * 1.2);
        b.v.set(-Math.cos(a), -Math.sin(a), 0).multiplyScalar(8 + (i % 3) * 2);
        b.mesh.visible = balls.includes(b);
      });
      stage.dataset.ready = "true";
    };

    /* ── Pointer ── */
    let clientX = -9999;
    let clientY = -9999;
    let touchRelease = 0;
    let hovered: Ball | null = null;

    const toWorld = () => {
      const x = clientX + window.scrollX - pageLeft;
      const y = clientY + window.scrollY - pageTop;
      ptr.x = x;
      ptr.y = y;
      ptr.over = x >= 0 && y >= 0 && x <= W && y <= H;
      return { x: (x - W / 2) / ppu, y: -(y - H / 2) / ppu };
    };

    const goHome = () => {
      ptr.active = false;
      target.x = home.x;
      target.y = home.y;
    };

    const aim = () => {
      const w = toWorld();
      if (ptr.over && (ptr.mouse || ptr.active)) {
        ptr.active = true;
        target.x = w.x;
        target.y = w.y;
      } else if (ptr.mouse && ptr.active) {
        goHome();
      }
    };

    const onMove = (e: PointerEvent) => {
      if (reduce) return;
      const touch = e.pointerType !== "mouse";
      if (touch && e.type === "pointermove" && e.buttons === 0) return;
      ptr.mouse = !touch;
      clientX = e.clientX;
      clientY = e.clientY;
      if (touch && e.type === "pointerdown") {
        toWorld();
        ptr.active = ptr.over;
        window.clearTimeout(touchRelease);
      }
      aim();
      if (ptr.over || ptr.active) wake();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !ptr.active) return;
      // A tap leaves the attractor where it landed for a moment, then home
      window.clearTimeout(touchRelease);
      touchRelease = window.setTimeout(() => {
        goHome();
        wake();
      }, 2200);
    };
    const onScroll = () => {
      if (!ptr.mouse || clientX === -9999) return;
      aim();
      if (ptr.over || ptr.active) wake();
    };
    const onLeave = () => {
      if (!ptr.mouse) return;
      ptr.over = false;
      if (ptr.active) {
        goHome();
        wake();
      }
    };

    /* ── The name chip: follows whichever ball the cursor is over ── */
    const proj = new THREE.Vector3();
    const chipName = chip.querySelector<HTMLElement>("[data-name]");
    const chipKind = chip.querySelector<HTMLElement>("[data-kind]");
    const updateChip = () => {
      let hit: Ball | null = null;
      let hitZ = -Infinity;
      let hx = 0;
      let hy = 0;
      let hr = 0;
      if (ptr.mouse && ptr.over) {
        for (const b of balls) {
          proj.copy(b.p).project(camera);
          const sx = ((proj.x + 1) / 2) * W;
          const sy = ((1 - proj.y) / 2) * H;
          const sr = (b.r * ppu * camZ) / (camZ - b.p.z);
          if ((ptr.x - sx) ** 2 + (ptr.y - sy) ** 2 < sr * sr && b.p.z > hitZ) {
            hit = b;
            hitZ = b.p.z;
            hx = sx;
            hy = sy;
            hr = sr;
          }
        }
      }
      if (hit !== hovered) {
        hovered = hit;
        if (hit && chipName && chipKind) {
          chipName.textContent = hit.tech.name;
          chipKind.textContent = hit.tech.kind;
        }
        chip.dataset.show = hit ? "true" : "false";
      }
      if (hit) chip.style.transform = `translate3d(${hx.toFixed(1)}px, ${(hy - hr - 10).toFixed(1)}px, 0) translate(-50%, -100%)`;
    };

    /* ── The loop: runs while the stage is on screen and anything moves ── */
    let raf = 0;
    let last = 0;
    let acc = 0;
    let visible = false;
    let calm = 0;

    const frame = (t: number) => {
      const dt = last ? Math.min(0.1, (t - last) / 1000) : STEP;
      last = t;
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < MAX_STEPS) {
        step(STEP);
        acc -= STEP;
        steps++;
      }
      if (steps === MAX_STEPS) acc = 0;
      place();
      render();
      updateChip();

      // Sleep once everything, bubble included, has come to rest
      const still = fastest < 0.03 && fastestSpin < 0.06 && Math.hypot(bub.vx, bub.vy) < 0.01;
      calm = still ? calm + dt : 0;
      if (!visible || calm > 0.8) {
        raf = 0;
        last = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    function wake() {
      calm = 0;
      if (!raf && visible && started && !reduce) raf = requestAnimationFrame(frame);
    }

    // Reduced motion: the cluster forms off screen and is shown at rest
    const settleStill = () => {
      bub.x = target.x = home.x;
      bub.y = target.y = home.y;
      all.forEach((b, i) => {
        const a = i * 2.39996;
        b.p.set(home.x + Math.cos(a) * 4, home.y + Math.sin(a) * 4, ((i % 5) - 2) * 0.8);
        b.v.set(0, 0, 0);
      });
      for (let i = 0; i < 900; i++) step(STEP);
      all.forEach((b) => {
        b.w.set(0, 0, 0);
        b.v.set(0, 0, 0);
      });
      place();
      render();
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (!visible) return;
        measure();
        if (!started) {
          if (reduce) {
            started = true;
            all.forEach((b) => (b.mesh.visible = balls.includes(b)));
            stage.dataset.ready = "true";
            settleStill();
            return;
          }
          start();
        }
        wake();
      },
      { threshold: 0.12 },
    );
    io.observe(stage);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    // The stage's page position shifts when pins above it are refreshed
    const onRefresh = () => {
      const prevW = W;
      const prevH = H;
      measure();
      if (started && (W !== prevW || H !== prevH)) {
        if (reduce) settleStill();
        else {
          place();
          render();
        }
      }
      wake();
    };
    ScrollTrigger.addEventListener("refresh", onRefresh);
    const ro = new ResizeObserver(onRefresh);
    ro.observe(stage);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(touchRelease);
      io.disconnect();
      ro.disconnect();
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="stack"
      aria-labelledby="stack-title"
      className="ts-section relative w-full bg-[#072A5E] text-[#E8F6FF]"
    >
      {/* For screen readers: the stack as a plain list */}
      <ul className="sr-only">
        {STACK.map((t) => (
          <li key={t.name}>
            {t.name}, {t.kind}
          </li>
        ))}
      </ul>

      <div ref={stageRef} className="ts-stage">
        <div className="ts-top">
          <div data-ts-fade className="flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#E8F6FF]/70" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#E8F6FF]/85 font-bold">
              Tech stack // Tools I trust
            </span>
          </div>
          <p data-ts-fade className="ts-intro">
            The tools I reach for every day.
            <span className="ts-motion-only ts-fine"> They gather around your cursor. Move quickly and you&rsquo;ll knock them loose.</span>
            <span className="ts-motion-only ts-touch"> Tap the stage and they gather there. Drag across them to knock them loose.</span>
          </p>
        </div>

        <canvas ref={canvasRef} className="ts-canvas" aria-hidden="true" />

        <div className="ts-foot">
          <HeadingReveal
            as="h2"
            id="stack-title"
            className="ts-title font-sans font-black uppercase tracking-tighter leading-none text-[#E8F6FF]"
          >
            {["The toolkit", <span key="dot" style={{ color: "#7FE7D6" }}>.</span>]}
          </HeadingReveal>
          <p data-ts-fade className="ts-sub ts-motion-only">
            Enjoy the pull. <span className="ts-fine">Move your mouse.</span>
            <span className="ts-touch">Tap anywhere.</span>
          </p>
        </div>

        <div ref={chipRef} className="ts-chip" data-show="false" aria-hidden="true">
          <b data-name />
          <span data-kind />
        </div>

        {/* Shown only if WebGL is unavailable */}
        <ul className="ts-fallback" aria-hidden="true">
          {STACK.map((t) => (
            <li key={t.name}>{t.name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default TechStackSection;
