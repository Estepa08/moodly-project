import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Chip } from "../../components/ui/chip";

interface TrendPreviewProps {
  title: string;
  label: string;
  days: (number | null)[];
  icon?: ReactNode;
  accentClassName?: string;
  expanded: boolean;
  onToggle: () => void;
  showLabel?: string;
  hideLabel?: string;
  disabled?: boolean;
  children?: ReactNode;
}

interface Point {
  x: number;
  y: number;
}

const WIDTH = 100;
const HEIGHT = 32;
const PAD = 3;

function buildSegments(days: (number | null)[]): { segments: Point[][]; points: Point[] } {
  const values = days.filter((v): v is number => v !== null);
  if (values.length === 0) return { segments: [], points: [] };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (WIDTH - PAD * 2) / (days.length - 1 || 1);
  const allPoints: (Point | null)[] = days.map((v, i) => {
    const x = PAD + i * stepX;
    if (v === null) return null;
    const y = HEIGHT - PAD - ((v - min) / range) * (HEIGHT - PAD * 2);
    return { x, y };
  });
  const segments: Point[][] = [];
  let current: Point[] = [];
  for (const p of allPoints) {
    if (p) current.push(p);
    else if (current.length) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length) segments.push(current);
  return { segments, points: allPoints.filter((p): p is Point => p !== null) };
}

export default function TrendPreview({
  title,
  label,
  days,
  icon,
  accentClassName = "text-primary",
  expanded,
  onToggle,
  showLabel,
  hideLabel,
  disabled = false,
  children,
}: TrendPreviewProps) {
  const { segments, points } = buildSegments(days);
  const hasData = points.length > 0;

  return (
    <Card className="shadow-neumorphic">
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <Chip variant="default" onClick={onToggle} aria-expanded={expanded} disabled={disabled}>
            {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
            {expanded ? hideLabel : showLabel}
          </Chip>
        </div>

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={`w-full h-8 ${hasData ? accentClassName : "text-muted-foreground/40"}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {hasData ? (
            <>
              {segments.map((seg, i) => (
                <polyline
                  key={i}
                  points={seg.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={2.2} fill="currentColor" />
              ))}
            </>
          ) : (
            <line
              x1={PAD}
              y1={HEIGHT - PAD - 2}
              x2={WIDTH - PAD}
              y2={HEIGHT - PAD - 2}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          )}
        </svg>

        <p className="text-xs text-muted-foreground">{label}</p>

        {expanded && !disabled && <div className="pt-1">{children}</div>}
      </CardContent>
    </Card>
  );
}
