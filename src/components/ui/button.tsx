import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Button, retuned for this portfolio.
 *
 * The stock version resolves its colours through shadcn design tokens
 * (`bg-primary`, `text-foreground`, …). This project never installed that token
 * layer — it styles from the four-colour palette directly — so the variants
 * below are bound to those hexes instead:
 *
 *   Primary #0B3D91 · Secondary #3BA7F2 · Tertiary #7FE7D6 · Background #E8F6FF
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FE7D6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E8F6FF] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#0B3D91] text-[#E8F6FF] hover:bg-[#0F4AA3]",
        destructive: "bg-[#B3325A] text-[#E8F6FF] hover:bg-[#C43C66]",
        outline:
          "border border-[#3BA7F2]/40 bg-transparent text-[#072A5E] hover:bg-[#3BA7F2]/15 hover:border-[#7FE7D6]/70",
        secondary: "bg-[#3BA7F2] text-[#072A5E] hover:bg-[#5FC7E4]",
        ghost: "hover:bg-[#3BA7F2]/15 hover:text-[#0B3D91]",
        link: "text-[#3BA7F2] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
