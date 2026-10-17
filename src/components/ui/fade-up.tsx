"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type FadeUpProps<T extends React.ElementType> = {
  as?: T;
  /** How far below its place it starts, in px */
  y?: number;
  duration?: number;
  delay?: number;
  /** IntersectionObserver rootMargin: where on screen it counts as in view */
  margin?: string;
} & Omit<React.ComponentPropsWithRef<T>, "as">;

/**
 * Rises and fades in the first time it scrolls into view, then stays. A CSS
 * transition set off by one IntersectionObserver: the same look the contact
 * page had from the `motion` library, without downloading the library.
 */
export function FadeUp<T extends React.ElementType = "div">({
  as,
  y = 24,
  duration = 0.9,
  delay = 0,
  margin = "0px 0px -10% 0px",
  ref,
  style,
  ...rest
}: FadeUpProps<T>) {
  const Tag = (as ?? "div") as React.ElementType;
  const el = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = el.current;
    if (!node || shown) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [margin, shown]);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      el.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.RefObject<HTMLElement | null>).current = node;
    },
    [ref],
  );

  return (
    <Tag
      ref={setRef}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transition: `opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s`,
      }}
      {...rest}
    />
  );
}
