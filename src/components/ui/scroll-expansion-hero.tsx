"use client";

import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import HeadingReveal from "@/components/ui/HeadingReveal";
import { cn } from "@/lib/utils";

/**
 * Scroll-expansion media, after the 21st.dev "ScrollExpandMedia" component.
 *
 * A small media window sits over a backdrop with the title split around it.
 * As you scroll the window opens to fill the screen, the backdrop fades, and
 * the title's two halves slide apart. `dive()` then hands over to whatever
 * sits behind: the caption leaves and the media dissolves. When the media is
 * a recording of the scene behind it (as on /projects), the hand-off is
 * invisible and the scene simply carries on.
 *
 * The original hijacked the wheel and forced `scrollTo(0, 0)`, which fights
 * Lenis and breaks keyboard and scrollbar scrolling. This version has no
 * scroll handling of its own: the page's pinned, scrubbed GSAP timeline
 * drives it through the handle (`expand`, `dive`, `intro`), so it moves with
 * the same smooth scroll as the rest of the site.
 */
export interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc?: string;
  /** The first word goes left, the rest goes right */
  title?: string;
  date?: string;
  scrollToExpand?: string;
  /** Title in difference blend over the media */
  textBlend?: boolean;
  /** Shown over the media once it has filled the screen */
  children?: ReactNode;
  className?: string;
}

export interface ScrollExpandMediaHandle {
  /** Adds the expansion to `tl` at `at`, over `duration` */
  expand: (tl: gsap.core.Timeline, at: number, duration: number) => void;
  /** Adds the dive through the media to `tl` at `at`, over `duration` */
  dive: (tl: gsap.core.Timeline, at: number, duration: number) => void;
  /** The page entrance: a paused timeline for the parent to play */
  intro: () => gsap.core.Timeline;
  /** Skips straight to the end, for reduced motion */
  hide: () => void;
  /** The video element, so a scene can sync to its current time */
  video: () => HTMLVideoElement | null;
}

/** The closed window: portrait, a little larger on big screens */
function windowSize() {
  const w = Math.round(Math.min(Math.max(window.innerWidth * 0.2, 220), 320));
  return { w, h: Math.round(w * 1.3) };
}

function closedClip() {
  const { w, h } = windowSize();
  const x = Math.max(0, (window.innerWidth - w) / 2);
  const y = Math.max(0, (window.innerHeight - h) / 2);
  return `inset(${y}px ${x}px ${y}px ${x}px round 18px)`;
}

