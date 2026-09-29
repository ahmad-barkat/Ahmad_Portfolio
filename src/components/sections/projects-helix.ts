import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { LOGO_CURSOR } from "@/components/ui/Logo";

/**
 * The projects "world": the logo in 3D at the centre, with the project cards
 * wound around it on a helix, like the strands of DNA.
 *
 * The cards sit on the surface of a vertical cylinder facing outwards, so the
 * strands show through dimmed behind. Where the strand comes round to the
 * front, four cards step out of it into the "front": a row either side of the
 * logo on wide screens, a winding column under it on narrow ones. Those four
 * are in full colour and open their project when clicked.
 *
 * Moving `offset` slides every card along the strand by that many places, so
 * the front hands one card back to the helix and takes the next one from it.
 * There are more cards than projects: the list repeats round the strand, so
 * the carousel never runs out. At rest `offset` is a whole number plus
 * `REST_PHASE`, which puts the four front cards exactly in their places.
 *
 * Everything is driven from `state`:
 *   dolly  0..1  the camera dives in from far away until the logo is full size
 *   spin         the logo's turn about its own vertical axis (radians)
 *   cards  0..1  the cards rush in past the camera and settle on the helix
 *   offset       the carousel's position, in cards (the page sets it from scroll)
 *
 * Before the dive the world idles on a loop of `LOOP_SECONDS`: the dust
 * streams past and the logo turns once. The opening video is a recording of
 * exactly that loop (see /dev/world-loop), and `syncLoop` sets the scene to
 * the video's current time, so the hand-off from video to live 3D is exact.
 */
export interface HelixState {
  dolly: number;
  spin: number;
  cards: number;
  offset: number;
}

/** Length of the idle loop, and so of the opening video */
export const LOOP_SECONDS = 10;

/** `offset` at a stop is a whole number plus this: four cards sit in front */
export const REST_PHASE = 0.5;

/** Height of the view at the logo's depth, in world units */
const VIEW_H = 10;
const FOV = 30;
const CAM_Z = VIEW_H / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
/** Far enough out that the logo is a speck */
const CAM_FAR = 240;
/** Cards on the strand; must be a multiple of the project count */
const CARD_COUNT = 30;
const CARD_ASPECT = 1.45;

/** The dust streams through this depth range, wrapping at the ends */
const DUST_NEAR = CAM_FAR + 30;
const DUST_FAR = -70;
const DUST_SPAN = DUST_NEAR - DUST_FAR;
/** One full span per loop, so the stream repeats seamlessly */
const DUST_SPEED = DUST_SPAN / LOOP_SECONDS;
const TURN_SPEED = (Math.PI * 2) / LOOP_SECONDS;
const INK = new THREE.Color("#041B3F");
const NAVY = new THREE.Color("#072A5E");

/** The logo's height on wide screens, in world units (a quarter of the view) */
const LOGO_H_WIDE = 2.5;
/** The logo's half width over its height */
const LOGO_HALF_W = 0.49;

/** The front cards stand this far in front of the logo */
const FRONT_Z = 2.4;
/** How much bigger things at FRONT_Z look than at the logo's depth */
const FRONT_S = CAM_Z / (CAM_Z - FRONT_Z);

/** An angle folded into -PI..PI */
function wrapPi(a: number) {
  return a - Math.PI * 2 * Math.round(a / (Math.PI * 2));
}

const smooth01 = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/**
 * Where everything sits for a given screen. Front positions are in "screen
 * units": world units as seen at the logo's depth, where the view is VIEW_H
 * tall, so the layout can be planned in terms of what the visitor sees.
 */
interface Layout {
  mode: "row" | "column";
  logoH: number;
  logoY: number;
  // The helix behind
  radius: number;
  step: number;
  rise: number;
  helixY: number;
  helixW: number;
  // The front (screen units)
  cardW: number;
  /** Row: the four places, left to right. Column: unused */
  slotX: number[];
  rowSlope: number;
  rowY: number;
  /** Column: centre line, pitch between cards, and the sideways swing */
  colY: number;
  pitch: number;
  swing: number;
  /** The caption's width over the card's (column captions sit beside it) */
  labelRatio: number;
  half: number;
}

