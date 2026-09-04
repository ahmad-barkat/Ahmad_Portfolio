"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
    { label: "commits", value: "300+" },
    { label: "projects", value: "12" },
    { label: "experience", value: "3 yrs" },
    { label: "clients", value: "20+" },
    { label: "uptime", value: "99.9%" },
];

const SNIPPETS = [
    { lines: ["const build = () => {", "  return passion++;", "}"] },
    { lines: ["git commit -m", '"shipped it 🚀"'] },
    { lines: ["while (learning) {", "  level++;", "}"] },
];

const TECH = [
    "React", "Next.js", "TypeScript", "Node.js", "GSAP",
    "Tailwind", "MongoDB", "PostgreSQL", "Docker", "AWS",
    "React", "Next.js", "TypeScript", "Node.js", "GSAP",
    "Tailwind", "MongoDB", "PostgreSQL", "Docker", "AWS",
];

export default function LaptopScrollDecorations() {
    const wrapRef = useRef<HTMLDivElement>(null);
    const pillsRef = useRef<(HTMLDivElement | null)[]>([]);
    const timelineRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
    const orbitRef = useRef<HTMLDivElement>(null);
    const ringsRef = useRef<(HTMLDivElement | null)[]>([]);
    const marqueeRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        // Find the parent laptop-section 
        const wrap = wrapRef.current;
        if (!wrap) return;
        const section = wrap.closest(".laptop-section") as HTMLElement | null;
        sectionRef.current = section;
        if (!section) return;

        const ctx = gsap.context(() => {

            // ── Shared scrub timeline ──────────────────────────────────────────────
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1.2,
                },
            });

            // ── LEFT: Timeline line ────────────────────────────────────────────────
            if (timelineRef.current) {
                gsap.set(timelineRef.current, { scaleY: 0, transformOrigin: "top center" });
                tl.to(timelineRef.current, { scaleY: 1, duration: 0.5, ease: "none" }, 0);
            }

            // ── LEFT: Stat pills ──────────────────────────────────────────────────
            const pills = pillsRef.current.filter(Boolean) as HTMLDivElement[];
            if (pills.length) {
                gsap.set(pills, { x: -60, autoAlpha: 0 });
                tl.to(
                    pills,
                    { x: 0, autoAlpha: 1, duration: 0.08, stagger: 0.06, ease: "power2.out" },
                    0.02
                );
                tl.to(
                    pills,
                    { x: -80, autoAlpha: 0, duration: 0.07, stagger: 0.04, ease: "power2.in" },
                    0.7
                );
            }

            // ── RIGHT: Code snippet cards ──────────────────────────────────────────
            const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
            if (cards.length) {
                gsap.set(cards, { x: 80, autoAlpha: 0 });
                tl.to(
                    cards,
                    {
                        x: 0,
                        autoAlpha: 1,
                        yPercent: (i: number) => i * -18,  // staggered vertical parallax
                        duration: 0.1,
                        stagger: 0.07,
                        ease: "power3.out",
                    },
                    0.05
                );
                tl.to(
                    cards,
                    { x: 100, autoAlpha: 0, duration: 0.08, stagger: 0.05, ease: "power2.in" },
                    0.72
                );
            }

            // ── RIGHT: Orbit ring ──────────────────────────────────────────────────
            if (orbitRef.current) {
                gsap.set(orbitRef.current, { scale: 0.4, autoAlpha: 0 });
                tl.to(orbitRef.current, { scale: 1, autoAlpha: 0.6, duration: 0.3, ease: "back.out(1.4)" }, 0.1);
                tl.to(orbitRef.current, { scale: 1.4, autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0.75);
            }

            // ── CENTER: Pulse rings ────────────────────────────────────────────────
            const rings = ringsRef.current.filter(Boolean) as HTMLDivElement[];
            if (rings.length) {
                gsap.set(rings, { scale: 0, autoAlpha: 0 });
                tl.to(
                    rings,
                    { scale: 1, autoAlpha: 0.18, duration: 0.15, stagger: 0.05, ease: "power2.out" },
                    0.25
                );
                tl.to(
                    rings,
                    { scale: 1.6, autoAlpha: 0, duration: 0.12, stagger: 0.04, ease: "power2.in" },
                    0.65
                );
            }

            // ── BOTTOM: Tech marquee driven by scroll velocity ────────────────────
            if (marqueeRef.current) {
                const inner = marqueeRef.current.querySelector(".lsd-marquee-inner") as HTMLElement | null;
                if (inner) {
                    let velocity = 0;
                    let baseX = 0;
                    let lastProgress = 0;

                    ScrollTrigger.create({
                        trigger: section,
                        start: "top top",
                        end: "bottom bottom",
                        onUpdate(self) {
                            const delta = Math.abs(self.progress - lastProgress);
                            velocity = Math.min(delta * 8000, 200);
                            lastProgress = self.progress;
                            baseX -= velocity * 0.3;
                            // Loop back
                            const w = inner.offsetWidth / 2;
                            if (Math.abs(baseX) >= w) baseX = 0;
                            gsap.set(inner, { x: baseX });
                        },
                    });

                    // Continuous slow base scroll via RAF
                    let x = 0;
                    let rafId: number;
                    const tick = () => {
                        x -= 0.4;
                        const w = inner.offsetWidth / 2;
                        if (Math.abs(x) >= w) x = 0;
                        gsap.set(inner, { x });
                        rafId = requestAnimationFrame(tick);
                    };
                    rafId = requestAnimationFrame(tick);

                    return () => cancelAnimationFrame(rafId);
                }
            }
        }, section);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={wrapRef} className="lsd-wrap" aria-hidden="true">

            {/* ── LEFT SIDE ── */}
            <div className="lsd-left">
                {/* Timeline line */}
                <div ref={timelineRef} className="lsd-timeline-line" />

                {/* Stat pills */}
                <div className="lsd-pills">
                    {STATS.map((s, i) => (
                        <div
                            key={i}
                            ref={el => { pillsRef.current[i] = el; }}
                            className="lsd-pill"
                        >
                            <span className="lsd-pill-value">{s.value}</span>
                            <span className="lsd-pill-label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── RIGHT SIDE ── */}
            <div className="lsd-right">
                {/* Orbit ring */}
                <div ref={orbitRef} className="lsd-orbit" />

                {/* Code snippet cards */}
                <div className="lsd-cards">
                    {SNIPPETS.map((s, i) => (
                        <div
                            key={i}
                            ref={el => { cardsRef.current[i] = el; }}
                            className="lsd-card"
                        >
                            {s.lines.map((line, li) => (
                                <div key={li} className="lsd-card-line">{line}</div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── CENTER: Pulse rings ── */}
            <div className="lsd-rings">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        ref={el => { ringsRef.current[i] = el; }}
                        className="lsd-ring"
                        style={{ width: `${220 + i * 120}px`, height: `${220 + i * 120}px` }}
                    />
                ))}
            </div>

            {/* ── BOTTOM: Tech marquee ── */}
            <div ref={marqueeRef} className="lsd-marquee">
                <div className="lsd-marquee-inner">
                    {TECH.map((t, i) => (
                        <span key={i} className="lsd-marquee-item">{t}</span>
                    ))}
                </div>
            </div>

        </div>
    );
}
