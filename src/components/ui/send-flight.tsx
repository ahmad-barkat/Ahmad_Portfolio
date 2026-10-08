"use client";

import React, { forwardRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Check, Send, X } from "lucide-react";

if (typeof window !== "undefined") gsap.registerPlugin(MotionPathPlugin);

/* The contact form's send moment (ContactView.tsx, .snd-* CSS):

   SendButton   the brief's submit button. Idle: a light pill, label and a
                royal puck holding a paper plane. Sending: it folds into the
                puck while a ring turns round it. Sent: the puck turns mint
                with a check.
   flyPaperPlane a paper plane leaves the puck, dips back, then swoops up
                and out of the window, drawing a dotted mint contrail.
   SentToast    the note that follows: "Brief sent", who it's from, and when
                to expect a reply. Closes itself.

   The send button is the one deliberate exception to the site's single
   button style, at the client's request (2026-09-30). */

export type SendState = "idle" | "sending" | "sent" | "error";

const LABELS: Record<SendState, string> = {
  idle: "Send the brief",
  sending: "Sending",
  sent: "Brief sent",
  error: "Send the brief",
};

export const SendButton = forwardRef<HTMLButtonElement, { state: SendState; puckRef?: React.Ref<HTMLSpanElement> }>(
  function SendButton({ state, puckRef }, ref) {
    return (
      <button
        ref={ref}
        type="submit"
        className="snd"
        data-state={state}
        disabled={state === "sending" || state === "sent"}
        aria-busy={state === "sending" || undefined}
      >
        <span className="snd__fill" aria-hidden="true" />
        <span className="snd__label">
          <span>{LABELS[state]}</span>
        </span>
        <span ref={puckRef} className="snd__puck" aria-hidden="true">
          <Send className="snd__plane" strokeWidth={2} />
          <Check className="snd__check" strokeWidth={2.5} />
          <svg className="snd__ring" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="23" pathLength={100} />
          </svg>
        </span>
      </button>
    );
  },
);

/** Viewport-sized overlay the plane flies across; removed when it lands */
export function flyPaperPlane(from: HTMLElement, { onExit }: { onExit?: () => void } = {}) {
  return new Promise<void>((resolve) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onExit?.();
      resolve();
      return;
    }

    const r = from.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sx = r.left + r.width / 2;
    const sy = r.top + r.height / 2;
    // Scaled to the screen, so a phone gets the same shape of flight
    const k = Math.min(1, vw / 1100);
    const d = [
      `M${sx},${sy}`,
      `C${sx - 70 * k},${sy + 55 * k} ${sx + 150 * k},${sy + 130 * k} ${sx + 290 * k},${sy - 30 * k}`,
      `C${sx + 400 * k},${sy - 200 * k} ${vw * 0.86},${Math.max(80, sy * 0.3)} ${vw + 140},${-140}`,
    ].join(" ");

    const NS = "http://www.w3.org/2000/svg";
    const layer = document.createElement("div");
    layer.className = "snd-flight";
    layer.setAttribute("aria-hidden", "true");
    const id = `snd-m-${Math.random().toString(36).slice(2, 8)}`;
    layer.innerHTML = `
      <svg class="snd-flight__svg" width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}" xmlns="${NS}">
        <defs>
          <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${vw}" height="${vh}">
            <path class="snd-flight__reveal" d="${d}" />
          </mask>
        </defs>
        <path class="snd-flight__trail" d="${d}" mask="url(#${id})" />
        <path class="snd-flight__guide" d="${d}" />
      </svg>
      <span class="snd-flight__plane">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
          <path d="m21.854 2.147-10.94 10.939" />
        </svg>
      </span>`;
    document.body.appendChild(layer);

    const guide = layer.querySelector<SVGPathElement>(".snd-flight__guide")!;
    const reveal = layer.querySelector<SVGPathElement>(".snd-flight__reveal")!;
    const trail = layer.querySelector<SVGPathElement>(".snd-flight__trail")!;
    const plane = layer.querySelector<HTMLElement>(".snd-flight__plane")!;
    const len = guide.getTotalLength();
    reveal.style.strokeDasharray = `${len} ${len}`;
    reveal.style.strokeDashoffset = `${len}`;

    const FLY = 1.5;
    const tl = gsap.timeline({
      onComplete: () => {
        layer.remove();
        resolve();
      },
    });
    // The plane grows out of the puck, then follows the path nose first
    tl.fromTo(plane, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }, 0);
    tl.to(
      plane,
      {
        duration: FLY,
        ease: "power2.in",
        motionPath: { path: guide, align: guide, alignOrigin: [0.5, 0.5], autoRotate: true },
      },
      0,
    );
    tl.to(reveal, { strokeDashoffset: 0, duration: FLY, ease: "power2.in" }, 0);
    tl.call(() => onExit?.(), [], FLY * 0.72);
    tl.to(trail, { opacity: 0, duration: 0.7, ease: "power1.out" }, FLY - 0.35);
  });
}

/** "Brief sent": slides up from the bottom corner and closes itself */
export function SentToast({
  open,
  title,
  body,
  note,
  onClose,
  duration = 7,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  note?: string;
  onClose: () => void;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<gsap.core.Tween | null>(null);
  // Portals can't be hydrated: render into <body> only once mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.fromTo(
      el,
      { y: reduce ? 0 : 28, opacity: 0 },
      { y: 0, opacity: 1, duration: reduce ? 0.2 : 0.7, ease: "expo.out" },
    );
    // The bar under the note runs down, then it closes; hovering holds it
    const bar = el.querySelector(".snd-toast__bar");
    timer.current = gsap.fromTo(bar, { scaleX: 1 }, { scaleX: 0, duration, ease: "none", onComplete: onClose });
    const hold = () => timer.current?.pause();
    const go = () => timer.current?.resume();
    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", go);
    el.addEventListener("focusin", hold);
    el.addEventListener("focusout", go);
    return () => {
      timer.current?.kill();
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", go);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", go);
    };
  }, [open, duration, onClose]);

  if (!mounted) return null;
  return createPortal(
    <div className="snd-toast-region" role="status" aria-live="polite">
      {open && (
        <div ref={ref} className="snd-toast">
          <span className="snd-toast__icon" aria-hidden="true">
            <Check strokeWidth={2.5} />
          </span>
          <div className="snd-toast__text">
            <p className="snd-toast__title">{title}</p>
            <p className="snd-toast__body">{body}</p>
            {note && <p className="snd-toast__note">{note}</p>}
          </div>
          <button type="button" className="snd-toast__close" onClick={onClose} aria-label="Dismiss">
            <X strokeWidth={2} />
          </button>
          <span className="snd-toast__bar" aria-hidden="true" />
        </div>
      )}
    </div>,
    document.body,
  );
}