/**
 * `topClear`: how much of the top is taken by the navbar and the HUD's top
 * row, as a share of the height.
 */
function layoutFor(aspect: number, topClear: number): Layout {
  const visW = VIEW_H * aspect;
  const half = visW / 2;

  if (aspect >= 1.15) {
    // A row of four, two either side of the logo, on a gentle slant
    const logoH = LOGO_H_WIDE;
    const inner = logoH * LOGO_HALF_W + 0.36;
    const gap = 0.32;
    const cardW = Math.min(3.2, Math.max(1.5, (half - 0.5 - inner - gap) / 2));
    const x1 = inner + cardW / 2;
    const x2 = x1 + cardW + gap;
    const radius = Math.min(4.1, visW * 0.26);
    const step = (Math.PI * 2) / 12;
    const helixW = radius * step * 0.98;
    const rowY = 0.28;
    return {
      mode: "row",
      logoH,
      logoY: 0,
      radius,
      step,
      rise: (helixW / CARD_ASPECT) * 0.44,
      helixY: rowY,
      helixW,
      cardW,
      slotX: [-x2, -x1, x1, x2],
      rowSlope: 0.09,
      rowY,
      colY: 0,
      pitch: 0,
      swing: 0,
      labelRatio: 1,
      half,
    };
  }

  // A column of four under the logo, swinging left and right like the strand
  // it came from, each caption beside its card
  const top = VIEW_H / 2 - topClear * VIEW_H;
  const logoH = Math.min(1.5, Math.max(1, visW * 0.26));
  const logoY = top - 0.1 - logoH / 2;
  const colTop = logoY - logoH / 2 - 0.4;
  const colBottom = -VIEW_H / 2 + 0.4;
  const pitchGap = 0.24;
  const labelGap = 0.16;
  const labelW = 1.9;
  let cardH = (colTop - colBottom - 3 * pitchGap) / 4;
  let cardW = cardH * CARD_ASPECT;
  const maxW = visW - 0.5 - labelGap - labelW;
  if (cardW > maxW) {
    cardW = maxW;
    cardH = cardW / CARD_ASPECT;
  }
  const pitch = cardH + pitchGap;
  const colY = (colTop + colBottom) / 2;
  const radius = Math.min(2.6, visW * 0.42);
  const step = (Math.PI * 2) / 9;
  return {
    mode: "column",
    logoH,
    logoY,
    radius,
    step,
    rise: pitch,
    helixY: colY,
    helixW: radius * step * 0.98,
    cardW,
    slotX: [],
    rowSlope: 0,
    rowY: 0,
    colY,
    pitch,
    swing: (cardW + labelGap + labelW) / 2 - cardW / 2,
    labelRatio: labelW / cardW,
    half,
  };
}

/** A card's pose: position, turn, width (world units) */
interface Pose {
  x: number;
  y: number;
  z: number;
  rotY: number;
  w: number;
}

const cardVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cardFragment = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform float uImgAspect;
  uniform float uCardAspect;
  uniform float uDim;
  uniform float uOpacity;
  uniform vec3 uInk;
  uniform vec3 uBase;

  float sdRound(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 uv = vUv;
    // Seen from behind, flip so the picture never reads mirrored
    if (!gl_FrontFacing) uv.x = 1.0 - uv.x;

    vec2 p = (vUv - 0.5) * vec2(uCardAspect, 1.0);
    float d = sdRound(p, vec2(uCardAspect * 0.5, 0.5), 0.06);
    float aa = fwidth(d);
    float mask = 1.0 - smoothstep(-aa, aa, d);

    // Cover the card, holding the top of the screenshot (the hero of the site)
    vec2 t = uv;
    float r = uCardAspect / uImgAspect;
    if (r < 1.0) t.x = 0.5 + (uv.x - 0.5) * r;
    else t.y = 1.0 - (1.0 - uv.y) / r;

    vec3 col = uHasMap > 0.5 ? texture2D(uMap, t).rgb : uBase;
    float back = gl_FrontFacing ? 0.0 : 0.18;
    col = mix(col, uInk, clamp(uDim + back, 0.0, 0.92));

    // A hairline of light round the edge, fading with the card
    float rim = smoothstep(-aa * 2.2, -aa * 0.2, d) * (1.0 - smoothstep(-aa * 0.2, aa, d));
    col = mix(col, vec3(0.91, 0.965, 1.0), rim * 0.28 * (1.0 - uDim));

    gl_FragColor = vec4(col, mask * uOpacity);
    #include <colorspace_fragment>
  }
