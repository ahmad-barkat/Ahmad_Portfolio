"use client";

import React, { useEffect, useRef } from "react";
import { useAnimate, useInView, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { ReviewAvatar, StarRow, FACE_FILLS } from "@/components/ui/review-bits";
import type { Review } from "@/data/reviews";

/**
 * One column of testimonials drifting upwards forever (from 21st.dev's
 * testimonials-columns-1). The list is rendered twice and slides by half its
 * height, so the loop has no seam. It holds while hovered so a card can be
 * read, pauses off screen, and stays still with reduced motion.
 */
export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Review[];
  /** Seconds for one full pass of the list */
  duration?: number;
  /** Offsets the avatar colours so neighbouring columns differ */
  fillOffset?: number;
}) => {
  const { className, testimonials, duration = 10, fillOffset = 0 } = props;
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduce = useReducedMotion();
  const inView = useInView(scope, { margin: "200px 0px" });
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const hovered = useRef(false);

  useEffect(() => {
    if (reduce || !scope.current) return;
    const c = animate(scope.current, { y: ["0%", "-50%"] }, { duration, ease: "linear", repeat: Infinity });
    c.pause();
    controls.current = c;
    return () => {
      c.stop();
      controls.current = null;
    };
  }, [animate, scope, duration, reduce]);

  useEffect(() => {
    if (inView && !hovered.current) controls.current?.play();
    else controls.current?.pause();
  }, [inView, reduce]);

  const hold = (on: boolean) => {
    hovered.current = on;
    if (on) controls.current?.pause();
    else if (inView) controls.current?.play();
  };

  return (
    <div className={className} onPointerEnter={() => hold(true)} onPointerLeave={() => hold(false)}>
      <div ref={scope} className="tm-track">
        {[0, 1].map((copy) => (
          <React.Fragment key={copy}>
            {testimonials.map((t, i) => (
              <figure className="tm-card" key={`${copy}-${i}`} aria-hidden={copy === 1 || undefined}>
                <StarRow n={t.rating} className="tm-stars" />
                <blockquote className="tm-quote">{t.quote}</blockquote>
                <figcaption className="tm-by">
                  <span className="tm-avatar">
                    <ReviewAvatar review={t} fill={FACE_FILLS[(i + fillOffset) % FACE_FILLS.length]} />
                  </span>
                  <span className="tm-who">
                    <b>{t.name}</b>
                    <span>
                      {t.role}
                      {t.sample && <i className="tm-sample">Sample</i>}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsColumn;
