import { SegmentControl, SegmentControlItem } from "./segment-control";

interface PeriodOption {
  key: string;
  label: string;
}

interface PeriodSelectorProps {
  options: PeriodOption[];
  value: string;
  onChange: (key: string) => void;
  size?: "sm" | "md";
  label?: string;
}

export default function PeriodSelector({
  options,
  value,
  onChange,
  size = "md",
  label,
}: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs font-medium text-muted-foreground shrink-0">{label}</span>}
      <SegmentControl role="tablist" aria-label={label ?? "period"}>
        {options.map((opt) => (
          <SegmentControlItem
            key={opt.key}
            role="tab"
            active={value === opt.key}
            onClick={() => onChange(opt.key)}
            size={size}
            aria-selected={value === opt.key}
          >
            {opt.label}
          </SegmentControlItem>
        ))}
      </SegmentControl>
    </div>
  );
}
