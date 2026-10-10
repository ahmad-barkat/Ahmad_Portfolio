"use client";

import React from "react";
import type { Review } from "@/data/reviews";

/** A reviewer's photo, or their initials when there is none */
export function ReviewAvatar({ review, fill }: { review: Review; fill?: string }) {
  return review.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={review.photo} alt="" loading="lazy" decoding="async" />
  ) : (
    <em style={fill ? { background: fill } : undefined}>{review.initials}</em>
  );
}

/* Avatar fills, from the site palette */
export const FACE_FILLS = [
  "linear-gradient(140deg, #3BA7F2, #0F4AA3)",
  "linear-gradient(140deg, #7FE7D6, #2E93E8)",
  "linear-gradient(140deg, #5FC7E4, #0B3D91)",
  "linear-gradient(140deg, #A5EEE2, #3BA7F2)",
];

export function StarRow({ n, className }: { n: number; className?: string }) {
  return (
    <span className={className} role="img" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" aria-hidden="true" data-on={i < Math.round(n)}>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}
