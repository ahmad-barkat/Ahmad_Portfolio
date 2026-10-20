"use client";

import React, { useEffect, useRef } from "react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import { ReviewAvatar, StarRow, FACE_FILLS } from "@/components/ui/review-bits";
import { PUBLISHED_REVIEWS, REAL_REVIEWS } from "@/data/reviews";
import type { Review } from "@/data/reviews";

/** "Sarah M." -> "sarah-m.md": each review is filed like a doc in a project */
const fileName = (name: string) =>
  `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.md`;

/** The quote with its `highlight` phrases marked, in the order they appear */
function marked(r: Review) {
  const phrases = (r.highlight ?? []).filter((p) => r.quote.includes(p));
  if (!phrases.length) return r.quote;
  const re = new RegExp(`(${phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`);
  return r.quote.split(re).map((part, i) => (phrases.includes(part) ? <mark key={i}>{part}</mark> : part));
}

/**
 * Testimonials as folders: each review is a light sheet filed in a folder
 * with a file tab, its top peeking out; the folder's front pocket names the
 * reviewer. On hover the sheet lifts out and the pocket tips forward. The
 * whole review is readable at rest, so touch screens lose nothing. Two
 * columns from 768px, one on phones.
 * The cards rise in one after another the first time the grid comes into
 * view. `id="reviews"` is the hero's "client reviews" link target. Loaded
 * only when there are published reviews (see TestimonialsSection.tsx).
 *
 * `background` matches the page it sits on, so it meets the section above
 * without a seam; it is opaque because the footer curtain sits beneath it.
 */
export function TestimonialsGrid({ background = "#072A5E" }: { background?: string }) {
  const ref = useRef<HTMLElement>(null);

  // Rise in once, the first time the section comes into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).dataset.in = "true";
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    el.querySelectorAll(".tm-head, .tf-card").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="reviews"
      className="tm-section"
      style={{ "--tm-bg": background } as React.CSSProperties}
      aria-labelledby="tm-title"
    >
      {/* Without scripts nothing rises in, so nothing may wait to */}
      <noscript>
        <style>{`.tm-head,.tf-card{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <div className="tm-head">
        <p className="tm-eyebrow">Testimonials</p>
        <HeadingReveal as="h2" id="tm-title" className="tm-title" scrollStart="top 80%">
          What clients say
        </HeadingReveal>
        <p className="tm-intro">
          {REAL_REVIEWS.length
            ? "Founders, product leads and studios on working together, in their own words."
            : "A preview of how client reviews will read here. These are samples; real ones are on their way."}
        </p>
      </div>

      <div className="tf-grid">
        {PUBLISHED_REVIEWS.map((r, i) => (
          <figure key={r.name} className="tf-card" style={{ "--i": i % 2 } as React.CSSProperties}>
            {/* The folder's back, with its file tab */}
            <span className="tf-back" aria-hidden="true" />
            <span className="tf-tab" aria-hidden="true">
              <i>{String(i + 1).padStart(2, "0")}</i>
              {fileName(r.name)}
            </span>
            {/* The review on a sheet, its top peeking out of the folder */}
            <div className="tf-paper">
              <div className="tf-top">
                <StarRow n={r.rating} className="tm-stars" />
                {r.sample ? (
                  <span className="tf-sample">Sample review</span>
                ) : (
                  <span className="tf-score" aria-hidden="true">
                    {r.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <blockquote className="tf-quote">{marked(r)}</blockquote>
            </div>
            {/* The front pocket holds the sheet's foot and says who wrote it */}
            <figcaption className="tf-front tm-by">
              <span className="tm-avatar">
                <ReviewAvatar review={r} fill={FACE_FILLS[i % FACE_FILLS.length]} />
              </span>
              <span className="tm-who">
                <b>{r.name}</b>
                <span>{r.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export default TestimonialsGrid;
