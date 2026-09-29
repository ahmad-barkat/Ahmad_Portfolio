"use client";

import React, { useEffect, useRef, useState } from "react";
import { PUBLISHED_REVIEWS } from "@/data/reviews";
import { ReadingText, ReviewAvatar as Avatar, FACE_FILLS, readSeconds } from "@/components/ui/review-bits";
import { TextRoll } from "@/components/ui/TextRoll";
import { useLenis } from "@/components/ui/LenisProvider";
import { GenjutsuReveal, Sharingan, SharinganDefs } from "@/components/ui/genjutsu-reveal";
import { RevealText } from "@/components/ui/RevealText";

/* PLACEHOLDER figures — replace with your real numbers before launch. */
/** The figures, and their shinobi face: rank, missions and chakra */
const STATS = [
  { value: 5, suffix: "+", label: "Years of experience", short: "Years", alt: "Jōnin · 5 years of training", altShort: "Jōnin", altValue: "上忍", altSuffix: "", kanji: "位" },
  { value: 40, suffix: "+", label: "Projects delivered", short: "Projects", alt: "S-rank missions cleared", altShort: "S-rank", altValue: "40", altSuffix: "+", kanji: "任" },
  { value: 98, suffix: "", label: "Avg. Lighthouse score", short: "Lighthouse", alt: "Chakra control", altShort: "Chakra", altValue: "98", altSuffix: "%", kanji: "気", meter: 98 },
];

const AVAILABILITY = "Open to new projects";

/** The hover face's stand-in when a review has no shinobi version of its own */
const GENJUTSU_FALLBACK = [
  "Moves through a codebase like a *Shadow Clone* squad, and ships with the precision of the *Sharingan*.",
  "Every launch hits with the force of a *Tailed Beast*, and every detail is seen by a *Byakugan*.",
];

/** Text with *marked* words glowing, for the shinobi face */
function GenjutsuText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <mark key={i} className="gj-mark">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}


/** Distinct people only, for the avatar stack and the count */
const REVIEWERS = PUBLISHED_REVIEWS.filter(
  (r, i, all) => all.findIndex((o) => o.initials === r.initials) === i,
);
const RATING = REVIEWERS.length
  ? REVIEWERS.reduce((sum, r) => sum + r.rating, 0) / REVIEWERS.length
  : 0;


