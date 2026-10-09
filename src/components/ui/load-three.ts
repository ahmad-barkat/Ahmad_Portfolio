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
