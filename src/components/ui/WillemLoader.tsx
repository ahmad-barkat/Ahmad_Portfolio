"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";
import "./WillemLoader.css";

/** A cover shown in the inline window. `position` and `zoom` frame the subject, since
 *  the window is a short, wide slot and a plain centred crop can miss the face. */
export interface LoaderImage {
  src: string;
  position?: string;
  zoom?: number;
  /** Colour behind a transparent cutout. Defaults to the curtain colour. */
  backdrop?: string;
}

/* The hero's own ground colour, so the cutouts sit in the window as they do on the page */
const HERO_GROUND = "#072A5E";

/* Layered covers revealed one after another — index 0 sits on top and fades first.
   Same URLs (and cache keys) as the hero and the dragon reveal, so they are reused. */
const DEFAULT_IMAGES: LoaderImage[] = [
  { src: "/hero-base-cutout.webp?v=3", position: "56% 22%", zoom: 1.55, backdrop: HERO_GROUND },
  { src: "/hero-hover-cutout.webp?v=1", position: "50% 24%", zoom: 1.45, backdrop: HERO_GROUND },
  { src: "/dragon-filled.webp?v=2", position: "50% 42%", backdrop: HERO_GROUND },
];

const toImage = (img: string | LoaderImage): LoaderImage =>
  typeof img === "string" ? { src: img } : img;

/* Beat sheet, in seconds from the start of the timeline, following the reference:
   the word sets, a small window opens inline between the syllables, the cutouts cycle
   through it at letter size, and only the final panel is blown up to fullscreen. */
const LETTERS_IN = 1.0;      // wordmark rises
const BOX_OPEN_AT = 1.0;     // window starts prising the syllables apart
const BOX_OPEN = 0.55;
const CYCLE_AT = 1.55;       // first cutout starts handing over
const CYCLE_STEP = 0.36;     // screen time per cutout
const CYCLE_FADE = 0.16;     // cross-fade between them
const EXPAND = 1.25;         // final panel opening out to fullscreen
const SETTLE = 0.25;         // beat on the finished frame before handing over
const CURTAIN_FADE = 0.55;

/* Matches .willem-header in WillemLoader.css */
const DEFAULT_BACKGROUND = "#E8F6FF";

interface WillemLoaderProps {
  onComplete: () => void;
  /** Covers shown in the window, top of the stack first. */
  images?: (string | LoaderImage)[];
  /** Opaque image sitting under the stack. Ignored when `finale` is supplied. */
  finalImage?: string;
  /** Extra class for that image, e.g. to colour-match the scene it hands over to. */
  finalImageClassName?: string;
  /** Rendered under the stack instead of `finalImage`, at full viewport size — use it
   *  to open the curtain onto the page itself rather than onto a photo. */
  finale?: ReactNode;
  /** Curtain colour behind the wordmark. */
  background?: string;
  /** Wordmark colour. */
  color?: string;
}

