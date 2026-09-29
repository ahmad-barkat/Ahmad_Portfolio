"use client";

import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LINES = [
  { id: "l1", text: "I didn't start with a plan.", color: "#A5EEE2", size: "clamp(2rem, 5vw, 4rem)" },
  { id: "l2", text: "I started with a question:", color: "#A5EEE2", size: "clamp(2rem, 5vw, 4rem)" },
  { id: "l3", text: "What if I could build this?", color: "#E8F6FF", size: "clamp(2.5rem, 6vw, 5rem)" },
  { id: "l4", text: "I didn't have all the answers.", color: "#7FE7D6", size: "clamp(1.5rem, 4vw, 3rem)" },
  { id: "l5", text: "I just kept experimenting, breaking things,\nand starting again.", color: "#7FE7D6", size: "clamp(1.5rem, 4vw, 3rem)" },
  { id: "l6", text: "The first website I broke.", color: "#5FC7E4", size: "clamp(1.8rem, 4.5vw, 3.5rem)" },
  { id: "l7", text: "The tutorial I replayed ten times.", color: "#5FC7E4", size: "clamp(1.8rem, 4.5vw, 3.5rem)" },
  { id: "l7a", text: "The project I almost gave up on.", color: "#5FC7E4", size: "clamp(1.8rem, 4.5vw, 3.5rem)" },
  { id: "l7b", text: "The night everything finally clicked.", color: "#5FC7E4", size: "clamp(1.8rem, 4.5vw, 3.5rem)" },
  { id: "l8", text: "Every late night brought me a little closer\nto the developer I am today.", color: "#5FC7E4", size: "clamp(1.8rem, 4.5vw, 3.5rem)" },
  { id: "l9", text: "This is where my story Begins.", color: "#3BA7F2", size: "clamp(2.5rem, 6vw, 5rem)" },
];

const N = LINES.length;
const LAST = N - 1;
// Extra viewports added AFTER the last line for the "pull-to-enter" zone
const PULL_VH = 2;
// Total section height = story viewports + pull zone
const SECTION_VH = N + 0.5 + PULL_VH;
// Fraction of total scroll occupied by the story
const STORY_FRAC = (N + 0.5) / SECTION_VH;

