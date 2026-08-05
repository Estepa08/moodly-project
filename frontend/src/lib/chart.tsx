import { ReactNode } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import EmptyState from "../components/ui/empty-state";
import PeriodSelector from "../components/ui/PeriodSelector";
import type { LucideIcon } from "lucide-react";
import { cn } from "./utils";

export interface ChartSeries {
  dataKey: string;
  color: string;
  label: string;
}

export interface ChartProps {
  type: "line" | "bar" | "pie" | "area";
  data: Record<string, unknown>[];
  series: ChartSeries[];
  xKey: string;

  title?: string;
  icon?: ReactNode;
  noCard?: boolean;

  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;

  periodOptions?: { key: string; label: string }[];
  period?: string;
  onPeriodChange?: (value: string) => void;
  periodLabel?: string;

  formatTooltip?: (name: string, value: number, row?: Record<string, unknown>) => string;

  height?: number;
  yDomain?: [number, number];
  showLegend?: boolean;
  showDots?: boolean;
  connectNulls?: boolean;
  barRadius?: [number, number, number, number];
  pieInnerRadius?: number | string;
  pieOuterRadius?: number | string;
  pieColors?: string[];

  footer?: ReactNode;
  className?: string;
}

export function Chart({
  type,
  data,
  series,
  xKey,
  title,
  icon,
  noCard,
  isLoading,
  emptyMessage,
  emptyIcon,
  periodOptions,
  period,
  onPeriodChange,
  periodLabel,
  formatTooltip,
  height = 220,
  yDomain = [0, 10],
  showLegend = false,
  showDots = true,
  connectNulls = true,
  barRadius = [4, 4, 0, 0],
  pieInnerRadius,
  pieOuterRadius = 80,
  pieColors,
  footer,
  className,
}: ChartProps) {
  if (isLoading) return null;

  const hasData = data.length > 0;

  const chart = (
    <>
      {periodOptions && period && onPeriodChange && (
        <div className="mb-3">
          <PeriodSelector
            options={periodOptions}
            value={period}
            onChange={onPeriodChange}
            size="sm"
            label={periodLabel}
          />
        </div>
      )}

      {!hasData ? (
        <EmptyState icon={emptyIcon} title={emptyMessage ?? title ?? ""} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={height}>
            {type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis dataKey={xKey} fontSize={11} stroke="hsl(var(--chart-tick))" />
                <YAxis domain={yDomain} fontSize={11} stroke="hsl(var(--chart-tick))" />
                <Tooltip content={<ChartTooltip formatLabel={formatTooltip} />} />
                {showLegend && (
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "hsl(var(--muted-foreground))",
                    }}
                  />
                )}
                {series.map((s) => (
                  <Line
                    key={s.dataKey}
                    type="monotone"
                    dataKey={s.dataKey}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={showDots ? { r: 4 } : false}
                    connectNulls={connectNulls}
                  />
                ))}
              </LineChart>
            ) : type === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis dataKey={xKey} fontSize={11} stroke="hsl(var(--chart-tick))" />
                <YAxis domain={yDomain} fontSize={11} stroke="hsl(var(--chart-tick))" />
                <Tooltip content={<ChartTooltip formatLabel={formatTooltip} />} />
                {showLegend && (
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "hsl(var(--muted-foreground))",
                    }}
                  />
                )}
                {series.map((s) => (
                  <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.color} radius={barRadius} />
                ))}
              </BarChart>
            ) : type === "area" ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis dataKey={xKey} fontSize={11} stroke="hsl(var(--chart-tick))" />
                <YAxis domain={yDomain} fontSize={11} stroke="hsl(var(--chart-tick))" />
                <Tooltip content={<ChartTooltip formatLabel={formatTooltip} />} />
                {showLegend && (
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "hsl(var(--muted-foreground))",
                    }}
                  />
                )}
                {series.map((s) => (
                  <Area
                    key={s.dataKey}
                    type="monotone"
                    dataKey={s.dataKey}
                    stroke={s.color}
                    fill={s.color}
                    fillOpacity={0.2}
                    strokeWidth={2}
                    connectNulls={connectNulls}
                  />
                ))}
              </AreaChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  dataKey={series[0]?.dataKey ?? "value"}
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={pieOuterRadius}
                  innerRadius={pieInnerRadius}
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={pieColors?.[i] ?? series[0]?.color ?? "hsl(var(--primary))"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatLabel={formatTooltip} />} />
              </PieChart>
            )}
          </ResponsiveContainer>

          {footer && <div className="mt-3">{footer}</div>}
        </>
      )}
    </>
  );

  if (noCard) return chart;

  return (
    <Card className={cn("shadow-neumorphic", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {icon && (
              <span aria-hidden="true" className="w-4 h-4 text-primary">
                {icon}
              </span>
            )}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>{chart}</CardContent>
    </Card>
  );
}
