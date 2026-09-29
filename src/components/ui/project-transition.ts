"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useLenis } from "./LenisProvider";
import { PROJECTS, projectPath } from "@/data/projects";

/**
 * Image to background: opening a project grows the image that was clicked
 * until it fills the screen, then the project page takes over with that same
 * image as its hero background.
 *
 *   1. An overlay copy of the image sits exactly over the one clicked, with
 *      its rounded corners, and grows to the full viewport as the corners
 *      square off. The page behind sinks into ink, and the hero's shade
 *      settles over the image.
 *   2. Once the ink covers the old page, the router swaps pages beneath it.
 *   3. The project page paints its hero identical to the overlay's last frame
 *      and calls `finishArrival`, which lifts the overlay; the page then runs
 *      its own entrance (the text reveals).
 */

/** Where the image starts: its visible box on screen and how it is drawn there */
export interface ZoomSource {
  rect: { left: number; top: number; width: number; height: number };
  radius?: number;
  /** The file the source shows now, so the first frame is already decoded */
  src?: string;
  objectPosition?: string;
}

interface Arrival {
  slug: string;
  root: HTMLDivElement;
  grown: Promise<void>;
  done: () => void;
}

let arrival: Arrival | null = null;

// Development only: lets the headless test harness slow GSAP down to film the zoom
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
}

/** True while a zoom into this project is on screen */
export function peekArrival(slug: string) {
  return arrival?.slug === slug;
}

/**
 * The project page calls this once its hero is painted beneath the overlay.
 * Resolves as soon as the growth has finished, so the page can start its
 * entrance while the overlay fades off the identical frame beneath it.
 */
export async function finishArrival(slug: string) {
  const a = arrival;
  if (!a || a.slug !== slug) return;
  await a.grown;
  gsap.to(a.root, { autoAlpha: 0, duration: 0.3, ease: "power1.out", onComplete: a.done });
}

/** The part of `el` actually visible: clipped by overflow-hidden ancestors */
function sourceFrom(el: HTMLElement): ZoomSource {
  const r = el.getBoundingClientRect();
  let left = r.left;
  let top = r.top;
  let right = r.right;
  let bottom = r.bottom;
  let radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  let node = el.parentElement;
  for (let i = 0; node && i < 4; i++, node = node.parentElement) {
    const cs = getComputedStyle(node);
    if (cs.overflow === "visible" && cs.clipPath === "none") continue;
    const p = node.getBoundingClientRect();
    left = Math.max(left, p.left);
    top = Math.max(top, p.top);
    right = Math.min(right, p.right);
    bottom = Math.min(bottom, p.bottom);
    radius = Math.max(radius, parseFloat(cs.borderBottomLeftRadius) || 0);
  }
  const img = el.querySelector("img");
  return {
    rect: { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) },
    radius,
    src: img?.currentSrc || undefined,
    objectPosition: img ? getComputedStyle(img).objectPosition : undefined,
  };
}

/**
 * Returns `open(slug, from)`: zooms the image `from` (an element, or a box on
 * screen for the 3D cards) into that project's page.
 */
export function useOpenProject() {
  const router = useRouter();
  const lenis = useLenis();

  return useCallback(
    (slug: string, from: HTMLElement | ZoomSource) => {
      if (arrival) return;
      const project = PROJECTS.find((p) => p.slug === slug);
      if (!project) return;
      const href = projectPath(slug);
      router.prefetch(href);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }

      const source = from instanceof HTMLElement ? sourceFrom(from) : from;
      const { rect } = source;
      lenis?.stop();

      // The overlay: a veil of ink over the page, and the image with the
      // hero's own shade (the same classes the hero uses, so they match)
      const root = document.createElement("div");
      root.className = "ptx";
      root.setAttribute("aria-hidden", "true");
      const veil = document.createElement("div");
      veil.className = "ptx-veil";
      const media = document.createElement("div");
      media.className = "ptx-media";
      const img = document.createElement("img");
      img.className = "pd-bg__img";
      img.alt = "";
      img.src = source.src || project.cover;
      const shade = document.createElement("div");
      shade.className = "pd-shade";
      media.append(img, shade);
      root.append(veil, media);
      document.body.appendChild(root);

      // Swap to the full-size file once it has loaded (the hero uses it too,
      // so it is cached by the time the page arrives)
      if (img.src !== new URL(project.cover, location.href).href) {
        const full = new Image();
        full.src = project.cover;
        full.decode().then(() => (img.src = project.cover)).catch(() => {});
      }

      const W = window.innerWidth;
      const H = window.innerHeight;
      gsap.set(media, { left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: source.radius ?? 16 });
      gsap.set(img, { objectPosition: source.objectPosition || "50% 0%" });
      gsap.set(shade, { opacity: 0 });
      gsap.set(veil, { opacity: 0 });

      let resolveGrown!: () => void;
      const grown = new Promise<void>((r) => (resolveGrown = r));
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        safety.kill();
        root.remove();
        if (arrival?.root === root) arrival = null;
        lenis?.start();
      };
      // If the page never takes over (an error, a very slow network), clear up
      const safety = gsap.delayedCall(9, done);
      arrival = { slug, root, grown, done };

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(media, { width: "100%", height: "100%" });
          resolveGrown();
        },
      });
      tl.to(veil, { opacity: 1, duration: 0.55, ease: "power2.inOut" }, 0)
        .to(
          media,
          { left: 0, top: 0, width: W, height: H, borderRadius: 0, duration: 1.1, ease: "power3.inOut" },
          0,
        )
        .to(img, { objectPosition: "50% 0%", duration: 1.1, ease: "power3.inOut" }, 0)
        .to(shade, { opacity: 1, duration: 0.7, ease: "power1.inOut" }, 0.45)
        // The veil hides the old page by now, so the swap can't be seen
        .add(() => router.push(href), 0.6);
    },
    [router, lenis],
  );
}