export default function StorySection({ onComplete }: { onComplete?: () => void } = {}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<(HTMLDivElement | null)[]>([]);

  /* ── story progress bar ── */
  const barWrapRef = useRef<HTMLDivElement>(null);
  const barFillRef = useRef<HTMLDivElement>(null);
  const barDotRef = useRef<HTMLDivElement>(null);
  const barLabelRef = useRef<HTMLSpanElement>(null);

  /* ── pull-to-enter UI refs ── */
  const pullWrapRef = useRef<HTMLDivElement>(null);
  const pullArcRef = useRef<SVGCircleElement>(null);
  const pullPctRef = useRef<HTMLSpanElement>(null);
  const pullBarFill = useRef<HTMLDivElement>(null);
  const pulledRef = useRef(false);
  // Stable ref so the main effect doesn't re-run when the callback identity changes
  const onCompleteRef = useRef(onComplete);

  /* ── mouse-follow cursor label ── */
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorPos = useRef({ x: -200, y: -200 });
  const cursorTarget = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number | null>(null);
  const lastVisible = useRef(false);

  /* ── smooth cursor loop ── */
  const runCursorLoop = useCallback(() => {
    const el = cursorRef.current;
    if (!el) return;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    cursorPos.current.x = lerp(cursorPos.current.x, cursorTarget.current.x, 0.1);
    cursorPos.current.y = lerp(cursorPos.current.y, cursorTarget.current.y, 0.1);
    el.style.transform = `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px)`;
    rafRef.current = requestAnimationFrame(runCursorLoop);
  }, []);

  // Keep the ref current on every render
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    /* ── initial state ── */
    linesRef.current.forEach(el => {
      if (el) gsap.set(el, { autoAlpha: 0, y: 40 });
    });
    if (barWrapRef.current) gsap.set(barWrapRef.current, { autoAlpha: 0, y: 12 });
    if (pullWrapRef.current) gsap.set(pullWrapRef.current, { autoAlpha: 0, y: 20 });
    if (cursorRef.current) gsap.set(cursorRef.current, { autoAlpha: 0, scale: 0.85 });

    // Arc circumference for r=44
    const R = 44;
    const CIRC = 2 * Math.PI * R;
    if (pullArcRef.current) {
      pullArcRef.current.style.strokeDasharray = String(CIRC);
      pullArcRef.current.style.strokeDashoffset = String(CIRC);
    }

    /* ─────────────────────────────────────────
       MAIN STORY TIMELINE
       Covers only the first STORY_FRAC of scroll
    ───────────────────────────────────────── */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        // end at STORY_FRAC of total section height
        end: () => `+=${section.offsetHeight * STORY_FRAC}`,
        scrub: 1,
        onUpdate(self) {
          /* story progress bar fill */
          const pct = self.progress * 100;
          if (barFillRef.current) barFillRef.current.style.width = `${pct}%`;
          if (barDotRef.current) barDotRef.current.style.left = `${pct}%`;
          if (barLabelRef.current) barLabelRef.current.textContent = `${Math.round(pct)}%`;

          /* show bottom bar + cursor only when last line is visible */
          const step = 1 / (N + 0.5);
          const lastEnterAt = LAST * step;
          const isLastLine = self.progress >= lastEnterAt;

          if (isLastLine !== lastVisible.current) {
            lastVisible.current = isLastLine;
            const cursor = cursorRef.current;
            const barWrap = barWrapRef.current;
            if (cursor) {
              gsap.to(cursor, {
                autoAlpha: isLastLine ? 1 : 0,
                scale: isLastLine ? 1 : 0.85,
                duration: 0.4,
                ease: "power2.out",
              });
            }
            if (barWrap) {
              gsap.to(barWrap, {
                autoAlpha: isLastLine ? 1 : 0,
                y: isLastLine ? 0 : 12,
                duration: 0.5,
                ease: "power2.out",
              });
            }
          }
        },
      },
    });

    linesRef.current.forEach((el, i) => {
      if (!el) return;
      const step = 1 / (N + 0.5);
      const enterAt = i * step;
      const exitAt = (i + 1) * step;
      const holdIn = enterAt + step * 0.15;
      const holdOut = exitAt - step * 0.15;

      tl.fromTo(el,
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: holdIn - enterAt, ease: "power2.out" },
        enterAt
      );

      if (i < N - 1) {
        tl.to(el, { autoAlpha: 1, y: 0, duration: holdOut - holdIn }, holdIn)
          .to(el, { autoAlpha: 0, y: -40, duration: exitAt - holdOut, ease: "power2.in" }, holdOut);
      } else {
        // Last line stays pinned visible through the pull zone
        tl.to(el, { autoAlpha: 1, y: 0, duration: 1 - holdIn }, holdIn);
      }
    });

    /* ─────────────────────────────────────────
       PULL-TO-ENTER ZONE
       Fires after the story timeline ends.
       Drives the circular arc + pull bar.
       Calls onComplete at progress = 1.
    ───────────────────────────────────────── */
    const pullST = ScrollTrigger.create({
      trigger: section,
      // start where the story timeline ends
      start: () => `top+=${section.offsetHeight * STORY_FRAC} top`,
      // end at the very bottom of the section
      end: "bottom bottom",
      scrub: 0.6,
      onEnter() {
        /* fade in the pull-to-enter widget */
        if (pullWrapRef.current) {
          gsap.to(pullWrapRef.current, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" });
        }
        /* hide the story bar & cursor */
        if (barWrapRef.current) gsap.to(barWrapRef.current, { autoAlpha: 0, y: 10, duration: 0.3 });
        if (cursorRef.current) gsap.to(cursorRef.current, { autoAlpha: 0, duration: 0.3 });
      },
      onLeaveBack() {
        /* restore story bar + cursor when scrolling back up */
        if (pullWrapRef.current) {
          gsap.to(pullWrapRef.current, { autoAlpha: 0, y: 20, duration: 0.35 });
        }
        if (barWrapRef.current) gsap.to(barWrapRef.current, { autoAlpha: 1, y: 0, duration: 0.4 });
      },
      onUpdate(self) {
        const p = self.progress; // 0 → 1

        /* arc */
        if (pullArcRef.current) {
          pullArcRef.current.style.strokeDashoffset = String(CIRC * (1 - p));
        }
        const currentPct = Math.min(100, Math.round(p * 100));
        /* percentage label */
        if (pullPctRef.current) {
          pullPctRef.current.textContent = `${currentPct}`;
        }
        /* linear pull bar */
        if (pullBarFill.current) {
          pullBarFill.current.style.width = `${p * 100}%`;
        }

        /* fire immediately as soon as score hits 100 */
        if (currentPct >= 100 && !pulledRef.current) {
          pulledRef.current = true;
          onCompleteRef.current?.();
        }
        if (currentPct < 95) pulledRef.current = false;
      },
    });

    /* ─────────────────────────────────────────
       MOUSE TRACKING
    ───────────────────────────────────────── */
    const onMouseMove = (e: MouseEvent) => {
      cursorTarget.current.x = e.clientX;
      cursorTarget.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);
    rafRef.current = requestAnimationFrame(runCursorLoop);

    const tid = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      pullST.kill();
      window.removeEventListener("mousemove", onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(tid);
    };
  }, [runCursorLoop]);

  return (
    <>
      {/* ── Custom cursor label — fixed, pointer-events:none ── */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
          pointerEvents: "none",
          willChange: "transform",
          /* offset so the label sits to the right of the actual cursor */
          marginLeft: "20px",
          marginTop: "-14px",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5em",
          padding: "0.45em 0.9em 0.45em 0.75em",
          background: "rgba(11, 61, 145, 0.82)",
          border: "1px solid rgba(59, 167, 242, 0.35)",
          borderRadius: "100px",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(59, 167, 242,0.08)",
          whiteSpace: "nowrap",
        }}>
          <span style={{
            fontFamily: "monospace",
            fontSize: "0.62rem",
            color: "#7FE7D6",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}>
            Scroll to enter
          </span>
          {/* animated chevron */}
          <svg
            width="12" height="10" viewBox="0 0 12 10" fill="none"
            style={{ flexShrink: 0, animation: "storyChevron 1.2s ease-in-out infinite" }}
          >
            <path d="M1 5h10M7 1l4 4-4 4" stroke="#3BA7F2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ── Section ── */}
      <section
        ref={sectionRef}
        style={{
          position: "relative",
          height: `${SECTION_VH * 100}vh`,
          backgroundColor: "#0B3D91",
        }}
      >
        {/* CSS sticky panel */}
        <div style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}>
          {/* Ambient glow */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(22, 95, 196,0.45) 0%, transparent 70%)",
          }} />

          {/* Top hairline */}
          <div style={{
            position: "absolute", top: 0, left: "8%", right: "8%",
            height: "1px",
            background: "linear-gradient(to right, transparent, #165FC4, transparent)",
          }} />

          {/* All lines stacked in the center */}
          <div style={{
            position: "relative",
            width: "min(90vw, 900px)",
            textAlign: "center",
          }}>
            {LINES.map((line, i) => (
              <div
                key={line.id}
                ref={el => { linesRef.current[i] = el; }}
                style={{
                  position: i === 0 ? "relative" : "absolute",
                  top: i === 0 ? undefined : "50%",
                  left: i === 0 ? undefined : "50%",
                  transform: i === 0 ? undefined : "translate(-50%, -50%)",
                  width: "100%",
                  fontFamily: '"Cartefield", serif',
                  fontSize: line.size,
                  color: line.color,
                  lineHeight: "1.3",
                  letterSpacing: "0.02em",
                  whiteSpace: "pre-line",
                }}
              >
                {line.text}
              </div>
            ))}
          </div>

          {/* "scroll to explore" label — top-left */}
          <div style={{
            position: "absolute",
            top: "clamp(1.5rem, 4vh, 2.5rem)",
            left: "clamp(1.5rem, 4vw, 3rem)",
            fontFamily: "monospace",
            fontSize: "clamp(0.55rem, 1.2vw, 0.7rem)",
            color: "#2078D8",
            letterSpacing: "0.2em",
            zIndex: 5,
            textTransform: "uppercase" as const,
          }}>
            scroll to explore
          </div>

          {/* Skip Story Button — top-right */}
          <button
            onClick={() => onCompleteRef.current?.()}
            aria-label="Skip to Nav page"
            style={{
              position: "absolute",
              top: "clamp(1.5rem, 4vh, 2.5rem)",
              right: "clamp(4.5rem, 7vw, 6rem)", // shifted slightly left so hamburger button (far right) doesn't overlap it
              zIndex: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5em",
              padding: "clamp(0.6rem, 1.2vw, 0.85rem) clamp(1.2rem, 2.5vw, 1.8rem)",
              fontFamily: "monospace",
              fontSize: "clamp(0.65rem, 1.1vw, 0.8rem)",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              color: "#A5EEE2",
              backgroundColor: "rgba(22, 95, 196, 0.45)",
              border: "1px solid rgba(59, 167, 242, 0.4)",
              borderRadius: "100px",
              backdropFilter: "blur(12px)",
              cursor: "pointer",
              outline: "none",
              minHeight: "44px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={e => {
              const b = e.currentTarget;
              b.style.backgroundColor = "rgba(59, 167, 242, 0.25)";
              b.style.borderColor = "rgba(59, 167, 242, 0.7)";
              b.style.color = "#E8F6FF";
            }}
            onMouseLeave={e => {
              const b = e.currentTarget;
              b.style.backgroundColor = "rgba(22, 95, 196, 0.45)";
              b.style.borderColor = "rgba(59, 167, 242, 0.4)";
              b.style.color = "#A5EEE2";
            }}
          >
            Skip to Nav →
          </button>

          {/* ── Scroll hint — bottom-center (visible on early lines) ── */}
          <div style={{
            position: "absolute",
            bottom: "clamp(3.5rem, 7vh, 5rem)",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
            opacity: 0.35,
            zIndex: 5,
            pointerEvents: "none",
          }}>
            <span style={{
              fontFamily: "monospace",
              fontSize: "0.6rem",
              color: "#2E93E8",
              letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
            }}>
              scroll
            </span>
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none" aria-hidden="true">
              <path d="M7 3 L7 17 M3 13 L7 17 L11 13" stroke="#2E93E8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* ════════════════════════════════════════════
              PULL-TO-ENTER circular progress widget
          ════════════════════════════════════════════ */}
          <div
            ref={pullWrapRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: "clamp(5rem, 12vh, 8rem)",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              zIndex: 15,
              pointerEvents: "none",
            }}
          >
            {/* Circular arc */}
            <div style={{ position: "relative", width: 100, height: 100 }}>
              {/* Track ring */}
              <svg
                width="100" height="100"
                viewBox="0 0 100 100"
                style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
              >
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="rgba(22, 95, 196,0.5)"
                  strokeWidth="3"
                />
                <circle
                  ref={pullArcRef}
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="#3BA7F2"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{
                    transition: "stroke-dashoffset 0s",
                  }}
                />
              </svg>
              {/* Center content */}
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
              }}>
                <span
                  ref={pullPctRef}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: "#3BA7F2",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >0</span>
                <span style={{
                  fontFamily: "monospace",
                  fontSize: "0.42rem",
                  color: "#2078D8",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                }}>%</span>
              </div>
            </div>

            {/* Label & Direct Click Button */}
            <div style={{ textAlign: "center", pointerEvents: "auto" }}>
              <span style={{
                fontFamily: "monospace",
                fontSize: "clamp(0.55rem, 1.1vw, 0.68rem)",
                color: "#2E93E8",
                letterSpacing: "0.28em",
                textTransform: "uppercase" as const,
                display: "block",
              }}>
                Keep scrolling or click below
              </span>
              <button
                onClick={() => onCompleteRef.current?.()}
                style={{
                  marginTop: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.75rem 1.8rem",
                  fontFamily: "monospace",
                  fontSize: "clamp(0.68rem, 1.2vw, 0.8rem)",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase" as const,
                  color: "#0B3D91",
                  backgroundColor: "#3BA7F2",
                  border: "none",
                  borderRadius: "100px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={e => {
                  const b = e.currentTarget;
                  b.style.backgroundColor = "#A5EEE2";
                  b.style.transform = "scale(1.05)";
                  b.style.boxShadow = "0 0 30px rgba(59, 167, 242, 0.7)";
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget;
                  b.style.backgroundColor = "#3BA7F2";
                  b.style.transform = "scale(1)";
                  b.style.boxShadow = "0 0 20px rgba(59, 167, 242, 0.4)";
                }}
              >
                Enter Nav Page →
              </button>
            </div>
          </div>




          {/* ════════════════════════════════════════════
              STORY PROGRESS BAR — bottom of sticky viewport
          ════════════════════════════════════════════ */}
          <div ref={barWrapRef} style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            padding: "0 0 clamp(1rem, 2.5vh, 1.6rem)",
          }}>
            {/* Label row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 clamp(1.5rem, 4vw, 3rem)",
              marginBottom: "0.55rem",
            }}>
              <span style={{
                fontFamily: "monospace",
                fontSize: "clamp(0.48rem, 1vw, 0.6rem)",
                color: "#2078D8",
                letterSpacing: "0.22em",
                textTransform: "uppercase" as const,
              }}>
                Story
              </span>
              <span
                ref={barLabelRef}
                style={{
                  fontFamily: "monospace",
                  fontSize: "clamp(0.48rem, 1vw, 0.6rem)",
                  color: "#2E93E8",
                  letterSpacing: "0.15em",
                }}
              >
                0%
              </span>
              <span style={{
                fontFamily: "monospace",
                fontSize: "clamp(0.48rem, 1vw, 0.6rem)",
                color: "#2078D8",
                letterSpacing: "0.22em",
                textTransform: "uppercase" as const,
              }}>
                Next
              </span>
            </div>

            {/* Track */}
            <div style={{
              position: "relative",
              height: "2px",
              margin: "0 clamp(1.5rem, 4vw, 3rem)",
              borderRadius: "2px",
              overflow: "hidden",
              backgroundColor: "rgba(22, 95, 196, 0.5)",
            }}>
              {/* Filled portion */}
              <div
                ref={barFillRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "0%",
                  background: "linear-gradient(to right, #2078D8, #3BA7F2, #7FE7D6)",
                  borderRadius: "2px",
                  willChange: "width",
                  // No transition — updated directly by GSAP scrub onUpdate
                }}
              />
              {/* Glowing leading edge dot */}
              <div
                ref={barDotRef}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "0%",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#7FE7D6",
                  transform: "translate(-50%, -50%)",
                  willChange: "left",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Section names row */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.45rem clamp(1.5rem, 4vw, 3rem) 0",
            }}>
              {["Intro", "Question", "Journey", "Growth", "Begin"].map((label, i, arr) => (
                <span
                  key={label}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "clamp(0.42rem, 0.85vw, 0.52rem)",
                    color: "#165FC4",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase" as const,
                    // hide some labels on narrow screens
                    display: i === 0 || i === arr.length - 1 ? "block" : "var(--label-display, block)",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

        </div>{/* end sticky */}
      </section>

      {/* Keyframe for the chevron pulse */}
      <style>{`
        @keyframes storyChevron {
          0%, 100% { transform: translateX(0);   opacity: 1;    }
          50%       { transform: translateX(3px); opacity: 0.65; }
        }
        @media (max-width: 600px) {
          [data-story-label-mid] { display: none !important; }
        }
      `}</style>
    </>
  );
}
