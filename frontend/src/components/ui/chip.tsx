import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const chipVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap h-8 px-3 rounded-full text-xs font-medium transition-[color,background-color,box-shadow,transform,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] cursor-pointer [&>svg]:w-3.5 [&>svg]:h-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-muted text-muted-foreground shadow-neumorphic-sm hover:text-foreground hover:shadow-neumorphic",
        active: "bg-primary/10 text-primary ring-1 ring-primary",
        outline:
          "bg-card text-foreground border border-border shadow-neumorphic-sm hover:border-primary/60 hover:shadow-neumorphic",
        link: "bg-muted text-primary shadow-neumorphic-sm hover:shadow-neumorphic",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof chipVariants> {
  asChild?: boolean;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(chipVariants({ variant, className }))} ref={ref} {...props} />;
  },
);
Chip.displayName = "Chip";

/* eslint-disable-next-line react-refresh/only-export-components */
export { Chip, chipVariants };
