"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import HeadingReveal from "@/components/ui/HeadingReveal";
import RevealText from "@/components/ui/RevealText";
import { TextRoll } from "@/components/ui/TextRoll";
import ButtonWithIcon from "@/components/ui/button-with-icon";
import JpTerm from "@/components/ui/jp-term";
import { SendButton, SentToast, flyPaperPlane, type SendState } from "@/components/ui/send-flight";
import { CalendlyEmbed } from "@/components/ui/calendly-embed";
import { GenjutsuReveal } from "@/components/ui/genjutsu-reveal";
import { useDragonBrushPx } from "@/components/ui/reveal-presets";
import { usePageReady } from "@/components/ui/page-ready";
import { useLenis } from "@/components/ui/LenisProvider";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { NextPage } from "@/components/ui/next-page";
import {
  BUDGETS,
  CALENDLY_EMBED_URL,
  CALENDLY_URL,
  CALL_POINTS,
  CHANNELS,
  CONTACT_EMAIL,
  EMAIL_HREF,
  FAQ,
  FORMSPREE_ENDPOINT,
  WHATSAPP_HREF,
  HERO_WORDS,
  NEXT_STEPS,
  PROJECT_TYPES,
  TIMELINES,
} from "@/data/contact";

gsap.registerPlugin(useGSAP);

const EASE = [0.16, 1, 0.3, 1] as const;

const MESSAGE_MAX = 2000;
/** Keep the "sending" ring up at least this long, so it reads as a moment */
const MIN_SENDING_MS = 900;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// -------------------------------------------------------------------------
// The site's one link style (.ftr-link with the letter roll)
// -------------------------------------------------------------------------
function RollLink({
  href,
  label,
  external,
  className,
  children,
  onClick,
}: {
  href: string;
  label: string;
  external?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href={href}
      className={`ftr-link${className ? ` ${className}` : ""}`}
      onClick={onClick}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <TextRoll className="ftr-link__roll" style={{ lineHeight: 1.25 }}>
        {label}
      </TextRoll>
      {children}
    </a>
  );
}

// -------------------------------------------------------------------------
// The hero's typed word: holds, deletes, types the next one. It only runs
// while `active` (after the entrance, while the hero is on screen) and
// carries on from where it stopped.
// -------------------------------------------------------------------------
function useTypewriter(words: string[], active: boolean) {
  const st = useRef({ w: 0, c: words[0].length, phase: "hold" as "hold" | "del" | "type" });
  const [text, setText] = useState(words[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!active) return;
    let t = 0;
    const s = st.current;
    const tick = () => {
      if (s.phase === "hold") {
        s.phase = "del";
        setBusy(true);
      }
      if (s.phase === "del") {
        if (s.c > 0) {
          s.c -= 1;
          setText(words[s.w].slice(0, s.c));
          t = window.setTimeout(tick, 45);
        } else {
          s.w = (s.w + 1) % words.length;
          s.phase = "type";
          t = window.setTimeout(tick, 260);
        }
        return;
      }
      const word = words[s.w];
      if (s.c < word.length) {
        s.c += 1;
        setText(word.slice(0, s.c));
        t = window.setTimeout(tick, 80 + Math.random() * 60);
      } else {
        s.phase = "hold";
        setBusy(false);
        t = window.setTimeout(tick, 2400);
      }
    };
    t = window.setTimeout(tick, s.phase === "hold" ? 2400 : 80);
    return () => window.clearTimeout(t);
  }, [active, words]);

  return { text, busy };
}

