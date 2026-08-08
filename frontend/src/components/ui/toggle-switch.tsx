import * as React from "react";
import { cn } from "../../lib/utils";

export interface ToggleSwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "checked"
> {
  checked: boolean;
  onCheckedChange?: (next: boolean) => void;
  size?: "sm" | "md";
  thumbClassName?: string;
}

export const ToggleSwitch = React.forwardRef<HTMLButtonElement, ToggleSwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      size = "md",
      thumbClassName,
      className,
      type = "button",
      onClick,
      ...props
    },
    ref,
  ) => {
    const sizes =
      size === "sm"
        ? { track: "h-6 w-10", thumb: "h-4 w-4", slide: "translate-x-4" }
        : { track: "h-7 w-12", thumb: "h-5 w-5", slide: "translate-x-5" };

    return (
      <button
        ref={ref}
        type={type}
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) onCheckedChange?.(!checked);
        }}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
          sizes.track,
          checked && "bg-primary shadow-neumorphic-sm",
          !checked && "bg-muted shadow-neumorphic-inset",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1 left-1 rounded-full bg-card border border-border shadow-neumorphic-sm transition-transform duration-150",
            sizes.thumb,
            checked && sizes.slide,
            thumbClassName,
          )}
        />
      </button>
    );
  },
);
ToggleSwitch.displayName = "ToggleSwitch";
