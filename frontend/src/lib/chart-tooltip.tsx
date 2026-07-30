import { cn } from "./utils";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: Record<string, unknown>;
  }>;
  label?: string;
  formatLabel?: (name: string, value: number, row?: Record<string, unknown>) => string;
  className?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatLabel,
  className,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className={cn(
        "bg-card px-3 py-2 rounded-xl shadow-neumorphic-sm border border-border text-sm",
        className,
      )}
      role="tooltip"
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-medium" style={{ color: entry.color }}>
          {formatLabel
            ? formatLabel(entry.name, entry.value, entry.payload)
            : `${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
}
