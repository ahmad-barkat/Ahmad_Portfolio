"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { gsap } from "gsap";

export interface PortfolioArrivalHandle {
  reveal: () => void;
}

const PortfolioArrival = forwardRef<PortfolioArrivalHandle>((_, ref) => {
  const rootRef     = useRef<HTMLDivElement>(null);
  const lineRef     = useRef<HTMLDivElement>(null);
  const nameRef     = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLDivElement>(null);
  const taglineRef  = useRef<HTMLDivElement>(null);
  const ctaRef      = useRef<HTMLDivElement>(null);
  const yearRef     = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    reveal() {
      const root = rootRef.current;
      if (!root) return;

      // Make visible
      gsap.set(root, { autoAlpha: 1 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Horizontal line sweeps in
      tl.fromTo(lineRef.current,
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.8 }
      )
      // Name reveals — Cartefield
      .fromTo(nameRef.current,
        { autoAlpha: 0, y: 40, skewY: 4 },
        { autoAlpha: 1, y: 0, skewY: 0, duration: 1.0 },
        "-=0.3"
      )
      // Title
      .fromTo(titleRef.current,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.7 },
        "-=0.6"
      )
      // Tagline
      .fromTo(taglineRef.current,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.6 },
        "-=0.5"
      )
      // CTA buttons
      .fromTo(ctaRef.current,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.6 },
        "-=0.4"
      )
      // Year stamp
      .fromTo(yearRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5 },
        "-=0.3"
      );
    },
  }));

  return (
    <div
      ref={rootRef}
      style={{ opacity: 0, visibility: "hidden" }}
      className="arrival-root"
    >
      {/* Ambient radial bg */}
      <div className="arrival-glow" />

      <div className="arrival-inner">
        {/* Top line + label */}
        <div className="arrival-top-row">
          <div ref={lineRef} className="arrival-line" />
          <span className="arrival-now-label">Present — 2026</span>
        </div>

        {/* Name */}
        <div ref={nameRef} className="arrival-name">
          Muhammad<br />Ahmad Barkat
        </div>

        {/* Title */}
        <div ref={titleRef} className="arrival-title">
          Software Engineer
        </div>

        {/* Tagline */}
        <p ref={taglineRef} className="arrival-tagline">
          Building scalable web experiences from Cairo to the world.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="arrival-ctas">
          <button className="arrival-cta-primary">View Work</button>
          <button className="arrival-cta-ghost">Get in Touch</button>
        </div>
      </div>

      {/* Year stamp bottom-right */}
      <div ref={yearRef} className="arrival-year">© 2026</div>
    </div>
  );
});

PortfolioArrival.displayName = "PortfolioArrival";
export default PortfolioArrival;
