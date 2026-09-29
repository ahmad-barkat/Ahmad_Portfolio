"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "./LenisProvider";
import { useOpenProject } from "./project-transition";
import { HANDOFF_DONE_EVENT } from "./page-ready";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface NextPageProps {
  href: string;
  title: string;
  /** The small line above the title, e.g. "Next page" */
  eyebrow?: string;
  /** The line under the title */
  meta?: string;
  /** A picture of where it leads */
  image?: string;
  /** `cover` fills the panel; `contain` stands the picture in it (cut-outs) */
  fit?: "cover" | "contain";
  /**
   * Leads to this project's page: the panel is drawn exactly like that
   * page's hero, and opens it with the image-to-background zoom
   */
  project?: string;
}

/** Scroll the panel stays pinned for while its ring draws, in viewports */
const HOLD = 1;
/** The ring's circumference in its own units (radius 49 of a 100 viewBox) */
const RING_LENGTH = 2 * Math.PI * 49;

/**
 * Scroll to the next page. At the end of a page, a full-screen panel of the
 * next one rises over it, with its name in a thin ring and "Keep scrolling"
 * beneath. The panel holds while scrolling on draws the ring closed; when it
 * closes, the next page takes over from the panel's own picture:
 *   - projects: the image-to-background zoom, into the identical hero
 *   - pages: the panel stays over the screen while the page changes beneath
 *     it, then fades as the new page runs its entrance
 * Clicking the panel goes straight there. With reduced motion it is a plain
 * link and never moves on by itself.
 */
