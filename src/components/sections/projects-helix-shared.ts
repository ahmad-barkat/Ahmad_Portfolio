/* What the Projects page shares with its 3D scene (projects-helix.ts) without
   loading it: the scene's state, and the timings the page syncs to. */

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
