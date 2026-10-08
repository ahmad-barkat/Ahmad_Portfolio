"use client";

import React, { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A Japanese word with its meaning a hover away. A dotted mint underline
 * marks it; hovering, focusing or tapping it opens a small card with the
 * word, its reading and what it means. Screen readers get the meaning as the
 * word's description. Escape or a second tap closes it.
 *
 *   <JpTerm jp="依頼" reading="irai" meaning="A request, a commission" />
 */
export function JpTerm({
  jp,
  reading,
  meaning,
  className,
}: {
  jp: string;
  reading: string;
  meaning: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  // A tap fires mouse events too; only a real mouse opens on hover
  const pointer = useRef<string>("mouse");

  return (
    <span
      className={cn("jp-term", className)}
      data-open={open || undefined}
      tabIndex={0}
      aria-describedby={id}
      onPointerDown={(e) => (pointer.current = e.pointerType)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => pointer.current !== "mouse" && setOpen((o) => !o)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <span lang="ja" className="jp-term__word">
        {jp}
      </span>
      <span role="tooltip" id={id} className="jp-term__tip">
        <span className="jp-term__head">
          <span lang="ja" className="jp-term__jp">
            {jp}
          </span>
          <span className="jp-term__reading">{reading}</span>
        </span>
        <span className="jp-term__meaning">{meaning}</span>
      </span>
    </span>
  );
}

export default JpTerm;
