import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-[color,background,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/92 hover:shadow-[var(--shadow-glow)] hover:-translate-y-px active:translate-y-0",
        tech:
          "text-white shadow-sm bg-[image:var(--gradient-brand)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(11,35,64,0.25)] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.18),var(--shadow-glow)] hover:-translate-y-px active:translate-y-0",
        glow:
          "border border-brand-cyan/40 bg-brand-cyan/5 text-brand-cyan shadow-none hover:bg-brand-cyan/10 hover:border-brand-cyan/70 hover:shadow-[var(--shadow-glow)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/92 hover:shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--destructive)_70%,transparent)]",
        outline:
          "border border-input bg-background/60 shadow-sm hover:border-brand-cyan/60 hover:text-brand-cyan hover:bg-brand-cyan/5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "hover:bg-foreground/5 hover:text-accent",
        link:
          "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
