import React from "react";
import { LOGO_LEGS } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

/**
 * The page's signature in the background: Ahmad's mark and the page's name,
 * very large, in a hairline ice outline, set low on the first screen and cut
 * by its bottom edge. Flat on purpose: no fill, no glow, no depth.
 *
 * Sits at z-index -1, so its container needs a stacking context of its own
 * (`isolation: isolate`) and the page's content paints over it. `fixed` pins
 * it to the screen instead, for short pages on a plain background. The name
 * can be the page's heading (`as="h1"`); the outline is only the look.
 */
export function PageMark({
  name,
  as: Tag = "span",
  fixed = false,
  className,
  style,
}: {
  name: string;
  as?: "span" | "h1";
  fixed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("pm", fixed && "pm--fixed", className)} style={style}>
      <svg className="pm-logo" viewBox="4 4 40 40" aria-hidden="true">
        <path d={LOGO_LEGS} vectorEffect="non-scaling-stroke" />
      </svg>
      <Tag className="pm-name">{name}</Tag>
    </div>
  );
}

export default PageMark;