export function NextPage({ href, title, eyebrow = "Next page", meta, image, fit = "cover", project }: NextPageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const goneRef = useRef(false);
  const router = useRouter();
  const lenis = useLenis();
  const openProject = useOpenProject();

  const handOff = useCallback(() => {
    const media = mediaRef.current;
    const root = rootRef.current;
    if (!media || !root) return;

    if (project) {
      const img = media.querySelector("img");
      openProject(project, {
        rect: { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight },
        radius: 0,
        src: img?.currentSrc || image,
        objectPosition: "50% 0%",
        shade: 1,
      });
      return;
    }

    // Pages: a copy of the panel's picture holds the screen through the swap
    lenis?.stop();
    const overlay = document.createElement("div");
    overlay.className = "np-handoff";
    overlay.setAttribute("aria-hidden", "true");
    overlay.dataset.fit = fit;
    const copy = media.cloneNode(true) as HTMLElement;
    copy.querySelector(".np-dim")?.remove();
    overlay.appendChild(copy);
    document.body.appendChild(overlay);
    document.documentElement.dataset.handoff = "on";

    const target = new URL(href, location.href).pathname;
    let finished = false;
    const lift = () => {
      if (finished) return;
      finished = true;
      safety.kill();
      delete document.documentElement.dataset.handoff;
      window.dispatchEvent(new Event(HANDOFF_DONE_EVENT));
      lenis?.start();
      gsap.to(overlay, { autoAlpha: 0, duration: 0.8, ease: "power2.inOut", onComplete: () => overlay.remove() });
    };
    // If the new page never arrives, don't leave the screen covered
    const safety = gsap.delayedCall(8, lift);

    router.push(href);
    // Once the new page is in place (and has painted a frame), lift the cover
    const wait = () => {
      if (finished) return;
      if (location.pathname !== target) return void requestAnimationFrame(wait);
      requestAnimationFrame(() => requestAnimationFrame(() => gsap.delayedCall(0.15, lift)));
    };
    requestAnimationFrame(wait);
  }, [fit, href, image, lenis, openProject, project, router]);

  /** Finish the ring, clear the copy, and go */
  const go = useCallback(() => {
    if (goneRef.current) return;
    goneRef.current = true;
    const root = rootRef.current;
    if (!root) return;
    const tl = tlRef.current;
    const out = gsap.timeline({ onComplete: handOff });
    if (tl) {
      tl.scrollTrigger?.disable(false);
      out.to(tl, { progress: 1, duration: 0.3, ease: "power2.out" });
    }
    // The name leaves and the picture clears to exactly how the next page opens
    out
      .to(root.querySelectorAll(".np-center, .np-hint"), { autoAlpha: 0, duration: 0.3, ease: "power2.in" }, tl ? 0.2 : 0)
      .to(root.querySelectorAll(".np-dim"), { opacity: 0, duration: 0.4, ease: "power1.inOut" }, tl ? 0.2 : 0);
  }, [handOff]);

  // The scroll triggers are made once; this keeps them calling the current `go`
  const goRef = useRef(go);
  goRef.current = go;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Rising in over the page: the picture trails behind the panel's edge,
        // and the name comes up to meet it
        gsap
          .timeline({ scrollTrigger: { trigger: root, start: "top bottom", end: "top top", scrub: true } })
          .fromTo(q(".np-media__inner"), { yPercent: -22 }, { yPercent: 0, ease: "none" }, 0)
          .fromTo(q(".np-center"), { y: () => window.innerHeight * 0.18, scale: 0.9 }, { y: 0, scale: 1, ease: "none" }, 0);

        // Held full screen: scrolling on draws the ring closed
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${window.innerHeight * HOLD}`,
            pin: q(".np-stage")[0],
            scrub: 0.4,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (self.progress > 0.995 && self.direction > 0) goRef.current();
            },
          },
        });
        tl.fromTo(q(".np-ring__arc"), { attr: { "stroke-dashoffset": RING_LENGTH } }, { attr: { "stroke-dashoffset": 0 } }, 0)
          .fromTo(q(".np-ring__head"), { rotation: 0 }, { rotation: 360, svgOrigin: "50 50" }, 0)
          .fromTo(q(".np-ring__head"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0)
          .fromTo(q(".np-media__inner"), { scale: 1.08 }, { scale: 1 }, 0)
          .fromTo(q(".np-hint span"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25 }, 0.1);
        tlRef.current = tl;
        return () => {
          tlRef.current = null;
        };
      });
    },
    { scope: rootRef },
  );

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go();
  };

  return (
    <section ref={rootRef} className="np" aria-label={`${eyebrow}: ${title}`} data-project={project ? "" : undefined}>
      <div className="np-stage">
        <a className="np-panel" href={href} onClick={onClick}>
          <div ref={mediaRef} className="np-media" data-fit={fit}>
            <div className="np-media__inner">
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                // Eager: a fast scroll to the end must find it loaded (and it is
                // the next page's hero, so the hand-off finds it cached)
                <img className={project ? "pd-bg__img" : "np-img"} src={image} alt="" loading="eager" decoding="async" />
              )}
            </div>
            {project && <div className="pd-shade" />}
            <div className="np-dim" />
          </div>

          <div className="np-center">
            <svg className="np-ring" viewBox="0 0 100 100" aria-hidden="true">
              <circle className="np-ring__track" cx="50" cy="50" r="49" />
              {/* Starts at the top (rotated in SVG, not CSS) and draws clockwise.
                  The dash is its real length, not pathLength, which Chrome
                  doesn't always apply to the dash (the arc ran ahead of the dot) */}
              <circle
                className="np-ring__arc"
                cx="50"
                cy="50"
                r="49"
                transform="rotate(-90 50 50)"
                strokeDasharray={RING_LENGTH}
                strokeDashoffset={RING_LENGTH}
              />
              <g className="np-ring__head">
                <circle cx="50" cy="1" r="0.9" />
              </g>
            </svg>
            <p className="np-eyebrow">{eyebrow}</p>
            <h2 className="np-title">{title}</h2>
            {meta && <p className="np-meta">{meta}</p>}
          </div>

          <p className="np-hint" aria-hidden="true">
            <span>Keep scrolling</span>
            <i />
          </p>
        </a>
      </div>
    </section>
  );
}

export default NextPage;
