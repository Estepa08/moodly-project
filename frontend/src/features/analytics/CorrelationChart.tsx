import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "../../lib/chart-tooltip";
import { cn } from "../../lib/utils";

interface CorrelationLine {
  dataKey: string;
  stroke: string;
  label: string;
}

interface CorrelationChartProps {
  data: Record<string, unknown>[];
  lines: CorrelationLine[];
  formatLabel?: (name: string, value: number, row?: Record<string, unknown>) => string;
  height?: number;
  className?: string;
}

export function CorrelationChart({
  data,
  lines,
  formatLabel,
  height = 160,
  className,
}: CorrelationChartProps) {
  return (
    <div className={cn("animate-in fade-in slide-in-from-top-1", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
          <XAxis dataKey="date" fontSize={9} stroke="hsl(var(--chart-tick))" />
          <YAxis domain={[0, 10]} fontSize={9} stroke="hsl(var(--chart-tick))" />
          <Tooltip
            content={
              <ChartTooltip
                formatLabel={(name, value, row) => {
                  if (formatLabel) return formatLabel(name, value, row);
                  const entryValues = (row?._values as Record<string, number[]> | undefined)?.[
                    name
                  ];
                  if (entryValues && entryValues.length > 1) {
                    return `${name}: ${(value as number).toFixed(1)} (${entryValues.join(", ")})`;
                  }
                  return `${name}: ${value}`;
                }}
              />
            }
          />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2">
        {lines.map((line) => (
          <span
            key={line.dataKey}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.stroke }} />
            {line.label}
          </span>
        ))}
      </div>
    </div>
  );
}
