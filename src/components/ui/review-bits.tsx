"use client";

import React from "react";
import type { Review } from "@/data/reviews";

/**
 * How long a quote stays up: long enough to read it at an easy pace, since
 * its words light up in reading order.
 */
export const readSeconds = (text: string, min = 6.5, max = 12) =>
  Math.min(max, Math.max(min, text.split(/\s+/).length * 0.32 + 2.5));

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

/**
 * A quote that reads itself: each word lights up in turn at an easy reading
 * pace, and the review's key phrases get an underline as they are reached.
 * Reading takes the first ~60% of `seconds`; the rest is time to rest on it.
 * Pause it by setting data-reading-paused="true" on any ancestor.
 */
export function ReadingText({
  text,
  keys = [],
  seconds,
  className,
}: {
  text: string;
  keys?: string[];
  seconds: number;
  className?: string;
}) {
  const words = text.split(/\s+/);
  const key = new Array(words.length).fill(false);
  const plain = words.map(norm);
  for (const phrase of keys) {
    const pw = phrase.split(/\s+/).map(norm);
    for (let i = 0; i + pw.length <= plain.length; i++) {
      if (pw.every((w, j) => plain[i + j] === w)) pw.forEach((_, j) => (key[i + j] = true));
    }
  }
  const perWord = (seconds * 0.6) / words.length;

  // Consecutive key words form one phrase, so its underline runs unbroken
  const runs: { from: number; to: number; key: boolean }[] = [];
  words.forEach((_, i) => {
    const last = runs[runs.length - 1];
    if (last && last.key === key[i]) last.to = i;
    else runs.push({ from: i, to: i, key: key[i] });
  });

  const word = (i: number, trailing: boolean) => (
    <React.Fragment key={i}>
      <span className="hs-w" style={{ "--i": i } as React.CSSProperties}>
        {words[i]}
      </span>
      {trailing && " "}
    </React.Fragment>
  );

  return (
    <p className={className} style={{ "--hs-wps": `${perWord.toFixed(3)}s` } as React.CSSProperties}>
      {runs.map((run) => {
        const ids = Array.from({ length: run.to - run.from + 1 }, (_, k) => run.from + k);
        if (!run.key) return ids.map((i) => word(i, i < words.length - 1));
        // The phrase's trailing space stays outside, so the underline stops at the last letter
        const last = ids[ids.length - 1];
        return (
          <React.Fragment key={`k${run.from}`}>
            <span className="hs-key" style={{ "--i": run.from, "--n": ids.length } as React.CSSProperties}>
              {ids.map((i) => word(i, i < last))}
            </span>
            {last < words.length - 1 && " "}
          </React.Fragment>
        );
      })}
    </p>
  );
}

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
