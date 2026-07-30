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
      {label && (
        <span className="text-xs font-medium text-muted-foreground shrink-0">{label}</span>
      )}
      <div
        className="flex items-center gap-1 bg-card rounded-xl shadow-neumorphic-sm p-1"
        role="tablist"
        aria-label={label ?? "period"}
      >
        {options.map((opt) => (
          <button
            key={opt.key}
            role="tab"
            aria-selected={value === opt.key}
            onClick={() => onChange(opt.key)}
            className={`rounded-lg font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              value === opt.key
                ? "bg-primary text-primary-foreground shadow-neumorphic-sm"
                : "text-muted-foreground hover:text-primary"
            } ${
              size === "sm"
                ? "px-2 py-1 text-[10px] min-h-[32px]"
                : "px-3 min-h-[44px] text-xs"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
