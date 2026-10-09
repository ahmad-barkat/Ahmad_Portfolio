"use client";

import React from "react";
import { motion } from "motion/react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { PUBLISHED_REVIEWS } from "@/data/reviews";
import type { Review } from "@/data/reviews";

/** Deals the reviews into `n` columns, round robin, so each stays balanced */
function deal(list: Review[], n: number) {
  const cols: Review[][] = Array.from({ length: n }, () => []);
  list.forEach((r, i) => cols[i % n].push(r));
  return cols;
}

/** Seconds per card, and each column's pace, so the columns drift out of step */
const PER_CARD = 5.5;
const PACE = [1, 1.25, 1.12];

const LAYOUTS = [
  { n: 1, className: "tm-cols tm-cols--1" },
  { n: 2, className: "tm-cols tm-cols--2" },
  { n: 3, className: "tm-cols tm-cols--3" },
];

/**
 * Testimonials: client words drifting up in columns, faded at the top and
 * bottom. One column on phones, two on tablets, three on desktop, and every
 * layout carries every review. `id="reviews"` is the hero's "client reviews"
 * link target. Loaded only when there are published reviews (see
 * TestimonialsSection.tsx).
 *
 * `background` matches the page it sits on, so it meets the section above
 * without a seam; it is opaque because the footer curtain sits beneath it.
 */
export function TestimonialsReel({ background = "#072A5E" }: { background?: string }) {
  return (
    <section
      id="reviews"
      className="tm-section"
      style={{ "--tm-bg": background } as React.CSSProperties}
      aria-labelledby="tm-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        className="tm-head"
      >
        <p className="tm-eyebrow">Testimonials</p>
        <HeadingReveal as="h2" id="tm-title" className="tm-title" scrollStart="top 80%">
          What clients say
        </HeadingReveal>
        <p className="tm-intro">Founders, product leads and studios on working together, in their own words.</p>
      </motion.div>

      {LAYOUTS.map(({ n, className }) => (
        <motion.div
          key={n}
          className={className}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        >
          {deal(PUBLISHED_REVIEWS, n).map((col, i) => (
            <TestimonialsColumn
              key={i}
              className="tm-col"
              testimonials={col}
              duration={col.length * PER_CARD * PACE[i]}
              fillOffset={i}
            />
          ))}
        </motion.div>
      ))}
    </section>
  );
}

export default TestimonialsReel;
