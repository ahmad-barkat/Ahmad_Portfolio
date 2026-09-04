"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLenis } from "./LenisProvider";
import { gsap } from "gsap";

interface TransitionState {
  active: boolean;
  rect: DOMRect | null;
  textRect: DOMRect | null;
  initialFontSize: string;
  color: string;
  label: string;
  targetHref: string;
}

interface TransitionContextType {
  transitionTo: (href: string, triggerElement: HTMLElement, color: string, label: string) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function usePageTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("usePageTransition must be used within a TransitionProvider");
  }
  return context;
}

export default function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const prevPathname = useRef(pathname);

  const [overlayState, setOverlayState] = useState<TransitionState>({
    active: false,
    rect: null,
    textRect: null,
    initialFontSize: "",
    color: "",
    label: "",
    targetHref: "",
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const isNavigating = useRef(false);

  const transitionTo = (href: string, triggerElement: HTMLElement, color: string, label: string) => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    // Capture the initial dimensions and position of the clicked rectangle
    const rect = triggerElement.getBoundingClientRect();

    // Find clicked label element to get its exact location and font size
    const labelEl = (triggerElement.querySelector(".nav-bar-label") ||
      triggerElement.querySelector(".hb-label") ||
      triggerElement) as HTMLElement;
    const textRect = labelEl.getBoundingClientRect();
    const computed = window.getComputedStyle(labelEl);
    const initialFontSize = computed.fontSize || "clamp(1.8rem, 4vw, 3.5rem)";

    // Disable page scrolling
    lenis?.stop();

    setOverlayState({
      active: true,
      rect,
      textRect,
      initialFontSize,
      color,
      label,
      targetHref: href,
    });
  };

  // Entrance phase: Animate expanding rectangle + scaling text from its exact origin
  useEffect(() => {
    if (!overlayState.active || !overlayState.rect || !overlayState.textRect || !overlayRef.current || !textRef.current) return;

    const overlay = overlayRef.current;
    const text = textRef.current;
    const rect = overlayState.rect;
    const textRect = overlayState.textRect;

    // Initial state: Overlay matches the clicked item's position and size
    gsap.set(overlay, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      opacity: 1,
      yPercent: 0,
      borderRadius: "16px",
    });

    // Initial state: Text is placed EXACTLY at its clicked coordinates relative to overlay (no jump!)
    const offsetLeft = textRect.left - rect.left;
    const offsetTop = textRect.top - rect.top;

    gsap.set(text, {
      position: "absolute",
      fontSize: overlayState.initialFontSize,
      left: offsetLeft,
      top: offsetTop,
      xPercent: 0,
      yPercent: 0,
      scale: 1,
      opacity: 1,
      transformOrigin: "left center",
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // Trigger Next.js navigation once screen expansion finishes
        router.push(overlayState.targetHref);
      },
    });

    // Animate overlay rectangle to cover full screen
    tl.to(overlay, {
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      borderRadius: "0px",
      duration: 0.8,
      ease: "power4.inOut",
    }, 0);

    // Smoothly scale & glide heading text from its exact starting position to full-screen prominence
    tl.to(text, {
      left: "50%",
      top: "50%",
      xPercent: -50,
      yPercent: -50,
      scale: 1.35,
      fontSize: "clamp(3.5rem, 10vw, 8rem)",
      duration: 0.8,
      ease: "power4.inOut",
    }, 0);

  }, [overlayState.active, overlayState.rect, overlayState.textRect, overlayState.initialFontSize, overlayState.targetHref, router]);

  // Exit phase: Page changed, move text smoothly to top-right while overlay slides up
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      isNavigating.current = false;

      if (overlayState.active && overlayRef.current && textRef.current) {
        const tl = gsap.timeline({
          onComplete: () => {
            // Reset transition overlay state
            setOverlayState({
              active: false,
              rect: null,
              textRect: null,
              initialFontSize: "",
              color: "",
              label: "",
              targetHref: "",
            });
            // Re-enable scrolling
            lenis?.start();
          },
        });

        // Slide overlay up out of camera view
        tl.to(overlayRef.current, {
          yPercent: -100,
          duration: 0.75,
          ease: "power3.inOut",
        }, 0);

        // Move heading text smoothly to top-right corner (safely to the left of the hamburger button)
        tl.to(textRef.current, {
          left: "calc(100% - clamp(6rem, 10vw, 8rem))",
          top: "clamp(1.5rem, 4vh, 2.5rem)",
          xPercent: -100,
          yPercent: 0,
          scale: 1,
          fontSize: "clamp(0.9rem, 2vw, 1.3rem)",
          opacity: 0.6,
          duration: 0.75,
          ease: "power3.inOut",
        }, 0);
      }
    }
  }, [pathname, overlayState.active, lenis]);

  return (
    <TransitionContext.Provider value={{ transitionTo }}>
      {children}
      {overlayState.active && (
        <div
          ref={overlayRef}
          style={{
            position: "fixed",
            zIndex: 999999,
            background: overlayState.color,
            pointerEvents: "none",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            ref={textRef}
            style={{
              position: "absolute",
              fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
              fontWeight: 900,
              color: overlayState.color === "#081C15" || overlayState.color === "#0D2B20" ? "#52B788" : "#081C15",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {overlayState.label}
          </div>
        </div>
      )}
    </TransitionContext.Provider>
  );
}
