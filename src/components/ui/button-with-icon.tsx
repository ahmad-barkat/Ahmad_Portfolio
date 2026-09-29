"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ButtonWithIconProps extends ButtonProps {
  /** Label text. Defaults to "Let's Collaborate". */
  children?: React.ReactNode;
}

/**
 * Pill button whose arrow puck slides from the right edge to the left on hover
 * while the horizontal padding swaps sides, so the label appears to shuffle
 * across. Sized to sit inside the 60px nav dock (52px on phones).
 *
 * The puck's hover offset is `100% - (puck width + right inset)`, which mirrors
 * `right-1` on the far side — keep the three numbers in step if you resize it.
 * That is why every size here is stated twice: 24px puck / 28px offset below
 * 640px, 32px puck / 36px offset above it.
 */
const ButtonWithIcon = React.forwardRef<HTMLButtonElement, ButtonWithIconProps>(
  ({ className, children = "Let's Collaborate", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "group relative h-8 w-fit cursor-pointer overflow-hidden rounded-full p-1 ps-3.5 pe-9",
          "sm:h-10 sm:ps-5 sm:pe-12",
          "font-sans text-[10px] font-semibold uppercase tracking-[0.08em] sm:text-[11.5px] sm:tracking-[0.1em]",
          "shadow-[0_5px_18px_rgba(11,61,145,0.38)]",
          "transition-all duration-500 hover:ps-9 hover:pe-3.5 sm:hover:ps-12 sm:hover:pe-5",
          className,
        )}
        {...props}
      >
        <span className="relative z-10 transition-all duration-500">
          {children}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "absolute right-1 flex h-6 w-6 items-center justify-center rounded-full sm:h-8 sm:w-8",
            "bg-[#E8F6FF] text-[#0B3D91]",
            "transition-all duration-500 group-hover:right-[calc(100%-28px)] group-hover:rotate-45",
            "sm:group-hover:right-[calc(100%-36px)]",
          )}
        >
          <ArrowUpRight strokeWidth={2.5} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
      </Button>
    );
  },
);
ButtonWithIcon.displayName = "ButtonWithIcon";

export default ButtonWithIcon;
export { ButtonWithIcon };