`;

interface Card {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  project: number;
  seed: number;
}

export class ProjectHelix {
  /** Shared with the scroll timeline, which tweens it */
  readonly state: HelixState;

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 600);
  private world = new THREE.Group();
  private logo = new THREE.Group();
  private cursor: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  private cards: Card[] = [];
  private dust: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private streaks!: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  private layout = layoutFor(16 / 9, 0.1);
  /** Per card: how far it has stepped into the front (0 on the helix, 1 in front) */
  private front = new Float32Array(CARD_COUNT);
  /** Per card: the hover lift, eased */
  private lift = new Float32Array(CARD_COUNT);
  private hovered = -1;
  private pose: Pose = { x: 0, y: 0, z: 0, rotY: 0, w: 1 };
  private helixPose: Pose = { x: 0, y: 0, z: 0, rotY: 0, w: 1 };
  private disposables: { dispose: () => void }[] = [];
  private pointer = new THREE.Vector2();
  private look = new THREE.Vector2();
  private width = 1;
  private height = 1;
  /** Idle clock: the logo's turn and the dust's travel, integrated per frame */
  private idle = 0;
  private idleBase = 0;
  private dustPhase = 0;
  private lastTime = -1;
  private dustUniform = { value: 0 };
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private corner = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement, covers: string[], state: HelixState) {
    this.state = state;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.85;
    this.disposables.push(env);

    // Key from the top left, a sky rim from behind, a navy bounce from below
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(-6, 8, 10);
    const rim = new THREE.DirectionalLight(0x3ba7f2, 2.2);
    rim.position.set(6, 2, -8);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xe8f6ff, 0x0b3d91, 0.8));

    this.scene.add(this.world);
    this.world.add(this.logo);
    this.cursor = this.buildLogo();
    this.buildCards(covers);
    this.dust = this.buildDust();
    this.scene.add(this.dust);
  }

  /** The mark from Logo.tsx, extruded: caret legs in ice, cursor in mint */
  private buildLogo() {
    // LOGO_LEGS in Logo.tsx: M6 42 24 5 42 42H34.5L24 20.4 13.5 42Z (y down)
    const pts: [number, number][] = [[6, 42], [24, 5], [42, 42], [34.5, 42], [24, 20.4], [13.5, 42]];
    const legs = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x - 24, 23.5 - y)));
    const c = LOGO_CURSOR;
    const cx = c.x - 24;
    const cy = 23.5 - c.y - c.height;
    const bar = new THREE.Shape();
    bar.moveTo(cx, cy);
    bar.lineTo(cx + c.width, cy);
    bar.lineTo(cx + c.width, cy + c.height);
    bar.lineTo(cx, cy + c.height);
    bar.closePath();

    const extrude = { depth: 6, bevelEnabled: true, bevelThickness: 1.1, bevelSize: 0.75, bevelSegments: 6, curveSegments: 1 };
    const legsGeo = new THREE.ExtrudeGeometry(legs, extrude);
    const barGeo = new THREE.ExtrudeGeometry(bar, { ...extrude, bevelSize: 0.6 });
    legsGeo.translate(0, 0, -3);
    barGeo.translate(0, 0, -3);

    const ice = new THREE.MeshPhysicalMaterial({
      color: 0xd2e8ff,
      metalness: 0.82,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
    });
    const mint = new THREE.MeshPhysicalMaterial({
      color: 0x7fe7d6,
      emissive: 0x7fe7d6,
      emissiveIntensity: 0.28,
      metalness: 0.2,
      roughness: 0.32,
      clearcoat: 1,
      transparent: true,
    });
    this.logo.add(new THREE.Mesh(legsGeo, ice));
    const cursor = new THREE.Mesh(barGeo, mint);
    this.logo.add(cursor);
    this.disposables.push(legsGeo, barGeo, ice, mint);
    return cursor;
  }

  private buildCards(covers: string[]) {
    if (!covers.length) return;
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.disposables.push(geometry);
    const loader = new THREE.TextureLoader();
    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    const materials = covers.map((src) => {
      const material = new THREE.ShaderMaterial({
        vertexShader: cardVertex,
        fragmentShader: cardFragment,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uMap: { value: null },
          uHasMap: { value: 0 },
          uImgAspect: { value: 2 },
          uCardAspect: { value: CARD_ASPECT },
          uDim: { value: 0 },
          uOpacity: { value: 1 },
          uInk: { value: INK },
          uBase: { value: NAVY },
        },
      });
      loader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        const img = tex.image as { width: number; height: number };
        material.uniforms.uMap.value = tex;
        material.uniforms.uHasMap.value = 1;
        material.uniforms.uImgAspect.value = img.width / img.height;
        this.disposables.push(tex);
      });
      this.disposables.push(material);
      return material;
    });

    for (let i = 0; i < CARD_COUNT; i++) {
      const project = i % covers.length;
      // Each card needs its own dim and opacity, so it gets its own material
      // sharing the project's texture uniforms
      const material = materials[project].clone();
      material.uniforms = {
        ...THREE.UniformsUtils.clone(materials[project].uniforms),
        uMap: materials[project].uniforms.uMap,
        uHasMap: materials[project].uniforms.uHasMap,
        uImgAspect: materials[project].uniforms.uImgAspect,
      };
      this.disposables.push(material);
      const mesh = new THREE.Mesh(geometry, material);
      this.world.add(mesh);
      this.cards.push({ mesh, project, seed: Math.sin(i * 91.7) * 0.5 + 0.5 });
    }
  }

  /**
   * The stream the camera dives along: fine motes, plus thin streaks of light
   * that sell the speed while idling and diving and fade once it has landed.
   * Both wrap round the same span on the same phase, so they loop together.
   */
  private buildDust() {
    // Seeded, so the recorded loop and the live scene place every mote alike
    let seed = 1337;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    // A tunnel round the line of the dive, densest near its middle
    const place = (out: Float32Array, i: number, inner: number, outer: number) => {
      const a = rand() * Math.PI * 2;
      const r = inner + Math.pow(rand(), 1.6) * (outer - inner);
      out[i] = Math.cos(a) * r;
      out[i + 1] = Math.sin(a) * r * 0.72;
      out[i + 2] = DUST_FAR + rand() * DUST_SPAN;
    };
    const wrap = (z: string) =>
      `mod(${z} - ${DUST_FAR.toFixed(1)} + uDustPhase, ${DUST_SPAN.toFixed(1)}) + ${DUST_FAR.toFixed(1)}`;
    const phase = this.dustUniform;

    // Streaks: a head and a tail per streak; the tail trails behind the head
    // and wraps with it (aTrail holds how far behind), so none ever tears
    const streakCount = 260;
    const sPos = new Float32Array(streakCount * 6);
    const sTrail = new Float32Array(streakCount * 2);
    const sColor = new Float32Array(streakCount * 8);
    const head = new Float32Array(3);
    for (let i = 0; i < streakCount; i++) {
      place(head, 0, 1.4, 12);
      sPos.set(head, i * 6);
      sPos.set(head, i * 6 + 3);
      sTrail[i * 2 + 1] = 4 + rand() * 9;
      sColor.set([0.82, 0.93, 1, 0.9, 0.82, 0.93, 1, 0], i * 8);
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute("aTrail", new THREE.BufferAttribute(sTrail, 1));
    sGeo.setAttribute("color", new THREE.BufferAttribute(sColor, 4));
    const sMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false });
    sMat.onBeforeCompile = (shader) => {
      shader.uniforms.uDustPhase = phase;
      shader.vertexShader = shader.vertexShader
        .replace("void main() {", "uniform float uDustPhase;\nattribute float aTrail;\nvoid main() {")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          transformed.z = ${wrap("transformed.z")} - aTrail;`,
        );
    };
    this.streaks = new THREE.LineSegments(sGeo, sMat);
    this.streaks.frustumCulled = false;
    this.scene.add(this.streaks);
    this.disposables.push(sGeo, sMat);

    const count = 1100;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) place(pos, i * 3, 1.2, 15);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    const dot = document.createElement("canvas");
    dot.width = dot.height = 32;
    const ctx = dot.getContext("2d")!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    const map = new THREE.CanvasTexture(dot);

    const material = new THREE.PointsMaterial({
      size: 0.09,
      map,
      color: 0xc6e6ff,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      sizeAttenuation: true,
    });
    // Stream the motes towards the camera, wrapping round the span
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uDustPhase = phase;
      shader.vertexShader = shader.vertexShader
        .replace("void main() {", "uniform float uDustPhase;\nvoid main() {")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          transformed.z = ${wrap("transformed.z")};`,
        );
    };
    this.disposables.push(geometry, material, map);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return points;
  }

  /** `topClear`: px at the top taken by the navbar and the HUD's top row */
  resize(width: number, height: number, topClear = 0) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.layout = layoutFor(this.camera.aspect, topClear / this.height);
  }

  /** "row" or "column", and the caption's width over its card's */
  get frontLayout() {
    return { mode: this.layout.mode, labelRatio: this.layout.labelRatio };
  }

  /** Lift a card as the pointer rests on it (-1 for none) */
  setHover(card: number) {
    this.hovered = card;
  }

  /** Pointer in -1..1, for a slight parallax of the camera */
  setPointer(x: number, y: number) {
    this.pointer.set(x, y);
  }

  /** Sets the idle loop to `seconds` into it (the video's current time) */
  syncLoop(seconds: number) {
    this.idle = seconds * TURN_SPEED;
    this.dustPhase = seconds * DUST_SPEED;
    this.lastTime = -1;
  }

  /** Card `i`'s place on the strand relative to the middle of the front */
  private slotDistance(i: number) {
    let t = (((i - this.state.offset) % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
    if (t >= CARD_COUNT / 2) t -= CARD_COUNT;
    return t;
  }

  /** How far a card at `t` has stepped out of the helix into the front */
  private frontWeight(t: number) {
    return 1 - smooth01(Math.abs(t) - 1.5);
  }

  /** The card at `t` on the helix */
  private onHelix(t: number, out: Pose) {
    const L = this.layout;
    const theta = t * L.step;
    out.x = Math.sin(theta) * L.radius;
    out.y = L.helixY - t * L.rise;
    out.z = Math.cos(theta) * L.radius;
    out.rotY = theta;
    out.w = L.helixW;
    return out;
  }

  /**
   * The card at `t` in the front. The four places are t = -1.5, -0.5, 0.5
   * and 1.5 (left to right, or top to bottom); in between, the cards glide
   * from one place to the next, and past the ends they carry on outwards.
   */
  private inFront(t: number, out: Pose) {
    const L = this.layout;
    let X: number;
    let Y: number;
    if (L.mode === "row") {
      const k = Math.min(2, Math.max(0, Math.floor(t + 1.5)));
      const f = t + 1.5 - k;
      X = L.slotX[k] + (L.slotX[k + 1] - L.slotX[k]) * f;
      Y = L.rowY - X * L.rowSlope;
      // Each card turns a touch towards the middle
      out.rotY = (-X / L.half) * 0.16;
    } else {
      // Down the column, swinging side to side like the helix seen head-on
      X = -L.swing * Math.cos(Math.PI * (t + 1.5));
      Y = L.colY - t * L.pitch;
      out.rotY = (-X / L.half) * 0.1;
    }
    out.x = X / FRONT_S;
    out.y = Y / FRONT_S;
    out.z = FRONT_Z;
    out.w = L.cardW / FRONT_S;
    return out;
  }

  render(time: number) {
    const L = this.layout;
    const S = this.state;
    const offset = S.offset;

    // The dive: the camera falls from far out to its resting distance
    const d = S.dolly;
    const e = 1 - Math.pow(1 - d, 3);
    const idleWeight = 1 - e;
    const dt = this.lastTime < 0 ? 0 : Math.min(0.1, Math.max(0, time - this.lastTime));
    this.lastTime = time;
    this.idle += dt * TURN_SPEED * idleWeight;
    this.dustPhase += dt * DUST_SPEED * (1 - 0.85 * e);
    this.dustUniform.value = this.dustPhase % DUST_SPAN;

    this.look.lerp(this.pointer, 0.05);
    // Before the dive every screen shows the same centred speck (the recorded
    // video); narrow screens lift the logo and size it as the camera lands
    this.logo.scale.setScalar((LOGO_H_WIDE + (L.logoH - LOGO_H_WIDE) * e) / 38.2);

    // Logo: the idle turn, its own spin, one half-turn per project, a breath.
    // It rests at a slight three-quarter turn so it always reads as solid.
    // The idle turn is taken as its nearest angle when the dive starts and
    // unwinds as the camera falls, so the logo always settles in the same pose.
    if (e < 1e-4) this.idleBase = this.idle - wrapPi(this.idle);
    const idleTurn = (this.idle - this.idleBase) * idleWeight;
    const breath = Math.sin(this.idle) * idleWeight + Math.sin(time * 0.9) * e;
    this.logo.rotation.y =
      S.spin + idleTurn + (offset - REST_PHASE) * Math.PI - 0.38 + this.look.x * 0.25 * d;
    this.logo.rotation.x = Math.sin(time * 0.6) * 0.05 * e;
    this.logo.position.y = L.logoY * e + breath * 0.06;

    // Camera: the dive in, with a slight parallax on the pointer
    const restZ = CAM_Z + (CAM_FAR - CAM_Z) * (1 - e);
    this.camera.position.set(this.look.x * 0.35 * d, this.look.y * 0.25 * d, restZ);
    this.camera.lookAt(0, 0, 0);
    // The crossbar is a text cursor, so it blinks like one once settled
    const blink = 0.5 + 0.5 * Math.cos(time * Math.PI * 1.9);
    this.cursor.material.opacity = 1 - S.cards * 0.55 * Math.pow(blink, 3);

    // Cards: on the helix, or stepping out into the front
    const half = CARD_COUNT / 2;
    const logoHalfW = L.logoH * LOGO_HALF_W;
    const logoHalfH = L.logoH * 0.5;
    const logoY = L.logoY * e;
    const ease = 1 - Math.exp(-dt * 14);
    for (let i = 0; i < this.cards.length; i++) {
      const { mesh, seed } = this.cards[i];
      const t = this.slotDistance(i);

      const w = this.frontWeight(t);
      this.front[i] = w;
      const h = this.onHelix(t, this.helixPose);
      const pose = w > 0 ? this.inFront(t, this.pose) : h;
      if (w > 0) {
        pose.x = h.x + (pose.x - h.x) * w;
        pose.y = h.y + (pose.y - h.y) * w;
        pose.z = h.z + (pose.z - h.z) * w;
        pose.rotY = h.rotY + (pose.rotY - h.rotY) * w;
        pose.w = h.w + (pose.w - h.w) * w;
      }
      this.lift[i] += ((i === this.hovered && w > 0.5 ? 1 : 0) - this.lift[i]) * ease;
      const lift = this.lift[i];

      let x = pose.x;
      let y = pose.y;
      let z = pose.z + lift * 0.35;
      let rotY = pose.rotY;
      let opacity = 1;

      // Intro: each card rushes in from behind the camera, nearest first
      const order = Math.abs(t) / half;
      const p = Math.min(1, Math.max(0, (S.cards - order * 0.5) / 0.5));
      if (p < 1) {
        const k = 1 - Math.pow(1 - p, 3);
        const sx = x * (1.9 + seed * 0.6);
        const sy = y * 1.5 + (seed - 0.5) * 3;
        const sz = z + 17 + seed * 8;
        x = sx + (x - sx) * k;
        y = sy + (y - sy) * k;
        z = sz + (z - sz) * k;
        rotY += (1 - k) * (seed - 0.5) * 2.4;
        opacity = Math.min(1, p * 2.5);
      }

      mesh.position.set(x, y, z);
      mesh.rotation.set(0, rotY, 0);
      const cw = pose.w * (1 + lift * 0.045);
      mesh.scale.set(cw, cw / CARD_ASPECT, 1);

      // Depth: the far side of the helix sinks into the ink; the front is in
      // full colour
      const depth = (1 - Math.cos(t * L.step)) / 2;
      let dim = (0.4 + 0.5 * depth) * (1 - w);

      // A card crossing in front of the logo turns to glass, so the logo stays
      // in view (the front places themselves never cover it)
      if (z > 0.4) {
        const s = CAM_Z / Math.max(0.5, CAM_Z - z);
        const hw = (cw / 2) * Math.abs(Math.cos(rotY)) * s;
        const hh = (cw / CARD_ASPECT / 2) * s;
        const ix = Math.max(0, Math.min(x * s + hw, logoHalfW) - Math.max(x * s - hw, -logoHalfW));
        const iy = Math.max(
          0,
          Math.min(y * s + hh, logoY + logoHalfH) - Math.max(y * s - hh, logoY - logoHalfH),
        );
        const overlap = (ix * iy) / Math.max(0.01, 4 * hw * hh);
        const g = smooth01((overlap - 0.02) / 0.22);
        opacity *= 1 - g * 0.72;
        dim = Math.max(dim, g * 0.3);
      }

      const u = mesh.material.uniforms;
      u.uDim.value = dim;
      u.uOpacity.value = opacity;
      mesh.visible = S.cards > 0.001 && opacity > 0.01;
    }

    // Streaks only while moving fast: idling and diving
    const speed = 1 - e;
    this.streaks.material.opacity = 0.5 * speed;
    this.streaks.visible = speed > 0.01;
    this.dust.material.opacity = 0.7 * (0.4 + 0.6 * (1 - S.cards * 0.5));
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * The card under a point on the canvas (CSS px from its top left), and
   * whether it is one of the four in front (the ones that open). Only once
   * the cards have settled.
   */
  pick(x: number, y: number): { card: number; project: number; front: boolean } | null {
    if (this.state.cards < 0.99) return null;
    this.ndc.set((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const meshes = this.cards.filter((c) => c.mesh.visible).map((c) => c.mesh);
    const hit = this.raycaster.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    const i = this.cards.findIndex((c) => c.mesh === hit.object);
    return { card: i, project: this.cards[i].project, front: this.front[i] > 0.5 };
  }

  /**
   * For each project, the copy of its card furthest into the front and how
   * far in it is (0 when none is), so the page can caption the four in front.
   */
  frontCards(out: { card: number; weight: number }[]) {
    for (const slot of out) {
      slot.card = -1;
      slot.weight = 0;
    }
    if (this.state.cards < 0.99) return out;
    for (let i = 0; i < this.cards.length; i++) {
      const slot = out[this.cards[i].project];
      if (slot && this.front[i] > slot.weight) {
        slot.card = i;
        slot.weight = this.front[i];
      }
    }
    return out;
  }

  /**
   * A card as a box on the canvas (CSS px), with its corner radius, so the
   * page can caption it or grow its image from exactly there.
   */
  cardRect(i: number): { project: number; left: number; top: number; width: number; height: number; radius: number } | null {
    const card = this.cards[i];
    if (!card) return null;
    const mesh = card.mesh;
    mesh.updateMatrixWorld();
    this.camera.updateMatrixWorld();
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [cx, cy] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) {
      this.corner.set(cx, cy, 0);
      mesh.localToWorld(this.corner).project(this.camera);
      const px = ((this.corner.x + 1) / 2) * this.width;
      const py = ((1 - this.corner.y) / 2) * this.height;
      x0 = Math.min(x0, px);
      x1 = Math.max(x1, px);
      y0 = Math.min(y0, py);
      y1 = Math.max(y1, py);
    }
    const height = y1 - y0;
    // The card shader rounds its corners by 6% of the card's height
    return { project: card.project, left: x0, top: y0, width: x1 - x0, height, radius: height * 0.06 };
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }
}
