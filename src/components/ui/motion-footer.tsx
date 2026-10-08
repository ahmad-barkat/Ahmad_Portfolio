"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { usePathname } from "next/navigation";

import ButtonWithIcon from "@/components/ui/button-with-icon";
import { TextRoll } from "@/components/ui/TextRoll";
import { usePageTransition } from "@/components/ui/TransitionProvider";
import { useLenis } from "@/components/ui/LenisProvider";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/Logo";
import { EMAIL_HREF, GITHUB_URL, LINKEDIN_URL, WHATSAPP_HREF } from "@/data/contact";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const MARQUEE = [
  "Full-Stack Development",
  "UI/UX & Interface Design",
  "Motion & Scroll Animation",
  "3D & WebGL Experiences",
  "Performance & SEO",
  "Available for new projects",
];

interface FooterLinkItem {
  label: string;
  href: string;
  /** Page-transition colour for internal routes */
  color?: string;
  external?: boolean;
}

const EXPLORE: FooterLinkItem[] = [
  { label: "Home", href: "/home", color: "#3BA7F2" },
  { label: "Projects", href: "/projects", color: "#2E93E8" },
  { label: "Hire me", href: "/hire", color: "#3BA7F2" },
  { label: "Contact", href: "/contact", color: "#3BA7F2" },
];

const ELSEWHERE: FooterLinkItem[] = [
  { label: "WhatsApp", href: WHATSAPP_HREF, external: true },
  { label: "LinkedIn", href: LINKEDIN_URL, external: true },
  { label: "GitHub", href: GITHUB_URL, external: true },
];

const LEGAL: FooterLinkItem[] = [
  { label: "Privacy", href: "/privacy", color: "#0B3D91" },
  { label: "Terms", href: "/terms", color: "#0B3D91" },
];

// -------------------------------------------------------------------------
// Magnetic: pulls its child towards the cursor, springs back on leave.
// Mouse only, and off with reduced motion.
// -------------------------------------------------------------------------
function Magnetic({ children, strength = 0.28 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Measured without the pull, so the offset doesn't feed back on itself
    let cx = 0;
    let cy = 0;
    const enter = () => {
      const r = el.getBoundingClientRect();
      cx = r.left + r.width / 2 - Number(gsap.getProperty(el, "x"));
      cy = r.top + r.height / 2 - Number(gsap.getProperty(el, "y"));
    };
    const move = (e: PointerEvent) => {
      gsap.to(el, {
        x: (e.clientX - cx) * strength,
        y: (e.clientY - cy) * strength,
        duration: 0.45,
        ease: "power3.out",
        overwrite: "auto",
      });
    };
    const leave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.35)", overwrite: "auto" });
    };

    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(el);
    };
  }, [strength]);

  return (
    <span ref={ref} className="ftr-magnetic">
      {children}
    </span>
  );
}

// -------------------------------------------------------------------------
// The footer's one link style: mono caps with the site's letter roll
// -------------------------------------------------------------------------
function FooterLink({
  item,
  className,
  onNavigate,
  children,
}: {
  item: FooterLinkItem;
  className?: string;
  onNavigate: (item: FooterLinkItem, el: HTMLElement) => void;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={item.href}
      className={cn("ftr-link", className)}
      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={(e) => {
        if (item.external || item.href.startsWith("mailto:")) return;
        e.preventDefault();
        onNavigate(item, e.currentTarget);
      }}
    >
      <TextRoll className="ftr-link__roll" style={{ lineHeight: 1.25 }}>
        {item.label}
      </TextRoll>
      {children}
    </a>
  );
}

const MarqueeRun = () => (
  <div className="ftr-marquee__run" aria-hidden="true">
    {MARQUEE.map((t, i) => (
      <React.Fragment key={t}>
        <span>{t}</span>
        <i style={{ color: i % 2 ? "#3BA7F2" : "#7FE7D6" }}>✦</i>
      </React.Fragment>
    ))}
  </div>
);

/**
 * Curtain footer. The wrapper sits in normal flow and clips; the footer
 * inside is fixed to the viewport, so the page above slides off it like a
 * curtain. On short screens it falls back to a normal block (see globals.css).
 */