const ScrollExpandMedia = forwardRef<ScrollExpandMediaHandle, ScrollExpandMediaProps>(
  function ScrollExpandMedia(
    {
      mediaType = "video",
      mediaSrc,
      posterSrc,
      bgImageSrc,
      title = "",
      date,
      scrollToExpand,
      textBlend,
      children,
      className,
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const popRef = useRef<HTMLDivElement>(null);
    const mediaRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const shadeRef = useRef<HTMLDivElement>(null);
    const firstRef = useRef<HTMLSpanElement>(null);
    const restRef = useRef<HTMLSpanElement>(null);
    const dateRef = useRef<HTMLParagraphElement>(null);
    const hintRef = useRef<HTMLParagraphElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [firstWord, ...rest] = title.split(" ");
    const restOfTitle = rest.join(" ");

    useImperativeHandle(ref, () => ({
      expand(tl, at, duration) {
        // Far enough that each half clears its edge of the screen
        const off = (el: HTMLElement | null) => () =>
          window.innerWidth / 2 + (el?.offsetWidth ?? 0) / 2 + 48;
        const left = (el: HTMLElement | null) => () => -off(el)();
        tl.fromTo(
          mediaRef.current,
          { clipPath: closedClip },
          { clipPath: "inset(0px 0px 0px 0px round 0px)", duration, ease: "power2.inOut" },
          at,
        )
          // The picture starts cropped in and settles as the window opens
          .fromTo(innerRef.current, { scale: 1.3 }, { scale: 1, duration, ease: "power1.inOut" }, at)
          // Clears completely: at full size the media must match what is behind it
          .fromTo(shadeRef.current, { opacity: 0.3 }, { opacity: 0, duration, ease: "none" }, at)
          .fromTo(bgRef.current, { opacity: 1 }, { opacity: 0, duration: duration * 0.9, ease: "none" }, at)
          .fromTo(firstRef.current, { x: 0 }, { x: left(firstRef.current), duration, ease: "power2.in" }, at)
          .fromTo(restRef.current, { x: 0 }, { x: off(restRef.current), duration, ease: "power2.in" }, at)
          .fromTo(dateRef.current, { x: 0 }, { x: left(dateRef.current), duration, ease: "power2.in" }, at)
          .fromTo(hintRef.current, { x: 0 }, { x: off(hintRef.current), duration, ease: "power2.in" }, at);
        if (contentRef.current) {
          tl.fromTo(
            contentRef.current,
            { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, y: 0, duration: duration * 0.2, ease: "power2.out" },
            at + duration * 0.85,
          );
        }
      },
      dive(tl, at, duration) {
        if (contentRef.current) {
          tl.to(contentRef.current, { autoAlpha: 0, y: -24, duration: duration * 0.45, ease: "power2.in" }, at);
        }
        tl.to(mediaRef.current, { autoAlpha: 0, duration: duration * 0.5, ease: "none" }, at + duration * 0.5);
      },
      intro() {
        const root = rootRef.current;
        const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
        if (!root) return tl;
        tl.fromTo(bgRef.current, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power2.out" }, 0)
          .fromTo(
            popRef.current,
            { autoAlpha: 0, scale: 0.82, y: 40 },
            { autoAlpha: 1, scale: 1, y: 0, duration: 1.3 },
            0.1,
          )
          .to(root.querySelectorAll(".hr-reveal-char"), { yPercent: 0, duration: 1.2, stagger: 0.03 }, 0.35)
          .fromTo(
            [dateRef.current, hintRef.current],
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 },
            0.7,
          );
        return tl;
      },
      hide() {
        gsap.set(rootRef.current, { autoAlpha: 0 });
      },
      video() {
        return videoRef.current;
      },
    }));

    return (
      <div ref={rootRef} className={cn("sx", className)}>
        {/* Without an image the backdrop is the site's deep gradient */}
        <div ref={bgRef} className={cn("sx-bg", bgImageSrc && "sx-bg--image")} aria-hidden="true">
          {bgImageSrc && <Image src={bgImageSrc} alt="" fill priority sizes="100vw" className="sx-bg__img" />}
        </div>

        <div ref={popRef} className="sx-pop">
          <div ref={mediaRef} className="sx-media">
            <div ref={innerRef} className="sx-media__inner">
              {mediaType === "video" ? (
                <video
                  ref={videoRef}
                  className="sx-media__el"
                  src={mediaSrc}
                  poster={posterSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  disableRemotePlayback
                  aria-hidden="true"
                />
              ) : (
                <Image src={mediaSrc} alt={title} fill sizes="100vw" className="sx-media__el" />
              )}
            </div>
            <div ref={shadeRef} className="sx-media__shade" aria-hidden="true" />
          </div>
        </div>

        <div className={cn("sx-copy", textBlend && "sx-copy--blend")}>
          {date && (
            <p ref={dateRef} className="sx-date">
              {date}
            </p>
          )}
          <h1 className="sx-title">
            <span ref={firstRef} className="sx-title__part">
              <HeadingReveal as="span" manual>
                {firstWord}
              </HeadingReveal>
            </span>
            {restOfTitle && (
              <span ref={restRef} className="sx-title__part">
                <HeadingReveal as="span" manual>
                  {restOfTitle}
                </HeadingReveal>
              </span>
            )}
          </h1>
          {scrollToExpand && (
            <p ref={hintRef} className="sx-hint">
              {scrollToExpand}
            </p>
          )}
        </div>

        {children && (
          <div ref={contentRef} className="sx-content">
            {children}
          </div>
        )}
      </div>
    );
  },
);

export default ScrollExpandMedia;
export { ScrollExpandMedia };
