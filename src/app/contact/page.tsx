"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useRouter } from "next/navigation";
import { usePageTransition } from "@/components/ui/TransitionProvider";
import ContactGlobe from "@/components/ui/ContactGlobe";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { NextPage } from "@/components/ui/next-page";


gsap.registerPlugin(useGSAP);

const CONTACT_LINKS = [
  {
    label: "Direct Email",
    value: "ahmad.barkat.dev@gmail.com",
    href: "mailto:ahmad.barkat.dev@gmail.com",
    ariaLabel: "Send direct email to AHMAD Barkat",
  },
  {
    label: "GitHub",
    value: "github.com/ahmadbarkat",
    href: "https://github.com/ahmadbarkat",
    ariaLabel: "View Ahmad Barkat's GitHub profile and repositories",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/ahmadbarkat",
    href: "https://linkedin.com/in/ahmadbarkat",
    ariaLabel: "Connect with Ahmad Barkat on LinkedIn",
  },
];

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function validate(fields: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!fields.name.trim()) errors.name = "Please enter your name.";
  if (!fields.email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!fields.message.trim()) {
    errors.message = "Please write a brief message.";
  } else if (fields.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters.";
  }
  return errors;
}

export default function ContactPage() {
  const { transitionTo } = usePageTransition();
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);

  const [fields, setFields] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    transitionTo("/", e.currentTarget, "#0B3D91", "NAV");
  };

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText("ahmad.barkat.dev@gmail.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 850));
    router.push("/thank-you");
  };

  // ── Cinematic Entrance Animation (rectangle-wipe style, matches nav pages) ──
  useGSAP(
    () => {
      if (!pageRef.current) return;

      // ── 1. Lock everything invisible at t=0 ──────────────────────────────
      gsap.set(".contact-bg-watermark", { autoAlpha: 0, scale: 1.08 });
      gsap.set(".contact-cover-rect",  { yPercent: 0  }); // full cover rectangle starts covering
      gsap.set([backBtnRef.current, ".contact-top-label"], { autoAlpha: 0, x: -24 });
      gsap.set(".contact-headline-word", { yPercent: 110, skewY: 4 });
      gsap.set(".contact-desc-reveal",   { yPercent: 60, autoAlpha: 0 });
      gsap.set(".contact-left-lower",    { yPercent: 40, autoAlpha: 0 });
      gsap.set(".contact-form-card",     { yPercent: 30, autoAlpha: 0 });
      gsap.set(".contact-globe-wrap",    { scale: 0.82, autoAlpha: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // ── 2. Hold blank for 0.5s ─────────────────────────────────────────
      tl.to({}, { duration: 0.5 });

      // ── 3. Watermark emerges alone ─────────────────────────────────────
      tl.to(
        ".contact-bg-watermark",
        { autoAlpha: 1, scale: 1, duration: 1.1, ease: "power3.out" }
      );

      // ── 4. Rectangle cover wipes UP off the screen (nav-page style) ────
      // The cover rect starts at yPercent: 0 (fully covering page)
      // and animates to yPercent: -101 (slides out the top)
      tl.to(
        ".contact-cover-rect",
        { yPercent: -101, duration: 0.9, ease: "power4.inOut" },
        "-=0.55" // overlap with watermark reveal
      );

      // ── 5. Header bar slides in from left as rect leaves ───────────────
      tl.to(
        [backBtnRef.current, ".contact-top-label"],
        { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" },
        "-=0.45"
      );

      // ── 6. Headline words clip-reveal (each word behind its own mask) ──
      tl.to(
        ".contact-headline-word",
        { yPercent: 0, skewY: 0, duration: 0.75, stagger: 0.1, ease: "power3.out" },
        "-=0.5"
      );

      // ── 7. Description paragraph wipes in ──────────────────────────────
      tl.to(
        ".contact-desc-reveal",
        { yPercent: 0, autoAlpha: 1, duration: 0.65, ease: "power3.out" },
        "-=0.45"
      );

      // ── 8. Lower-left content (email / channels) slides up ─────────────
      tl.to(
        ".contact-left-lower",
        { yPercent: 0, autoAlpha: 1, duration: 0.65, ease: "power3.out" },
        "-=0.4"
      );

      // ── 9. Globe scales in ─────────────────────────────────────────────
      tl.to(
        ".contact-globe-wrap",
        { scale: 1, autoAlpha: 1, duration: 0.8, ease: "power3.out" },
        "-=0.55"
      );

      // ── 10. Form card wipes up ─────────────────────────────────────────
      tl.to(
        ".contact-form-card",
        { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out" },
        "-=0.6"
      );
    },
    { scope: pageRef }

  );

  return (
    <>
    <main
      ref={pageRef}
      style={{
        minHeight: "100vh",
        background: "#0B3D91",
        display: "flex",
        flexDirection: "column",
        color: "#E8F6FF",
        position: "relative",
        overflowX: "hidden",
        width: "100%",
      }}
    >
      {/* Background Subtle Gradient */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(circle at 85% 60%, rgba(59, 167, 242, 0.08) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Cinematic Cover Rectangle (wipes UP off screen on entrance) ── */}
      <div
        className="contact-cover-rect"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "#0B3D91",
          zIndex: 200,
          pointerEvents: "none",
          transformOrigin: "top center",
        }}
      />

      {/* Giant Background Watermark */}
      <h1
        className="contact-bg-watermark"
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "clamp(5.5rem, 22vw, 19rem)",
          fontWeight: 900,
          fontFamily: "'Arial Black', sans-serif",
          WebkitTextStroke: "1.5px rgba(59, 167, 242, 0.07)",
          color: "transparent",
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "0.05em",
          margin: 0,
        }}
      >
        CONTACT
      </h1>

      {/* Top Bar with Safe Right Margin for Hamburger Button */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "clamp(1.5rem, 4vh, 2.5rem) clamp(2rem, 5vw, 5rem)",
          // Sit clear of the docked nav tab
          paddingTop: "calc(clamp(1.5rem, 4vh, 2.5rem) + var(--nav-dock-clearance))",
          position: "relative",
          zIndex: 10,
          flexWrap: "wrap",
          gap: "1rem",
          width: "100%",
        }}
      >
        {/* Back Button with Curtain Sweep */}
        <button
          ref={backBtnRef}
          onClick={handleBackClick}
          aria-label="Back to navigation"
          className="group relative overflow-hidden"
          style={{
            background: "rgba(15, 74, 163, 0.7)",
            border: "1px solid rgba(59, 167, 242, 0.35)",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "system-ui, sans-serif",
            fontSize: "clamp(0.68rem, 1.2vw, 0.8rem)",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#3BA7F2",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.65rem 1.3rem",
            backdropFilter: "blur(10px)",
            transition: "border-color 0.3s ease, color 0.3s ease",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget;
            btn.style.borderColor = "#3BA7F2";
            btn.style.color = "#0B3D91";
            const curtain = btn.querySelector(".btn-curtain") as HTMLElement;
            if (curtain) curtain.style.transform = "translateY(0%)";
            const arrow = btn.querySelector(".btn-arrow") as HTMLElement;
            if (arrow) arrow.style.transform = "translateX(-4px)";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget;
            btn.style.borderColor = "rgba(59, 167, 242, 0.35)";
            btn.style.color = "#3BA7F2";
            const curtain = btn.querySelector(".btn-curtain") as HTMLElement;
            if (curtain) curtain.style.transform = "translateY(100%)";
            const arrow = btn.querySelector(".btn-arrow") as HTMLElement;
            if (arrow) arrow.style.transform = "translateX(0px)";
          }}
        >
          {/* Fill Curtain Layer */}
          <span
            className="btn-curtain"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#3BA7F2",
              transform: "translateY(100%)",
              transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          <svg
            className="btn-arrow"
            width="18"
            height="10"
            viewBox="0 0 20 10"
            fill="none"
            aria-hidden="true"
            style={{
              position: "relative",
              zIndex: 1,
              transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <path
              d="M19 5H1M1 5L5 1M1 5L5 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ position: "relative", zIndex: 1 }}>BACK TO NAV</span>
        </button>

        {/* Chapter label with safe right margin */}
        <div
          className="contact-top-label"
          style={{
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: "clamp(0.85rem, 1.8vw, 1.3rem)",
            fontWeight: 900,
            color: "#5FC7E4",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginRight: "clamp(3.8rem, 5.5vw, 5rem)",
          }}
        >
          CHAPTER // 05 — CONTACT
        </div>
      </header>

      {/* Expansive Edge-to-Edge Composition */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gridTemplateRows: "1fr",
          alignItems: "center",
          padding: "clamp(1rem, 3vh, 2.5rem) clamp(2rem, 5vw, 5rem) clamp(3.5rem, 7vh, 5rem)",
          position: "relative",
          zIndex: 1,
          flex: 1,
          width: "100%",
          gap: "0",
          minHeight: "70vh",
        }}
      >
        {/* Left Side: Massive Typography + Narrative + Direct Channels */}
        <div
          className="contact-left-content"
          style={{
            justifySelf: "start",
            width: "100%",
            maxWidth: "720px",
            display: "flex",
            flexDirection: "column",
            gap: "2.2rem",
          }}
        >
          <div>
            <h2
              className="contact-headline-text"
              style={{
                fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
                fontSize: "clamp(2.5rem, 5vw, 5.4rem)",
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                margin: 0,
                wordBreak: "break-word",
                overflow: "hidden",
              }}
            >
              {/* Each line wrapped in a clip mask so the word slides up from behind */}
              <div style={{ overflow: "hidden", lineHeight: 1.05 }}>
                <span className="contact-headline-word" style={{ display: "block", color: "#E8F6FF" }}>LET&apos;S BUILD</span>
              </div>
              <div style={{ overflow: "hidden", lineHeight: 1.05 }}>
                <span className="contact-headline-word" style={{ display: "block", color: "#3BA7F2" }}>SOMETHING</span>
              </div>
              <div style={{ overflow: "hidden", lineHeight: 1.05 }}>
                <span className="contact-headline-word" style={{ display: "block", color: "#5FC7E4" }}>REMARKABLE.</span>
              </div>
            </h2>

            <div style={{ overflow: "hidden", marginTop: "1.6rem" }}>
              <p
                className="contact-desc-reveal"
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "clamp(0.95rem, 1.25vw, 1.1rem)",
                  color: "rgba(232, 246, 255, 0.88)",
                  lineHeight: 1.8,
                  margin: 0,
                  maxWidth: "580px",
                }}
              >
                Great work always begins with an honest conversation. Whether you&apos;re envisioning
                a bold digital experience, seeking technical engineering guidance, or simply want to
                connect — my inbox is always open.
              </p>
            </div>
          </div>

          {/* Quick Direct Email Card + Channels — wrapped for reveal */}
          <div className="contact-left-lower" style={{ display: "flex", flexDirection: "column", gap: "2.2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(15, 74, 163, 0.65)",
              border: "1.5px solid rgba(59, 167, 242, 0.25)",
              borderRadius: 12,
              padding: "1.1rem 1.4rem",
              backdropFilter: "blur(12px)",
              flexWrap: "wrap",
              gap: "0.8rem",
              maxWidth: "580px",
              transition: "border-color 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(59, 167, 242, 0.6)";
              const line = e.currentTarget.querySelector(".email-underline") as HTMLElement;
              if (line) line.style.transform = "scaleX(1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(59, 167, 242, 0.25)";
              const line = e.currentTarget.querySelector(".email-underline") as HTMLElement;
              if (line) line.style.transform = "scaleX(0)";
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  fontFamily: "system-ui, monospace",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#3BA7F2",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                DIRECT DISPATCH
              </span>
              <div style={{ position: "relative", display: "inline-block", marginTop: "0.2rem" }}>
                <span
                  style={{
                    display: "block",
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "clamp(0.92rem, 1.25vw, 1.05rem)",
                    color: "#E8F6FF",
                    fontWeight: 600,
                  }}
                >
                  ahmad.barkat.dev@gmail.com
                </span>
                <span
                  className="email-underline"
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: -2,
                    width: "100%",
                    height: "1.5px",
                    backgroundColor: "#3BA7F2",
                    transform: "scaleX(0)",
                    transformOrigin: "left center",
                    transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyEmail}
              style={{
                position: "relative",
                overflow: "hidden",
                background: copied ? "#3BA7F2" : "rgba(59, 167, 242, 0.15)",
                color: copied ? "#0B3D91" : "#3BA7F2",
                border: "1px solid rgba(59, 167, 242, 0.35)",
                borderRadius: 8,
                padding: "0.55rem 1.1rem",
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.76rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.backgroundColor = "#3BA7F2";
                  e.currentTarget.style.color = "#0B3D91";
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.backgroundColor = "rgba(59, 167, 242, 0.15)";
                  e.currentTarget.style.color = "#3BA7F2";
                }
              }}
            >
              {copied ? "COPIED ✓" : "COPY EMAIL"}
            </button>
          </div>

          {/* Direct Channels */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxWidth: "580px" }}>
            <span
              style={{
                fontFamily: "system-ui, monospace",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#5FC7E4",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              CHANNELS
            </span>

            {CONTACT_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.ariaLabel}
                className="channel-card-link"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(15, 74, 163, 0.55)",
                  border: "1.5px solid rgba(59, 167, 242, 0.22)",
                  borderRadius: 12,
                  padding: "0.95rem 1.3rem",
                  textDecoration: "none",
                  backdropFilter: "blur(10px)",
                  overflow: "hidden",
                  transition: "border-color 0.3s ease, background-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  const card = e.currentTarget;
                  card.style.borderColor = "rgba(59, 167, 242, 0.7)";
                  card.style.backgroundColor = "rgba(17, 83, 176, 0.85)";

                  const notch = card.querySelector(".channel-notch") as HTMLElement;
                  if (notch) notch.style.transform = "scaleY(1)";

                  const content = card.querySelector(".channel-content") as HTMLElement;
                  if (content) content.style.transform = "translateX(8px)";

                  const arrow = card.querySelector(".channel-arrow") as HTMLElement;
                  if (arrow) {
                    arrow.style.transform = "translate(3px, -3px)";
                    arrow.style.color = "#E8F6FF";
                  }
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget;
                  card.style.borderColor = "rgba(59, 167, 242, 0.22)";
                  card.style.backgroundColor = "rgba(15, 74, 163, 0.55)";

                  const notch = card.querySelector(".channel-notch") as HTMLElement;
                  if (notch) notch.style.transform = "scaleY(0)";

                  const content = card.querySelector(".channel-content") as HTMLElement;
                  if (content) content.style.transform = "translateX(0px)";

                  const arrow = card.querySelector(".channel-arrow") as HTMLElement;
                  if (arrow) {
                    arrow.style.transform = "translate(0px, 0px)";
                    arrow.style.color = "#3BA7F2";
                  }
                }}
              >
                <span
                  className="channel-notch"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3.5,
                    backgroundColor: "#3BA7F2",
                    transform: "scaleY(0)",
                    transformOrigin: "center center",
                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />

                <div
                  className="channel-content"
                  style={{
                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontFamily: "system-ui, sans-serif",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#3BA7F2",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    {link.label}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontFamily: "system-ui, sans-serif",
                      fontSize: "clamp(0.85rem, 1.15vw, 0.98rem)",
                      color: "#E8F6FF",
                      marginTop: "0.2rem",
                    }}
                  >
                    {link.value}
                  </span>
                </div>

                <span
                  className="channel-arrow"
                  aria-hidden="true"
                  style={{
                    fontSize: "1.2rem",
                    color: "#3BA7F2",
                    fontWeight: 700,
                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease",
                  }}
                >
                  ↗
                </span>
              </a>
            ))}
          </div>

          {/* Location & Status Note */}
          <div
            style={{
              paddingTop: "0.6rem",
              borderTop: "1px solid rgba(59, 167, 242, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              maxWidth: "580px",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#3BA7F2",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.82rem",
                color: "rgba(232, 246, 255, 0.8)",
              }}
            >
              Based in Lahore, Pakistan &nbsp;•&nbsp; Available for remote projects worldwide
            </span>
          </div>
        </div>

        {/* Centre: Cinematic 3D Globe */}
        <div
          style={{
            width: "clamp(340px, 30vw, 520px)",
            height: "clamp(340px, 30vw, 520px)",
            alignSelf: "center",
            justifySelf: "center",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <ContactGlobe />
        </div>

        {/* Right Side: Anchored to the Right Margin (Form Card) */}
        <div
          className="contact-form-card"
          style={{
            justifySelf: "end",
            width: "100%",
            maxWidth: "520px",
            background: "rgba(15, 74, 163, 0.65)",
            border: "1.5px solid rgba(59, 167, 242, 0.25)",
            borderRadius: 16,
            padding: "clamp(1.6rem, 3.5vw, 2.4rem)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
          }}
        >
          <h3
            style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: "clamp(1.2rem, 2.2vw, 1.6rem)",
              fontWeight: 900,
              color: "#E8F6FF",
              margin: "0 0 1.5rem 0",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            SEND A MESSAGE
          </h3>

          <form
            id="contact-form"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Contact form"
            style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
          >
            {/* Name */}
            <div>
              <label
                htmlFor="contact-name"
                style={{
                  display: "block",
                  fontFamily: "system-ui, monospace",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#5FC7E4",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginBottom: "0.45rem",
                }}
              >
                YOUR NAME
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="What is your name?"
                value={fields.name}
                onChange={handleChange}
                aria-invalid={!!errors.name}
                style={{
                  width: "100%",
                  background: "rgba(11, 61, 145, 0.7)",
                  border: `1.5px solid ${errors.name ? "#3BA7F2" : "rgba(59, 167, 242, 0.25)"}`,
                  borderRadius: 10,
                  padding: "0.85rem 1rem",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "0.94rem",
                  color: "#E8F6FF",
                  outline: "none",
                  transition: "border-color 0.25s ease, background-color 0.25s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3BA7F2";
                  e.currentTarget.style.backgroundColor = "rgba(15, 74, 163, 0.9)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.name
                    ? "#3BA7F2"
                    : "rgba(59, 167, 242, 0.25)";
                  e.currentTarget.style.backgroundColor = "rgba(11, 61, 145, 0.7)";
                }}
              />
              {errors.name && (
                <p
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "0.72rem",
                    color: "#3BA7F2",
                    marginTop: "0.35rem",
                  }}
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="contact-email"
                style={{
                  display: "block",
                  fontFamily: "system-ui, monospace",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#5FC7E4",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginBottom: "0.45rem",
                }}
              >
                YOUR EMAIL
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={fields.email}
                onChange={handleChange}
                aria-invalid={!!errors.email}
                style={{
                  width: "100%",
                  background: "rgba(11, 61, 145, 0.7)",
                  border: `1.5px solid ${errors.email ? "#3BA7F2" : "rgba(59, 167, 242, 0.25)"}`,
                  borderRadius: 10,
                  padding: "0.85rem 1rem",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "0.94rem",
                  color: "#E8F6FF",
                  outline: "none",
                  transition: "border-color 0.25s ease, background-color 0.25s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3BA7F2";
                  e.currentTarget.style.backgroundColor = "rgba(15, 74, 163, 0.9)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.email
                    ? "#3BA7F2"
                    : "rgba(59, 167, 242, 0.25)";
                  e.currentTarget.style.backgroundColor = "rgba(11, 61, 145, 0.7)";
                }}
              />
              {errors.email && (
                <p
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "0.72rem",
                    color: "#3BA7F2",
                    marginTop: "0.35rem",
                  }}
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Subject / Service Interest */}
            <div>
              <label
                htmlFor="contact-subject"
                style={{
                  display: "block",
                  fontFamily: "system-ui, monospace",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#5FC7E4",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginBottom: "0.45rem",
                }}
              >
                PROJECT TYPE OR TOPIC
              </label>
              <select
                id="contact-subject"
                name="subject"
                value={fields.subject}
                onChange={handleChange}
                style={{
                  width: "100%",
                  background: "#0B3D91",
                  border: "1.5px solid rgba(59, 167, 242, 0.25)",
                  borderRadius: 10,
                  padding: "0.85rem 1rem",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "0.94rem",
                  color: "#E8F6FF",
                  outline: "none",
                  cursor: "pointer",
                  transition: "border-color 0.25s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3BA7F2";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59, 167, 242, 0.25)";
                }}
              >
                <option value="" style={{ background: "#0B3D91", color: "#E8F6FF" }}>
                  General Inquiry / Say Hello
                </option>
                <option value="Web Application" style={{ background: "#0B3D91", color: "#E8F6FF" }}>
                  Web Application Development
                </option>
                <option value="Creative Frontend" style={{ background: "#0B3D91", color: "#E8F6FF" }}>
                  Creative Frontend & Interactive Experience
                </option>
                <option value="Architecture & Consulting" style={{ background: "#0B3D91", color: "#E8F6FF" }}>
                  UI Architecture & Technical Consulting
                </option>
                <option value="Full-Time / Contract" style={{ background: "#0B3D91", color: "#E8F6FF" }}>
                  Full-Time or Contract Opportunity
                </option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="contact-message"
                style={{
                  display: "block",
                  fontFamily: "system-ui, monospace",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#5FC7E4",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginBottom: "0.45rem",
                }}
              >
                YOUR MESSAGE
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                placeholder="Tell me about your project, goals, or questions…"
                value={fields.message}
                onChange={handleChange}
                aria-invalid={!!errors.message}
                style={{
                  width: "100%",
                  background: "rgba(11, 61, 145, 0.7)",
                  border: `1.5px solid ${errors.message ? "#3BA7F2" : "rgba(59, 167, 242, 0.25)"}`,
                  borderRadius: 10,
                  padding: "0.85rem 1rem",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "0.94rem",
                  lineHeight: 1.6,
                  color: "#E8F6FF",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "120px",
                  transition: "border-color 0.25s ease, background-color 0.25s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3BA7F2";
                  e.currentTarget.style.backgroundColor = "rgba(15, 74, 163, 0.9)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.message
                    ? "#3BA7F2"
                    : "rgba(59, 167, 242, 0.25)";
                  e.currentTarget.style.backgroundColor = "rgba(11, 61, 145, 0.7)";
                }}
              />
              {errors.message && (
                <p
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "0.72rem",
                    color: "#3BA7F2",
                    marginTop: "0.35rem",
                  }}
                >
                  {errors.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                position: "relative",
                overflow: "hidden",
                background: submitting ? "rgba(59, 167, 242, 0.5)" : "#3BA7F2",
                color: "#0B3D91",
                border: "1px solid #3BA7F2",
                borderRadius: 10,
                fontFamily: "system-ui, sans-serif",
                fontSize: "clamp(0.82rem, 1.2vw, 0.92rem)",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "0.95rem 1.8rem",
                cursor: submitting ? "not-allowed" : "pointer",
                marginTop: "0.4rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                transition: "border-color 0.3s ease, color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  const btn = e.currentTarget;
                  btn.style.color = "#E8F6FF";
                  const curtain = btn.querySelector(".submit-curtain") as HTMLElement;
                  if (curtain) curtain.style.transform = "translateY(0%)";
                  const arrow = btn.querySelector(".submit-arrow") as HTMLElement;
                  if (arrow) arrow.style.transform = "translateX(5px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  const btn = e.currentTarget;
                  btn.style.color = "#0B3D91";
                  const curtain = btn.querySelector(".submit-curtain") as HTMLElement;
                  if (curtain) curtain.style.transform = "translateY(100%)";
                  const arrow = btn.querySelector(".submit-arrow") as HTMLElement;
                  if (arrow) arrow.style.transform = "translateX(0px)";
                }
              }}
            >
              <span
                className="submit-curtain"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "#0F4AA3",
                  transform: "translateY(100%)",
                  transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              />

              <span style={{ position: "relative", zIndex: 1 }}>
                {submitting ? "SENDING MESSAGE…" : "SEND MESSAGE"}
              </span>
              {!submitting && (
                <span
                  className="submit-arrow"
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    fontSize: "1.1rem",
                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  →
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
      </div>
    </main>

    {/* Testimonials // client words drifting up in columns */}
    <TestimonialsSection background="#0B3D91" />

    {/* Footer // curtain reveal with the closing call to action */}
    <CinematicFooter />

    {/* Keep scrolling // the story rises over the footer and opens */}
    <NextPage href="/story" title="Story" meta="The interactive experience" image="/laptop/001.png" />
    </>
  );
}
