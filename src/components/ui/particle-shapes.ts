/**
 * Symbol drawings for the services particle field.
 *
 * Every drawer builds its paths inside a square box of side `s` using normalised
 * 0–1 coordinates, then strokes (or fills) with whatever style the caller set.
 * The sampler strokes it thick and white to harvest particle positions; the
 * static fallback (only shown without WebGL) strokes it thin and tinted.
 */

export type ShapeDrawer = (ctx: CanvasRenderingContext2D, s: number) => void;

type Pt = readonly [number, number];

function polyline(ctx: CanvasRenderingContext2D, s: number, pts: readonly Pt[], close = false) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s)));
  if (close) ctx.closePath();
  ctx.stroke();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  s: number,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const [X, Y, W, H, R] = [x * s, y * s, w * s, h * s, r * s];
  ctx.beginPath();
  ctx.moveTo(X + R, Y);
  ctx.arcTo(X + W, Y, X + W, Y + H, R);
  ctx.arcTo(X + W, Y + H, X, Y + H, R);
  ctx.arcTo(X, Y + H, X, Y, R);
  ctx.arcTo(X, Y, X + W, Y, R);
  ctx.closePath();
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, s: number, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2);
  ctx.fill();
}

/** `</>` — built from strokes, not a font glyph, so it looks identical on every OS. */
export const drawCode: ShapeDrawer = (ctx, s) => {
  polyline(ctx, s, [[0.3, 0.3], [0.12, 0.5], [0.3, 0.7]]);
  polyline(ctx, s, [[0.58, 0.24], [0.42, 0.76]]);
  polyline(ctx, s, [[0.7, 0.3], [0.88, 0.5], [0.7, 0.7]]);
};

/** Fountain-pen nib: body, collar, slit and breather hole. */
export const drawNib: ShapeDrawer = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0.5 * s, 0.9 * s);
  ctx.quadraticCurveTo(0.26 * s, 0.66 * s, 0.28 * s, 0.46 * s);
  ctx.lineTo(0.38 * s, 0.3 * s);
  ctx.lineTo(0.38 * s, 0.12 * s);
  ctx.lineTo(0.62 * s, 0.12 * s);
  ctx.lineTo(0.62 * s, 0.3 * s);
  ctx.lineTo(0.72 * s, 0.46 * s);
  ctx.quadraticCurveTo(0.74 * s, 0.66 * s, 0.5 * s, 0.9 * s);
  ctx.closePath();
  ctx.stroke();
  polyline(ctx, s, [[0.38, 0.3], [0.62, 0.3]]);
  polyline(ctx, s, [[0.5, 0.9], [0.5, 0.53]]);
  ctx.beginPath();
  ctx.arc(0.5 * s, 0.47 * s, 0.055 * s, 0, Math.PI * 2);
  ctx.stroke();
};

/** An ease-in-out timing curve over a baseline, keyframes dotted at each end. */
export const drawCurve: ShapeDrawer = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0.12 * s, 0.78 * s);
  ctx.bezierCurveTo(0.58 * s, 0.78 * s, 0.42 * s, 0.22 * s, 0.88 * s, 0.22 * s);
  ctx.stroke();
  polyline(ctx, s, [[0.12, 0.88], [0.88, 0.88]]);
  polyline(ctx, s, [[0.12, 0.12], [0.12, 0.88]]);
  dot(ctx, s, 0.12, 0.78, 0.045);
  dot(ctx, s, 0.88, 0.22, 0.045);
};

/** Oblique wireframe cube, all twelve edges. */
export const drawCube: ShapeDrawer = (ctx, s) => {
  const front: Pt[] = [[0.16, 0.36], [0.62, 0.36], [0.62, 0.82], [0.16, 0.82]];
  const back: Pt[] = front.map(([x, y]) => [x + 0.22, y - 0.18] as const);
  polyline(ctx, s, front, true);
  polyline(ctx, s, back, true);
  front.forEach((p, i) => polyline(ctx, s, [p, back[i]]));
};

/** Lightning bolt, outlined to match the other line-art symbols. */
export const drawBolt: ShapeDrawer = (ctx, s) => {
  polyline(
    ctx,
    s,
    [[0.58, 0.08], [0.24, 0.54], [0.47, 0.54], [0.4, 0.92], [0.78, 0.42], [0.55, 0.42], [0.66, 0.08]],
    true
  );
};

/** Phone with speaker slot, a few lines of app content and a home indicator. */
export const drawPhone: ShapeDrawer = (ctx, s) => {
  roundRect(ctx, s, 0.3, 0.07, 0.4, 0.86, 0.075);
  polyline(ctx, s, [[0.45, 0.15], [0.55, 0.15]]);
  polyline(ctx, s, [[0.39, 0.34], [0.61, 0.34]]);
  polyline(ctx, s, [[0.39, 0.45], [0.55, 0.45]]);
  polyline(ctx, s, [[0.39, 0.56], [0.58, 0.56]]);
  polyline(ctx, s, [[0.44, 0.84], [0.56, 0.84]]);
};

const SAMPLE_SIZE = 256;

/**
 * Rasterises a drawer once and returns `count` points on it as xyz triplets in
 * [-1, 1], y up. Runs a single time per symbol at start-up, never per frame.
 * A larger `size` gives more distinct positions, so big pools stack less.
 */
export function sampleShape(draw: ShapeDrawer, count: number, size = SAMPLE_SIZE): Float32Array {
  const s = size;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const out = new Float32Array(count * 3);
  if (!ctx) return out;

  ctx.strokeStyle = ctx.fillStyle = "#fff";
  ctx.lineWidth = s * 0.055;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  draw(ctx, s);

  const { data } = ctx.getImageData(0, 0, s, s);
  const hits: number[] = [];
  for (let i = 3; i < data.length; i += 4) if (data[i] > 128) hits.push((i - 3) / 4);
  if (!hits.length) return out;

  // Fisher–Yates, so a count smaller than the hit set still covers the whole shape.
  for (let i = hits.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [hits[i], hits[j]] = [hits[j], hits[i]];
  }

  const px = 2 / s;
  for (let i = 0; i < count; i++) {
    const h = hits[i % hits.length];
    const x = h % s;
    const y = (h / s) | 0;
    out[i * 3] = (x / s) * 2 - 1 + (Math.random() - 0.5) * px;
    out[i * 3 + 1] = -((y / s) * 2 - 1) + (Math.random() - 0.5) * px;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
  }
  return out;
}

/**
 * Paints a symbol's outline into a canvas, sized to the box the particle field
 * would fill. Used as the fallback when WebGL is unavailable.
 */
export function paintGlyph(
  canvas: HTMLCanvasElement,
  draw: ShapeDrawer,
  side: number,
  color: string
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(side * dpr);
  canvas.height = Math.round(side * dpr);
  canvas.style.width = `${side}px`;
  canvas.style.height = `${side}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const s = side * dpr;
  ctx.clearRect(0, 0, s, s);
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.25 * dpr, s * 0.026);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  draw(ctx, s);
}