// -------------------------------------------------------------------------
// Hero
// -------------------------------------------------------------------------
function ContactHero({ onStart, onBook }: { onStart: () => void; onBook: (e: React.MouseEvent) => void }) {
  const heroRef = useRef<HTMLElement>(null);
  const pageReady = usePageReady();
  const started = useRef(false);
  const [introDone, setIntroDone] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [reduce, setReduce] = useState(false);
  // The dragon's brush, scaled up for a glyph this size
  const kanjiBrush = useDragonBrushPx() * 1.8;
  const typed = useTypewriter(HERO_WORDS, introDone && onScreen && !reduce);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const hero = heroRef.current;
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  /* ── Page entrance ──────────────────────────────────────────────────────
     Waits until the page can be seen (preloader, transition overlay or a
     scroll-to-next hand-off lifted). Until then [data-intro-state="pending"]
     keeps everything hidden (see .ct-hero in globals.css).

       0.00  the eyebrow slides in
       0.10  the headline's words rise, line by line
       0.55  the cursor arrives and starts to blink
       0.60  the kanji settles in at the edge
       0.65  the lede, then the actions
       0.90  the facts along the bottom, their rules drawing across       */
  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero || started.current) return;

      const start = () => {
        if (started.current) return;
        started.current = true;
        const q = gsap.utils.selector(hero);
        const done = () => {
          hero.dataset.introState = "done";
          setIntroDone(true);
        };
        hero.dataset.introState = "running";

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          gsap.set(q(".ct-hero__title .rw-i"), { yPercent: 0 });
          gsap.fromTo(
            q("[data-ct-in], .ct-hero__title"),
            { opacity: 0 },
            { opacity: 1, duration: 0.6, ease: "power1.out", clearProps: "opacity", onComplete: done },
          );
          return;
        }

        const tl = gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: done });
        tl.fromTo(q(".ct-hero__eyebrow"), { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 1, clearProps: "transform" }, 0);
        tl.fromTo(
          q(".ct-hero__title .rw-i"),
          { yPercent: 110 },
          { yPercent: 0, duration: 1.3, stagger: 0.08, clearProps: "transform" },
          0.1,
        );
        tl.fromTo(q(".ct-hero__cursor"), { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }, 0.55);
        tl.fromTo(q(".ct-hero__kanji"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.8, clearProps: "transform" }, 0.6);
        tl.fromTo(q(".ct-hero__lede"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, clearProps: "transform" }, 0.65);
        tl.fromTo(q(".ct-hero__actions"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.1, clearProps: "transform" }, 0.78);
        tl.fromTo(q(".ct-fact"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, clearProps: "transform" }, 0.9);
        tl.fromTo(
          q(".ct-fact__rule"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.2, stagger: 0.08, ease: "expo.inOut", clearProps: "transform" },
          0.9,
        );
      };

      if (pageReady) start();
      // Never leave the hero hidden if the ready signal never comes
      const fallback = window.setTimeout(start, 6000);
      return () => window.clearTimeout(fallback);
    },
    { dependencies: [pageReady], scope: heroRef },
  );

  return (
    <section ref={heroRef} className="ct-hero" data-intro-state="pending" aria-labelledby="ct-hero-title">
      <noscript>
        <style>{`.ct-hero[data-intro-state] * { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>

      {/* "Get in touch" down the right edge. Pointing at it casts the site's
          genjutsu (the dragon's torn brush, as the hero faces on /home) and
          tears it into 連絡, the same words in Japanese, in crimson. A tap
          spreads the ink across it. The caption says what it means. */}
      <div className="ct-hero__kanji" aria-hidden="true" data-ct-in>
        <GenjutsuReveal
          className="ct-kanji"
          radius={kanjiBrush}
          alt={
            <span className="ct-kanji__jp" lang="ja">
              連絡
            </span>
          }
        >
          <span className="ct-kanji__en">
            Get in
            <br />
            touch
          </span>
        </GenjutsuReveal>
        <span className="ct-kanji__cap">
          <span lang="ja">連絡</span> renraku · get in touch
        </span>
      </div>

      <div className="ct-wrap ct-hero__inner">
        <p className="ct-eyebrow ct-hero__eyebrow" data-ct-in>
          <span className="ct-eyebrow__rule" aria-hidden="true" />
          Contact · Working worldwide
        </p>

        <div className="ct-hero__main">
          <h1 id="ct-hero-title" className="ct-hero__title">
            <span className="sr-only">Let&apos;s build your next project</span>
            <span aria-hidden="true" className="ct-hero__line">
              <RevealText>Let&apos;s build</RevealText>
            </span>
            <span aria-hidden="true" className="ct-hero__line ct-hero__line--typed">
              <RevealText>your</RevealText>{" "}
              <span className="rw">
                <span className="rw-i ct-hero__word">
                  {typed.text}
                  <span className="ct-hero__cursor" data-busy={typed.busy || undefined} />
                </span>
              </span>
            </span>
          </h1>

          <div className="ct-hero__side">
            <p className="ct-hero__lede" data-ct-in>
              Tell me what you are building. I read every message myself, and the brief below takes about two
              minutes.
            </p>
            <div className="ct-hero__actions" data-ct-in>
              <ButtonWithIcon onClick={onStart}>Start the brief</ButtonWithIcon>
              <div className="ct-hero__links">
                <RollLink href={EMAIL_HREF} label="Write me an email">
                  <ArrowUpRight aria-hidden="true" />
                </RollLink>
                <RollLink href="#book" label="Book a call" onClick={onBook}>
                  <ArrowUpRight aria-hidden="true" />
                </RollLink>
                <RollLink href={WHATSAPP_HREF} label="WhatsApp" external>
                  <ArrowUpRight aria-hidden="true" />
                </RollLink>
              </div>
            </div>
          </div>
        </div>

        <dl className="ct-facts">
          {[
            ["Based in", "Pakistan · PKT (UTC+5)"],
            ["Working with", "International clients, remotely"],
            ["Replies", "Within one working day"],
          ].map(([k, v]) => (
            <div key={k} className="ct-fact" data-ct-in>
              <span className="ct-fact__rule" aria-hidden="true" />
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// -------------------------------------------------------------------------
// The brief: a short form, sent through Formspree
// -------------------------------------------------------------------------
interface Fields {
  name: string;
  email: string;
  types: string[];
  budget: string;
  timeline: string;
  message: string;
}
type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

const EMPTY: Fields = { name: "", email: "", types: [], budget: "", timeline: "", message: "" };

function validate(f: Fields): FieldErrors {
  const e: FieldErrors = {};
  if (!f.name.trim()) e.name = "Please tell me your name.";
  if (!f.email.trim()) e.email = "Please add an email so I can reply.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "That email doesn't look right.";
  if (f.message.trim().length < 10) e.message = "A sentence or two about the project, please.";
  return e;
}

function Chips({
  legend,
  index,
  name,
  options,
  multiple,
  value,
  onChange,
}: {
  legend: string;
  index: string;
  name: string;
  options: string[];
  multiple?: boolean;
  value: string | string[];
  onChange: (option: string) => void;
}) {
  return (
    <fieldset className="ct-field">
      <legend className="ct-field__label">
        <span className="ct-field__num">{index}</span>
        {legend}
        {multiple && <span className="ct-field__hint">Choose any</span>}
      </legend>
      <div className="ct-chips">
        {options.map((o) => {
          const checked = multiple ? (value as string[]).includes(o) : value === o;
          return (
            <label key={o} className="ct-chip">
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                value={o}
                checked={checked}
                onChange={() => onChange(o)}
              />
              <span>{o}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function BriefSection() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SendState>("idle");
  const [toast, setToast] = useState<{ name: string; email: string } | null>(null);
  const botRef = useRef<HTMLInputElement>(null);
  const puckRef = useRef<HTMLSpanElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const closeToast = useCallback(() => setToast(null), []);

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    if (k in errors) setErrors((p) => ({ ...p, [k]: undefined }));
    if (status === "error") setStatus("idle");
  };

  const toggleType = (t: string) =>
    set("types", f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t]);

  /* Sent: the plane takes off from the button, the toast follows it in as
     it leaves the window, the form clears, and the button settles back */
  const celebrate = async (who: { name: string; email: string }) => {
    setStatus("sent");
    const from = puckRef.current;
    const show = () => setToast(who);
    if (from) await flyPaperPlane(from, { onExit: show });
    else show();
    setF(EMPTY);
    window.setTimeout(() => setStatus("idle"), 2200);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending" || status === "sent") return;
    const found = validate(f);
    if (Object.keys(found).length) {
      setErrors(found);
      const first = (["name", "email", "message"] as const).find((k) => found[k]);
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const who = { name: f.name.trim(), email: f.email.trim() };
    // A bot filled the hidden field: pretend it worked
    if (botRef.current?.checked) {
      setStatus("sending");
      await wait(MIN_SENDING_MS);
      return celebrate(who);
    }

    setStatus("sending");
    try {
      // Formspree: JSON in, JSON out. `email` becomes the reply-to address,
      // `_subject` the email's subject line.
      const request = fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `New project brief from ${who.name}`,
          name: who.name,
          email: who.email,
          "Project type": f.types.length ? f.types.join(", ") : "Not given",
          Budget: f.budget || "Not given",
          Timeline: f.timeline || "Not given",
          message: f.message.trim(),
        }),
      });
      const [res] = await Promise.all([request, wait(MIN_SENDING_MS)]);
      if (!res.ok) throw new Error(`Formspree answered ${res.status}`);
      await celebrate(who);
    } catch {
      setStatus("error");
    }
  };

  const field = (k: "name" | "email", index: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="ct-field">
      <label className="ct-field__label" htmlFor={`ct-${k}`}>
        <span className="ct-field__num">{index}</span>
        {label}
      </label>
      <input
        id={`ct-${k}`}
        name={k}
        className="ct-input"
        value={f[k]}
        onChange={(e) => set(k, e.target.value)}
        aria-invalid={!!errors[k] || undefined}
        aria-describedby={errors[k] ? `ct-${k}-err` : undefined}
        {...props}
      />
      {errors[k] && (
        <p id={`ct-${k}-err`} className="ct-error">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <section className="ct-section ct-brief" aria-labelledby="ct-brief-title">
      <div className="ct-wrap ct-brief__grid">
        <div className="ct-brief__aside">
          <p className="ct-eyebrow">
            <JpTerm jp="依頼" reading="irai" meaning="A request; asking someone to take on a job" className="ct-eyebrow__kanji" />
            The brief
          </p>
          <HeadingReveal as="h2" id="ct-brief-title" className="ct-title" scrollStart="top 85%">
            Start a project
          </HeadingReveal>
          <p className="ct-intro">
            A few quick questions, so my first reply can already be useful. Only your name, email and a line about
            the project are needed.
          </p>

          <motion.ol
            className="ct-steps"
            aria-label="What happens next"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          >
            {NEXT_STEPS.map((s, i) => (
              <li key={s.title} className="ct-step">
                <span className="ct-step__num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="ct-step__title">{s.title}</h3>
                  <p className="ct-step__body">{s.body}</p>
                </div>
              </li>
            ))}
          </motion.ol>
        </div>

        <motion.form
          ref={formRef}
          id="contact-form"
          className="ct-form"
          aria-label="Project brief"
          noValidate
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        >
          <div className="ct-form__pair">
            {field("name", "01", "What should I call you?", {
              type: "text",
              autoComplete: "name",
              placeholder: "Your name",
              maxLength: 120,
            })}
            {field("email", "02", "Where can I reply?", {
              type: "email",
              autoComplete: "email",
              inputMode: "email",
              placeholder: "name@company.com",
              maxLength: 200,
            })}
          </div>

          <Chips
            index="03"
            legend="What are we building?"
            name="types"
            options={PROJECT_TYPES}
            multiple
            value={f.types}
            onChange={toggleType}
          />
          <Chips
            index="04"
            legend="Rough budget (USD)"
            name="budget"
            options={BUDGETS}
            value={f.budget}
            onChange={(o) => set("budget", o)}
          />
          <Chips
            index="05"
            legend="When do you need it?"
            name="timeline"
            options={TIMELINES}
            value={f.timeline}
            onChange={(o) => set("timeline", o)}
          />

          <div className="ct-field">
            <label className="ct-field__label" htmlFor="ct-message">
              <span className="ct-field__num">06</span>
              Tell me about it
            </label>
            <textarea
              id="ct-message"
              name="message"
              className="ct-input ct-input--area"
              rows={5}
              maxLength={MESSAGE_MAX}
              placeholder="What it is, who it's for, and what a great result looks like to you."
              value={f.message}
              onChange={(e) => set("message", e.target.value)}
              aria-invalid={!!errors.message || undefined}
              aria-describedby={`ct-message-count${errors.message ? " ct-message-err" : ""}`}
            />
            <div className="ct-field__foot">
              {errors.message ? (
                <p id="ct-message-err" className="ct-error">
                  {errors.message}
                </p>
              ) : (
                <span />
              )}
              <span id="ct-message-count" className="ct-count">
                {f.message.length} / {MESSAGE_MAX}
              </span>
            </div>
          </div>

          {/* Honeypot: hidden from people, filled in by bots */}
          <input
            ref={botRef}
            type="checkbox"
            name="_gotcha"
            className="ct-honeypot"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <div className="ct-submit">
            <SendButton state={status} puckRef={puckRef} />
            <div className="ct-submit__note">
              <span>Your details are only used to reply to you.</span>
              <RollLink href="/privacy" label="Privacy" />
            </div>
          </div>

          <SentToast
            open={!!toast}
            onClose={closeToast}
            title="Brief sent"
            body={
              toast && (
                <>
                  Thanks, {toast.name.split(" ")[0]}. I&apos;ll reply to <b>{toast.email}</b> within one working day.
                </>
              )
            }
          />

          <div className="ct-status" role="status" aria-live="polite">
            {status === "error" && (
              <p className="ct-error ct-error--block">
                Something went wrong and your brief wasn&apos;t sent. Please try again, or email me at{" "}
                <a href={EMAIL_HREF}>{CONTACT_EMAIL}</a>.
              </p>
            )}
          </div>
        </motion.form>
      </div>
    </section>
  );
}

// -------------------------------------------------------------------------
// Book a call: Calendly's calendar, framed in the page's colours
// -------------------------------------------------------------------------
function CallSection() {
  const [booked, setBooked] = useState(false);
  return (
    <section id="book" className="ct-section ct-call" aria-labelledby="ct-call-title">
      <div className="ct-wrap">
        <div className="ct-call__head">
          <div className="ct-head">
            <p className="ct-eyebrow">Book a call</p>
            <HeadingReveal as="h2" id="ct-call-title" className="ct-title" scrollStart="top 85%">
              Talk it through
            </HeadingReveal>
          </div>
          <motion.div
            className="ct-call__side"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          >
            <p className="ct-intro">
              Rather talk than type? Pick a free slot for a 30-minute video call about your project, and the invite
              with the meeting link lands in your inbox.
            </p>
            <ul className="ct-call__points">
              {CALL_POINTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          className="ct-call__frame"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE }}
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        >
          <CalendlyEmbed
            url={CALENDLY_EMBED_URL}
            title="Book a call with Ahmad"
            onEvent={(e) => e === "calendly.event_scheduled" && setBooked(true)}
            fallback={
              <p>
                The calendar couldn&apos;t load here.{" "}
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  Open it on Calendly
                </a>{" "}
                instead.
              </p>
            }
          />
        </motion.div>

        <div className="ct-call__foot">
          <p>No time that suits you? Send the brief above and we&apos;ll find one.</p>
          <RollLink href={CALENDLY_URL} label="Open in Calendly" external>
            <ArrowUpRight aria-hidden="true" />
          </RollLink>
        </div>
      </div>

      <SentToast
        open={booked}
        title="Call booked"
        body="Thanks! The invite with the meeting link is on its way to your inbox. Talk soon."
        note="Need to change it? Use the link in the invite."
        onClose={() => setBooked(false)}
      />
    </section>
  );
}

// -------------------------------------------------------------------------
// Direct channels
// -------------------------------------------------------------------------
function ChannelCard({ c, i }: { c: (typeof CHANNELS)[number]; i: number }) {
  return (
    <motion.li
      className="ct-channel"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: i * 0.08, ease: EASE }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
    >
      {/* The whole card opens the channel; the visible link below says so */}
      <a
        className="ct-channel__hit"
        href={c.href}
        tabIndex={-1}
        aria-hidden="true"
        {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      />
      <span className="ct-channel__label">{c.label}</span>
      <span className="ct-channel__value">
        {/* Let a long address wrap after the @, never mid-word */}
        {c.value.includes("@") ? (
          <>
            {c.value.split("@")[0]}@<wbr />
            {c.value.split("@")[1]}
          </>
        ) : (
          c.value
        )}
      </span>
      <p className="ct-channel__note">{c.note}</p>
      <div className="ct-channel__actions">
        <RollLink href={c.href} label={c.action} external={c.external}>
          <ArrowUpRight aria-hidden="true" />
        </RollLink>
        {c.secondary && (
          <RollLink href={c.secondary.href} label={c.secondary.action}>
            <ArrowUpRight aria-hidden="true" />
          </RollLink>
        )}
      </div>
    </motion.li>
  );
}

function ChannelsSection() {
  return (
    <section className="ct-section ct-channels" aria-labelledby="ct-channels-title">
      <div className="ct-wrap">
        <div className="ct-head">
          <p className="ct-eyebrow">Direct</p>
          <HeadingReveal as="h2" id="ct-channels-title" className="ct-title" scrollStart="top 85%">
            Or reach me directly
          </HeadingReveal>
        </div>
        <ul className="ct-channel-list">
          {CHANNELS.map((c, i) => (
            <ChannelCard key={c.label} c={c} i={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

// -------------------------------------------------------------------------
// FAQ
// -------------------------------------------------------------------------
function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="ct-section ct-faq sec-gradient" aria-labelledby="ct-faq-title">
      <div className="ct-wrap ct-faq__grid">
        <div className="ct-faq__aside">
          <p className="ct-eyebrow">FAQ</p>
          <HeadingReveal as="h2" id="ct-faq-title" className="ct-title" scrollStart="top 85%">
            Before you ask
          </HeadingReveal>
          <p className="ct-intro">Anything else, just ask in your brief.</p>
        </div>

        <motion.ul
          className="ct-faq__list"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        >
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="ct-faq__item" data-open={isOpen || undefined}>
                <h3 className="ct-faq__h">
                  <button
                    type="button"
                    className="ct-faq__q"
                    id={`ct-faq-q${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`ct-faq-a${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span className="ct-faq__num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="ct-faq__text">{item.q}</span>
                    <span className="ct-faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={`ct-faq-a${i}`}
                  role="region"
                  aria-labelledby={`ct-faq-q${i}`}
                  className="ct-faq__a"
                  inert={!isOpen}
                >
                  <div className="ct-faq__a-inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}

// -------------------------------------------------------------------------
// The page
// -------------------------------------------------------------------------
export function ContactView() {
  const lenis = useLenis();

  const toBook = (e: React.MouseEvent) => {
    const target = document.getElementById("book");
    if (!target) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (lenis) lenis.scrollTo(target, { offset: -40, ...(reduce ? { immediate: true } : { duration: 1.8 }) });
    else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const toForm = () => {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (lenis) lenis.scrollTo(form, { offset: -120, ...(reduce ? { immediate: true } : { duration: 1.6 }) });
    else form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    form.querySelector<HTMLInputElement>("input[name='name']")?.focus({ preventScroll: true });
  };

  return (
    <>
      <main className="ct-page">
        <ContactHero onStart={toForm} onBook={toBook} />
        <BriefSection />
        <CallSection />
        <ChannelsSection />
        <FaqSection />
      </main>

      {/* Testimonials // client words drifting up in columns */}
      <TestimonialsSection background="#072A5E" />

      {/* Footer // curtain reveal with the closing call to action */}
      <CinematicFooter />

      {/* Keep scrolling // back to the start: the home page rises over the footer and opens */}
      <NextPage
        href="/home"
        title="Home"
        meta="Code is a craft, not just a skill"
        image="/hero-base-cutout.webp"
        fit="contain"
      />
    </>
  );
}

export default ContactView;
