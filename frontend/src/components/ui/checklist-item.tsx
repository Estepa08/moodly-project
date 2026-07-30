import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { ComponentSize, CheckedColor } from "../../lib/constants";

interface ChecklistItemProps {
  checked: boolean;
  onToggle: () => void;
  label: ReactNode;
  disabled?: boolean;
  size?: ComponentSize;
  checkedColor?: CheckedColor;
  className?: string;
}

const sizeMap: Record<ComponentSize, { button: string; check: string; icon: string }> = {
  [ComponentSize.Sm]: { button: "px-3 py-2 text-sm gap-2", check: "w-4 h-4", icon: "w-3 h-3" },
  [ComponentSize.Md]: {
    button: "px-3 py-2.5 text-sm gap-3",
    check: "w-5 h-5",
    icon: "w-3.5 h-3.5",
  },
};

const colorMap: Record<CheckedColor, { bg: string; border: string; icon: string }> = {
  [CheckedColor.Primary]: {
    bg: "bg-primary/10 text-primary",
    border: "bg-primary border-primary",
    icon: "text-primary-foreground",
  },
  [CheckedColor.Accent]: {
    bg: "bg-accent/10 text-accent",
    border: "bg-accent border-accent",
    icon: "text-white",
  },
};

export function ChecklistItem({
  checked,
  onToggle,
  label,
  disabled,
  size = ComponentSize.Md,
  checkedColor = CheckedColor.Primary,
  className,
}: ChecklistItemProps) {
  const s = sizeMap[size];
  const c = colorMap[checkedColor];

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={checked}
      className={cn(
        "w-full flex items-center rounded-xl text-left transition-[color,background-color,box-shadow,opacity,transform] duration-150 cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        s.button,
        checked
          ? `${c.bg} shadow-neumorphic-inset`
          : "bg-muted text-muted-foreground shadow-neumorphic-sm",
        disabled && "opacity-60 cursor-not-allowed",
        className,
      )}
    >
      <span
        className={cn(
          "rounded-md border flex items-center justify-center shrink-0",
          s.check,
          checked ? `${c.border}` : "border-border",
        )}
      >
        {checked && <Check aria-hidden="true" className={cn(s.icon, c.icon)} />}
      </span>
      {label}
    </button>
  );
}
