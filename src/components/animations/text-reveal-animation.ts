import { gsap } from "gsap";

/**
 * ============================================================================
 * WILLEM TEXT REVEAL ANIMATION (Extracted & Preserved)
 * ============================================================================
 * 
 * This file contains the exact GSAP text reveal animation extracted from the
 * Willem header sequence. It can be applied to any text element, heading, or
 * nav link collection.
 * 
 * HOW IT WORKS:
 * 1. Letter Reveal (Staggered Characters):
 *    - Wrap each letter in a <span style="display: block; position: relative;">
 *    - Parent container must have `overflow: hidden; display: flex;`
 *    - Animates from yPercent: 100 to 0 with `expo.out` ease and 0.025s stagger.
 * 
 * 2. Word / Nav Link Reveal (Staggered Elements):
 *    - Wrap each link / word in a container with `overflow: hidden`
 *    - Animates from yPercent: 100 to 0 with `expo.out` ease and 0.1s stagger.
 */

export interface LetterRevealOptions {
  duration?: number;
  stagger?: number;
  ease?: string;
  delay?: number | string;
  yPercent?: number;
}

export interface NavLinkRevealOptions {
  duration?: number;
  stagger?: number;
  ease?: string;
  delay?: number | string;
  yPercent?: number;
}

/**
 * Animate letters rising from bottom with the exact Willem signature ease.
 * 
 * @example
 * animateLettersReveal(document.querySelectorAll('.letter-span'), { duration: 1.25 });
 */
export function animateLettersReveal(
  elements: gsap.TweenTarget,
  options: LetterRevealOptions = {}
): gsap.core.Tween {
  const {
    duration = 1.25,
    stagger = 0.025,
    ease = "expo.out",
    delay = 0,
    yPercent = 100,
  } = options;

  return gsap.from(elements, {
    yPercent,
    duration,
    ease,
    stagger,
    delay,
  });
}

/**
 * Animate nav links / words rising from bottom.
 * 
 * @example
 * animateNavLinksReveal(document.querySelectorAll('.nav-link'), { duration: 1.25 });
 */
export function animateNavLinksReveal(
  elements: gsap.TweenTarget,
  options: NavLinkRevealOptions = {}
): gsap.core.Tween {
  const {
    duration = 1.25,
    stagger = 0.1,
    ease = "expo.out",
    delay = 0,
    yPercent = 100,
  } = options;

  return gsap.from(elements, {
    yPercent,
    duration,
    ease,
    stagger,
    delay,
  });
}

/**
 * Helper to add the exact letter reveal to an existing GSAP timeline.
 */
export function addLetterRevealToTimeline(
  tl: gsap.core.Timeline,
  elements: gsap.TweenTarget,
  position: gsap.Position = "< 1.2",
  options: LetterRevealOptions = {}
): gsap.core.Timeline {
  const {
    duration = 1.25,
    stagger = 0.025,
    ease = "expo.out",
    yPercent = 100,
  } = options;

  return tl.from(
    elements,
    {
      yPercent,
      duration,
      ease,
      stagger,
    },
    position
  );
}

/**
 * Helper to add the exact nav links reveal to an existing GSAP timeline.
 */
export function addNavLinksRevealToTimeline(
  tl: gsap.core.Timeline,
  elements: gsap.TweenTarget,
  position: gsap.Position = "<",
  options: NavLinkRevealOptions = {}
): gsap.core.Timeline {
  const {
    duration = 1.25,
    stagger = 0.1,
    ease = "expo.out",
    yPercent = 100,
  } = options;

  return tl.from(
    elements,
    {
      yPercent,
      duration,
      ease,
      stagger,
    },
    position
  );
}
