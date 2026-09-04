"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef      = useRef<HTMLDivElement>(null);
  const subtitleRef  = useRef<HTMLDivElement>(null);
  const trackWrapRef = useRef<HTMLDivElement>(null);
  const fillRef      = useRef<HTMLDivElement>(null);
  const dotsRowRef   = useRef<HTMLDivElement>(null);
  const panel1Ref    = useRef<HTMLDivElement>(null);
  const panel2Ref    = useRef<HTMLDivElement>(null);
  const panel3Ref    = useRef<HTMLDivElement>(null);
  const panel4Ref    = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Phase 1: Reveal
      tl.fromTo(logoRef.current,
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.85 }
      )
      .fromTo(subtitleRef.current,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.6 },
        "-=0.5"
      )
      .fromTo(trackWrapRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.4 },
        "-=0.3"
      )
      .fromTo(dotsRowRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.4 },
        "<"
      );

      // Phase 2: Counter + fill bar
      const counterObj = { val: 0 };
      tl.to(counterObj, {
        val: 100,
        duration: 2.0,
        ease: "power1.inOut",
        onUpdate() {
          const v = Math.round(counterObj.val);
          setCount(v);
          if (fillRef.current) fillRef.current.style.width = `${v}%`;
        },
      }, "-=0.2");

      // Phase 3: Exit
      tl.to({}, { duration: 0.2 });
      tl.to(
        [logoRef.current, subtitleRef.current, trackWrapRef.current, dotsRowRef.current],
        { autoAlpha: 0, y: -16, duration: 0.45, ease: "power2.in", stagger: 0.06 }
      );

      // Panels wipe upward
      tl.to(panel1Ref.current, { yPercent: -100, duration: 0.7, ease: "power3.inOut" }, "-=0.1")
        .to(panel2Ref.current, { yPercent: -100, duration: 0.7, ease: "power3.inOut" }, "-=0.55")
        .to(panel3Ref.current, { yPercent: -100, duration: 0.7, ease: "power3.inOut" }, "-=0.55")
        .to(panel4Ref.current, { yPercent: -100, duration: 0.7, ease: "power3.inOut" }, "-=0.55");

      tl.call(() => {
        document.body.style.overflow = "";
        onComplete();
      });
    }, containerRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, [onComplete]);

  return (
    <div ref={containerRef} className="loading-root" aria-hidden="true">
      {/* Wipe panels */}
      <div ref={panel1Ref} className="loading-panel loading-panel-1" />
      <div ref={panel2Ref} className="loading-panel loading-panel-2" />
      <div ref={panel3Ref} className="loading-panel loading-panel-3" />
      <div ref={panel4Ref} className="loading-panel loading-panel-4" />

      {/* Content */}
      <div className="loading-content">
        {/* Monogram */}
        <div ref={logoRef} style={{ opacity: 0 }}>
          <span className="loading-monogram">MAB</span>
        </div>

        {/* Subtitle */}
        <div ref={subtitleRef} style={{ opacity: 0 }}>
          <span className="loading-subtitle">Software Engineer</span>
        </div>

        {/* Progress track */}
        <div ref={trackWrapRef} className="loading-track-wrap" style={{ opacity: 0 }}>
          <div className="loading-track">
            <div ref={fillRef} className="loading-fill" />
          </div>

          {/* Dots + counter */}
          <div ref={dotsRowRef} className="loading-row">
            <div className="loading-dots">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="loading-dot animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <span className="loading-counter">
              {String(count).padStart(3, "0")}%
            </span>
          </div>
        </div>

        <div className="loading-accent-line" />
      </div>
    </div>
  );
}
