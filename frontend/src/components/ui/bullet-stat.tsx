import type { LucideIcon } from "lucide-react";

interface BulletStatProps {
  icon: LucideIcon;
  label: string;
  value: number;
  target: number;
  unit?: string;
  color?: string;
}

export default function BulletStat({
  icon: Icon,
  label,
  value,
  target,
  unit = "",
  color = "hsl(var(--primary))",
}: BulletStatProps) {
  const progress = Math.min((value / target) * 100, 100);

  return (
    <div className="rounded-xl bg-card shadow-neumorphic-sm p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-xs text-muted-foreground leading-tight flex-1">{label}</span>
        <span className="text-sm font-bold text-foreground tabular-nums">
          {value}{unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{Math.round(progress)}%</span>
        <span>Goal: {target}{unit}</span>
      </div>
    </div>
  );
}