export function CinematicFooter() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { transitionTo } = usePageTransition();
  const lenis = useLenis();
  const pathname = usePathname();
  const onContact = pathname === "/contact";
  // No link to the page you're already on
  const notHere = (l: FooterLinkItem) => l.href !== pathname;

  // The fixed layer only paints, and its loops only run, near the viewport
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(
      ([entry]) => wrap.setAttribute("data-live", String(entry.isIntersecting)),
      { rootMargin: "25% 0px 25% 0px" },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const wrap = wrapRef.current!;

        gsap.fromTo(
          ".ftr-giant__word",
          { yPercent: 28, scale: 0.86, autoAlpha: 0 },
          {
            yPercent: 0,
            scale: 1,
            autoAlpha: 1,
            ease: "power1.out",
            scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom bottom", scrub: 1 },
          },
        );

        gsap.fromTo(
          ".ftr-title__line > span",
          { yPercent: 110 },
          {
            yPercent: 0,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: wrap, start: "top 70%", end: "bottom bottom", scrub: 1 },
          },
        );

        gsap.fromTo(
          "[data-ftr-fade]",
          { y: 36, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: wrap, start: "top 55%", end: "bottom bottom", scrub: 1 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: wrapRef },
  );

  const navigate = (item: FooterLinkItem, el: HTMLElement) => {
    transitionTo(item.href, el, item.color ?? "#3BA7F2", item.label.toUpperCase());
  };

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Already on the contact page: take the visitor to its form instead
    const form = onContact ? document.getElementById("contact-form") : null;
    if (form) {
      if (lenis) lenis.scrollTo(form, { offset: -120, duration: 2 });
      else form.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    transitionTo("/contact", e.currentTarget, "#3BA7F2", "CONTACT");
  };

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (lenis) lenis.scrollTo(0, reduce ? { immediate: true } : { duration: 2.4 });
    else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div ref={wrapRef} className="ftr-wrap" data-live="false">
      <footer className="ftr" aria-labelledby="ftr-title">
        {/* Ambient light, grid, and the shade the page above casts */}
        <div aria-hidden="true" className="ftr-aurora" />
        <div aria-hidden="true" className="ftr-grid" />
        <div aria-hidden="true" className="ftr-shade" />

        <div aria-hidden="true" className="ftr-giant">
          <span className="ftr-giant__word">AHMAD</span>
        </div>

        {/* Tilted services band */}
        <div className="ftr-marquee">
          <div className="ftr-marquee__track">
            <MarqueeRun />
            <MarqueeRun />
          </div>
        </div>

        {/* Call to action */}
        <div className="ftr-main">
          <div data-ftr-fade className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-8 h-[1px] bg-[#3BA7F2]" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#3BA7F2] font-bold">
              Contact // What&apos;s next
            </span>
            <span className="w-8 h-[1px] bg-[#3BA7F2]" />
          </div>

          <h2 id="ftr-title" className="ftr-title font-sans font-black uppercase tracking-tighter">
            <span className="ftr-title__line">
              <span>Have an idea?</span>
            </span>
            <span className="ftr-title__line">
              <span>
                Let&apos;s build it<em>.</em>
              </span>
            </span>
          </h2>

          <p data-ftr-fade className="ftr-lede">
            Tell me what you&apos;re making. I read every message and reply personally.
          </p>

          <div data-ftr-fade className="ftr-cta">
            <Magnetic>
              <ButtonWithIcon onClick={handleStart}>
                {onContact ? "Write to me" : "Start your project"}
              </ButtonWithIcon>
            </Magnetic>
            <FooterLink
              item={{ label: "Write me an email", href: EMAIL_HREF }}
              onNavigate={navigate}
            />
          </div>

          <nav data-ftr-fade className="ftr-links" aria-label="Footer">
            <div className="ftr-links__group">
              <span className="ftr-links__label">Explore</span>
              {EXPLORE.filter(notHere).map((l) => (
                <FooterLink key={l.href} item={l} onNavigate={navigate} />
              ))}
            </div>
            <span aria-hidden="true" className="ftr-links__rule" />
            <div className="ftr-links__group">
              <span className="ftr-links__label">Elsewhere</span>
              {ELSEWHERE.map((l) => (
                <FooterLink key={l.href} item={l} onNavigate={navigate} />
              ))}
            </div>
          </nav>
        </div>

        {/* Credits */}
        <div className="ftr-bar">
          <div className="ftr-bar__legal">
            <span className="ftr-bar__brand">
              <LogoMark />
              © {new Date().getFullYear()} Ahmad Barkat
            </span>
            {LEGAL.filter(notHere).map((l) => (
              <FooterLink key={l.href} item={l} onNavigate={navigate} />
            ))}
          </div>

          <span className="ftr-bar__status">
            Available for new projects
          </span>

          <FooterLink item={{ label: "Back to top", href: "#top" }} className="ftr-link--top" onNavigate={toTop}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0-6 6m6-6 6 6" />
            </svg>
          </FooterLink>
        </div>
      </footer>
    </div>
  );
}

export default CinematicFooter;