/* A single tomoe, the comma of the sharingan, standing in for a star */
function Tomoe() {
  return (
    <svg viewBox="-4 -5 8 9" aria-hidden="true">
      <circle cx="0" cy="1.2" r="2.4" />
      <path d="M2.3 0.6 C 2.9 -2.2 0.9 -4.4 -2.4 -4.6 C -0.6 -3.4 -0.1 -1.6 -0.3 -1.1 Z" />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}

/**
 * The hero's side columns: a positioning line and client proof on the left,
 * figures and a rotating client quote on the right. They frame the portrait
 * from the corners and stay out of the wordmark's band. Wide screens only;
 * phones get the single line in LandoAboutHero instead.
 */
export function HeroAside() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const [quote, setQuote] = useState(0);
  const [held, setHeld] = useState(false);
  const [offscreen, setOffscreen] = useState(false);

  // The quote clock stops while the hero is out of view
  useEffect(() => {
    // The root is display: contents and has no box to observe; its parent does
    const el = rootRef.current?.parentElement;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOffscreen(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toReviews = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("reviews");
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 2.2 });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  const current = PUBLISHED_REVIEWS[quote];
  const seconds = current ? readSeconds(current.quote) : 7;
  const faces = REVIEWERS.slice(0, 4);

  const reviewsLabel = `${REVIEWERS.length} client reviews`;

  const proof = (mobile: boolean) =>
    REVIEWERS.length > 0 && (
      <GenjutsuReveal
        className={mobile ? "gj--start" : "gj--block"}
        alt={
          <div className={`hs-proof gj-proof ${mobile ? "hs-proof--m" : ""}`}>
            <div className="hs-faces gj-faces">
              {faces.map((r) => (
                <span key={r.initials}>
                  <Sharingan />
                </span>
              ))}
              {REVIEWERS.length > faces.length && (
                <span className="hs-faces__more">+{REVIEWERS.length - faces.length}</span>
              )}
            </div>
            <div className="hs-proof__text">
              <span className="hs-rating">
                <span className="hs-stars gj-tomoe">
                  {Array.from({ length: 5 }, (_, i) => <Tomoe key={i} />)}
                </span>
                <strong>{RATING.toFixed(1)}</strong>
              </span>
              <span className="ftr-link hs-link gj-link">{reviewsLabel}</span>
            </div>
          </div>
        }
      >
        <div
          className={`hs-proof hs-in ${mobile ? "hs-proof--m" : ""}`}
        >
          <div className="hs-faces" aria-hidden="true">
            {faces.map((r, i) => (
              <span key={r.initials}>
                <Avatar review={r} fill={FACE_FILLS[i % FACE_FILLS.length]} />
              </span>
            ))}
            {REVIEWERS.length > faces.length && (
              <span className="hs-faces__more">+{REVIEWERS.length - faces.length}</span>
            )}
          </div>
          <div className="hs-proof__text">
            <span className="hs-rating" aria-label={`Rated ${RATING.toFixed(1)} out of 5`}>
              <span className="hs-stars" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => <Star key={i} />)}
              </span>
              <strong>{RATING.toFixed(1)}</strong>
            </span>
            <a href="#reviews" className="ftr-link hs-link" onClick={toReviews}>
              <TextRoll className="ftr-link__roll" style={{ lineHeight: 1.25 }}>
                {reviewsLabel}
              </TextRoll>
            </a>
          </div>
        </div>
      </GenjutsuReveal>
    );

  return (
    <div ref={rootRef} className="contents">
    <SharinganDefs />
    <div className="hs" aria-label="About Ahmad at a glance" role="complementary">
      {/* ── Left: who, and who says so ── */}
      <div className="hs-col hs-col--left">
        <GenjutsuReveal
          className="gj--block"
          alt={
            <div className="hs-intro gj-intro">
              <p className="hs-eyebrow">
                <span />
                <b lang="ja">写輪眼</b> Shinobi developer
              </p>
              <p className="hs-statement">
                <GenjutsuText text="Builds with the eyes of the *Sharingan* and the stamina of a *Tailed Beast*." />
              </p>
              <p className="hs-status">
                <Sharingan className="gj-status-eye" />
                Mangekyō mode · active
              </p>
            </div>
          }
        >
        <div className="hs-intro">
          <p className="hs-eyebrow hs-in">
            <span aria-hidden="true" />
            <RevealText>Full-stack developer</RevealText>
          </p>
          <p className="hs-statement hs-in">
            <RevealText>
              Websites that feel as <em>considered</em> as the brands behind them.
            </RevealText>
          </p>
          <p className="hs-status hs-in">
            <RevealText>{AVAILABILITY}</RevealText>
          </p>
        </div>
        </GenjutsuReveal>

        {proof(false)}
      </div>

      {/* ── Right: the numbers, and a client in their own words ── */}
      <div className="hs-col hs-col--right">
        <GenjutsuReveal
          className="gj--block"
          alt={
            <dl className="hs-stats gj-stats">
              {STATS.map((s) => (
                <div key={s.label} className="hs-stat">
                  {s.meter !== undefined && (
                    <span className="gj-chakra" aria-hidden="true">
                      <i style={{ width: `${s.meter}%` }} />
                    </span>
                  )}
                  <dt>{s.alt}</dt>
                  <dd className={s.altSuffix === "" ? "gj-rank" : undefined} lang={s.altSuffix === "" ? "ja" : undefined}>
                    {s.altValue}
                    {s.altSuffix && <i>{s.altSuffix}</i>}
                  </dd>
                  <b className="gj-kanji" lang="ja">{s.kanji}</b>
                </div>
              ))}
            </dl>
          }
        >
        <dl className="hs-stats">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="hs-stat hs-in"
            >
              <dt><RevealText>{s.label}</RevealText></dt>
              <dd>
                <span data-count={s.value} data-count-i={i}>{s.value}</span>
                {s.suffix && <i>{s.suffix}</i>}
              </dd>
            </div>
          ))}
        </dl>
        </GenjutsuReveal>

        {current ? (
          <GenjutsuReveal
            className="gj--block"
            alt={
              <figure className="hs-quote gj-quote">
                <div className="hs-quote__body gj-quote__body">
                  <Sharingan className="gj-quote-eye" />
                  <blockquote>
                    <p>
                      <GenjutsuText
                        text={current.genjutsu ?? GENJUTSU_FALLBACK[quote % GENJUTSU_FALLBACK.length]}
                      />
                    </p>
                  </blockquote>
                  <figcaption>
                    <span className="hs-quote__avatar gj-quote__avatar">
                      <Sharingan />
                    </span>
                    <b>{current.name}</b>
                    <span>{current.role}</span>
                  </figcaption>
                </div>
                <b className="gj-kanji gj-kanji--quote" lang="ja">忍</b>
              </figure>
            }
          >
          <figure
            className="hs-quote hs-in"
            data-paused={held || offscreen}
            data-reading-paused={held || offscreen}
            onPointerEnter={() => setHeld(true)}
            onPointerLeave={() => setHeld(false)}
            onFocus={() => setHeld(true)}
            onBlur={() => setHeld(false)}
          >
            <div key={quote} className="hs-quote__body">
              <blockquote>
                <ReadingText text={current.quote} keys={current.highlight} seconds={seconds} />
              </blockquote>
              <figcaption>
                <span className="hs-quote__avatar">
                  <Avatar review={current} fill={FACE_FILLS[quote % FACE_FILLS.length]} />
                </span>
                <b>{current.name}</b>
                <span>{current.role}</span>
              </figcaption>
            </div>
            <div className="hs-quote__steps" aria-label="Client quotes">
              {PUBLISHED_REVIEWS.slice(0, 5).map((r, i) => (
                <button
                  key={r.initials + i}
                  type="button"
                  aria-current={i === quote}
                  aria-label={`Quote ${i + 1}: ${r.name}`}
                  className="hs-step"
                  data-active={i === quote}
                  onClick={() => setQuote(i)}
                >
                  <span
                    style={{ animationDuration: `${seconds}s` }}
                    onAnimationEnd={() => setQuote((q) => (q + 1) % Math.min(5, PUBLISHED_REVIEWS.length))}
                  />
                </button>
              ))}
            </div>
          </figure>
          </GenjutsuReveal>
        ) : (
          <div className="hs-scroll hs-in" aria-hidden="true">
            Scroll
            <b />
          </div>
        )}
      </div>
    </div>

    {/* ── Phones: figures above the head, proof and a line of context below ── */}
    <div className="hs-m" aria-label="About Ahmad at a glance" role="complementary">
      <GenjutsuReveal
        className="hs-m__stats-pos"
        alt={
          <dl className="hs-m__stats gj-mstats">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt>{s.altShort}</dt>
                <dd className={s.altSuffix === "" ? "gj-rank" : undefined} lang={s.altSuffix === "" ? "ja" : undefined}>
                  {s.altValue}
                  {s.altSuffix && <i>{s.altSuffix}</i>}
                </dd>
              </div>
            ))}
          </dl>
        }
      >
      <dl className="hs-m__stats hs-in">
        {STATS.map((s, i) => (
          <div key={s.label}>
            <dt><RevealText>{s.short}</RevealText></dt>
            <dd>
              <span data-count={s.value} data-count-i={i}>{s.value}</span>
              {s.suffix && <i>{s.suffix}</i>}
            </dd>
          </div>
        ))}
      </dl>
      </GenjutsuReveal>

      <div className="hs-m__foot">
        {proof(true)}
        <div className="hero-mobile-line">
          <span>
            <RevealText>
              Full-stack developer <i aria-hidden="true">·</i> Dubai
            </RevealText>
          </span>
          <span aria-hidden="true" className="hero-mobile-line__scroll">
            Scroll
            <b />
          </span>
        </div>
      </div>
    </div>
    </div>
  );
}

export default HeroAside;