export default function WillemLoader({
  onComplete,
  images = DEFAULT_IMAGES,
  finalImage = "/laptop/001.png",
  finalImageClassName,
  finale,
  background,
  color,
}: WillemLoaderProps) {
  const containerRef = useRef<HTMLElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const covers = images.map(toImage);
  const imageCount = covers.length;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Holds the per-frame alignment callback so the cleanup below can detach it
    const ticker: { fn: (() => void) | null; resize: (() => void) | null } = { fn: null, resize: null };

    const ctx = gsap.context(() => {
      const loadingLetter = container.querySelectorAll(".willem__letter");
      const box = container.querySelectorAll(".willem-loader__box");
      const growingImage = container.querySelectorAll(".willem__growing-image");
      const headingStart = container.querySelectorAll(".willem__h1-start");
      const headingEnd = container.querySelectorAll(".willem__h1-end");
      const coverImageExtra = container.querySelectorAll(".willem__cover-image-extra");
      const boxInner = container.querySelector<HTMLElement>(".willem-loader__box-inner");
      const heading = container.querySelector<HTMLElement>(".willem__h1");
      const glyph = container.querySelector<HTMLElement>(".willem__half-glyph");

      // The M is split down its middle: each side clips one half of a full glyph, so at
      // rest the two halves meet exactly and read as a single letter.
      const splitGlyph = () => {
        if (!heading || !glyph) return;
        heading.style.setProperty("--willem-m-half", `${glyph.getBoundingClientRect().width / 2}px`);
      };
      splitGlyph();
      window.addEventListener("resize", splitGlyph);
      ticker.resize = splitGlyph;

      // The window's size lives in CSS; measure it rather than duplicating the value here
      const windowWidth = boxInner ? boxInner.offsetWidth : 0;

      /* GSAP Timeline */
      const tl = gsap.timeline({
        defaults: {
          ease: "expo.inOut",
        },
        onStart: () => {
          container.classList.remove("is--hidden");
        },
      });

      /* 1. Wordmark rises into place */
      if (loadingLetter.length) {
        tl.from(loadingLetter, {
          yPercent: 100,
          // Both halves of the M share a slot so the letter rises in one piece
          stagger: (i, el: HTMLElement) => Number(el.dataset.slot ?? i) * 0.035,
          duration: LETTERS_IN,
        }, 0);
      }

      /* 2. A letter-sized window prises the two syllables apart */
      if (box.length) {
        tl.fromTo(box, { width: 0 }, { width: windowWidth, duration: BOX_OPEN }, BOX_OPEN_AT);
      }

      if (growingImage.length) {
        tl.fromTo(growingImage, { width: "0%" }, { width: "100%", duration: BOX_OPEN }, BOX_OPEN_AT);
      }

      if (headingStart.length) {
        tl.fromTo(headingStart, { x: "0em" }, { x: "-0.05em", duration: BOX_OPEN }, BOX_OPEN_AT);
      }

      if (headingEnd.length) {
        tl.fromTo(headingEnd, { x: "0em" }, { x: "0.05em", duration: BOX_OPEN }, BOX_OPEN_AT);
      }

      /* 3. Cutouts cycle through that small window, one handing over to the next */
      if (coverImageExtra.length) {
        tl.fromTo(
          coverImageExtra,
          { opacity: 1 },
          {
            opacity: 0,
            duration: CYCLE_FADE,
            ease: "power1.inOut",
            stagger: CYCLE_STEP,
          },
          CYCLE_AT,
        );
      }

      /* 4. Only the final panel opens out, so the destination is what fills the screen */
      const expandAt = CYCLE_AT + coverImageExtra.length * CYCLE_STEP;

      if (growingImage.length) {
        tl.to(
          growingImage,
          { width: "100vw", height: "100dvh", duration: EXPAND, ease: "expo.inOut" },
          expandAt,
        );
      }

      if (box.length) {
        tl.to(box, { width: "110vw", duration: EXPAND, ease: "expo.inOut" }, expandAt);
      }

      // The unveiled page keeps true viewport dimensions while its window grows, so the
      // curtain reads as a widening window onto the page instead of a stretching photo.
      // The window drifts as the wordmark is pushed aside, so re-pin it every frame.
      const finaleWindow = container.querySelector<HTMLElement>(".willem__finale");
      const finalePage = container.querySelector<HTMLElement>(".willem__finale-page");
      if (finaleWindow && finalePage) {
        ticker.fn = () => {
          // Match `position: fixed; inset: 0` exactly — 100vw would include the
          // scrollbar and push the revealed page a couple of pixels out of register.
          const { clientWidth, clientHeight } = document.documentElement;
          if (finalePage.offsetWidth !== clientWidth) {
            finalePage.style.width = `${clientWidth}px`;
          }
          if (finalePage.offsetHeight !== clientHeight) {
            finalePage.style.height = `${clientHeight}px`;
          }
          const { left, top } = finaleWindow.getBoundingClientRect();
          finalePage.style.transform = `translate(${-left}px, ${-top}px)`;
        };
        ticker.fn();
        gsap.ticker.add(ticker.fn);
      }

      /* 5. Beat on the finished frame, then hand the page over */
      tl.to(
        container,
        {
          autoAlpha: 0,
          duration: CURTAIN_FADE,
          ease: "power2.inOut",
          onComplete: () => {
            onCompleteRef.current?.();
          },
        },
        expandAt + EXPAND + SETTLE,
      );

    }, container);

    return () => {
      if (ticker.fn) gsap.ticker.remove(ticker.fn);
      if (ticker.resize) window.removeEventListener("resize", ticker.resize);
      ctx.revert();
    };
  }, [imageCount]);

  const curtainStyle: CSSProperties | undefined = background
    ? { backgroundColor: background }
    : undefined;

  return (
    <section ref={containerRef} className="willem-header is--loading" style={curtainStyle}>
      <div className="willem-loader" style={color ? { color } : undefined}>
        <div className="willem__h1" role="img" aria-label="Ahmad">
          <div className="willem__h1-start" aria-hidden="true">
            <span className="willem__letter" data-slot="0">A</span>
            <span className="willem__letter" data-slot="1">H</span>
            <span className="willem__letter willem__half willem__half--start" data-slot="2">
              <span className="willem__half-glyph">M</span>
            </span>
          </div>
          <div className="willem-loader__box">
            <div className="willem-loader__box-inner">
              <div className="willem__growing-image">
                <div className="willem__growing-image-wrap">
                  {covers.map(({ src, position, zoom, backdrop }, i) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={src}
                      className="willem__cover-image-extra"
                      src={src}
                      alt=""
                      fetchPriority={i === 0 ? "high" : "auto"}
                      style={{
                        zIndex: covers.length - i,
                        objectPosition: position,
                        transform: zoom ? `scale(${zoom})` : undefined,
                        transformOrigin: position,
                        // These are transparent cutouts — without a backing they would all
                        // composite at once instead of reading as one image at a time
                        backgroundColor: backdrop ?? background ?? DEFAULT_BACKGROUND,
                      }}
                    />
                  ))}

                  {/* Base layer — either a still, or the destination page itself */}
                  {finale ? (
                    <div className="willem__finale">
                      <div className="willem__finale-page">{finale}</div>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      className={
                        finalImageClassName
                          ? `willem__cover-image ${finalImageClassName}`
                          : "willem__cover-image"
                      }
                      src={finalImage}
                      alt=""
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="willem__h1-end" aria-hidden="true">
            <span className="willem__letter willem__half willem__half--end" data-slot="2">
              <span className="willem__half-glyph">M</span>
            </span>
            <span className="willem__letter" data-slot="3">A</span>
            <span className="willem__letter" data-slot="4">D</span>
          </div>
        </div>
      </div>
    </section>
  );
}
