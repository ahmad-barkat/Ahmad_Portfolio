import type * as Three from "three";
import type { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * three.js is the heaviest library on the site, and nothing needs it until a
 * scene wakes up (see use-activate.ts). Loading it here keeps it out of the
 * first download; every scene shares the one request.
 */
let three: Promise<typeof Three> | null = null;
export const loadThree = () => (three ??= import("three"));

let room: Promise<typeof RoomEnvironment> | null = null;
export const loadRoomEnvironment = () =>
  (room ??= import("three/examples/jsm/environments/RoomEnvironment.js").then((m) => m.RoomEnvironment));

/**
 * A new renderer's settings for the site. three.js asks the GPU for each
 * shader's error log by default, which makes the page wait, frozen, until
 * that shader has compiled (over a second for the Tech Stack's footballs on
 * a laptop's integrated graphics). The check only helps while developing.
 */
export function prepareRenderer(renderer: Three.WebGLRenderer) {
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
}

/** Render passes drawn outside the scene graph, for compileQuietly */
export interface QuietPasses {
  /** Materials swapped onto a full-screen quad, one pass each */
  materials: Three.Material[];
  /** The geometry those passes draw (a shader is compiled for its geometry) */
  geometry: Three.BufferGeometry;
  /** The render target they draw into (and for its format) */
  target?: Three.WebGLRenderTarget | null;
  /** The camera they draw with, when it is not the scene's */
  camera?: Three.Camera;
}

/**
 * Compiles a scene's shaders without freezing the page: the GPU works on
 * them in the background (KHR_parallel_shader_compile) and the promise
 * settles when they are ready, so the first frame draws at once. `passes`
 * are materials swapped in later (simulation or filter passes), compiled on
 * stand-in meshes with the geometry, target and camera they really draw
 * with: three compiles a separate shader for each of those. `sceneTarget`
 * is the target the scene itself draws into, when it is not the canvas.
 * Never rejects: on failure the first frame compiles.
 */
export function compileQuietly(
  THREE: typeof Three,
  renderer: Three.WebGLRenderer,
  scene: Three.Object3D,
  camera: Three.Camera,
  passes?: QuietPasses,
  sceneTarget: Three.WebGLRenderTarget | null = null,
): Promise<void> {
  const before = renderer.getRenderTarget();
  const jobs: Promise<unknown>[] = [];
  const start = (root: Three.Object3D, cam: Three.Camera, target: Three.WebGLRenderTarget | null) => {
    try {
      renderer.setRenderTarget(target);
      jobs.push(renderer.compileAsync(root, cam));
    } catch {
      // The first frame compiles instead
    } finally {
      renderer.setRenderTarget(before);
    }
  };
  start(scene, camera, sceneTarget);
  if (passes?.materials.length) {
    const stand = new THREE.Group();
    passes.materials.forEach((m) => stand.add(new THREE.Mesh(passes.geometry, m)));
    start(stand, passes.camera ?? camera, passes.target ?? null);
  }
  return Promise.all(jobs).then(
    () => undefined,
    () => undefined,
  );
}
