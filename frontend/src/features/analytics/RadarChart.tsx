import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { animated } from "@react-spring/web";
import {
  ResponsiveRadar,
  type GridLabelProps,
  type RadarCustomLayer,
  type RadarCustomLayerProps,
} from "@nivo/radar";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { DistortionKey } from "../../lib/distortionsQuiz";

export interface DistortionEntry {
  key: DistortionKey;
  score: number;
}

interface Props {
  data: DistortionEntry[];
  previousData?: DistortionEntry[] | null;
  maxValue?: number;
  className?: string;
}

type RadarDatum = DistortionEntry & { label: string; [key: string]: unknown };

const LIBRARY_PATH = "/practices/distortions";

export default function RadarChart({ data, previousData, maxValue, className }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isNarrow = useMediaQuery("(max-width: 400px)");

  const labelledData = useMemo<RadarDatum[]>(
    () => data.map((d) => ({ ...d, label: t(`cognitiveDistortions.${d.key}`) })),
    [data, t],
  );

  const labelToKey = useMemo(
    () => new Map(labelledData.map((d) => [d.label, d.key])),
    [labelledData],
  );

  const scoreByKey = useMemo(() => new Map(data.map((d) => [d.key, d.score])), [data]);

  const prevScoreByKey = useMemo(() => {
    if (!previousData) return null;
    return new Map(previousData.map((d) => [d.key, d.score]));
  }, [previousData]);

  const GridLabel = ({ id, anchor, animated: spring }: GridLabelProps) => {
    const label = String(id);
    const key = labelToKey.get(label);
    const currentScore = key !== undefined ? scoreByKey.get(key) : undefined;
    const prevScore = key !== undefined ? prevScoreByKey?.get(key) : undefined;
    const hasDelta = currentScore !== undefined && prevScore !== undefined;
    const delta = hasDelta ? currentScore - prevScore : null;

    const onOpen = (event: React.MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      navigate(LIBRARY_PATH);
    };

    let deltaLabel: string | null = null;
    let deltaClass = "fill-muted-foreground";
    if (hasDelta && delta !== null) {
      if (delta > 0) {
        deltaLabel = `+${delta} ↑`;
        deltaClass = "fill-destructive";
      } else if (delta < 0) {
        deltaLabel = `${delta} ↓`;
        deltaClass = "fill-success";
      } else {
        deltaLabel = "0";
      }
    }

    return (
      <animated.g transform={spring.transform}>
        <a
          href={LIBRARY_PATH}
          onClick={onOpen}
          tabIndex={0}
          aria-label={t("testResults.thinkingPatternsOpenLibrary", { name: label })}
          className="cursor-pointer focus-visible:outline-none"
        >
          <text
            textAnchor={anchor}
            dominantBaseline="central"
            fontSize={isNarrow ? 10 : 11}
            fontWeight={600}
            className="fill-muted-foreground transition-colors duration-150 hover:fill-primary"
          >
            {label}
          </text>
          {deltaLabel !== null && !isNarrow && (
            <text
              y={13}
              textAnchor={anchor}
              dominantBaseline="central"
              fontSize={10}
              fontWeight={700}
              className={deltaClass}
            >
              {deltaLabel}
            </text>
          )}
        </a>
      </animated.g>
    );
  };

  const ComparisonLayer: RadarCustomLayer<RadarDatum> = ({
    centerX,
    centerY,
    radiusScale,
    angleStep,
  }: RadarCustomLayerProps<RadarDatum>) => {
    if (!previousData || previousData.length === 0) return null;

    const points = previousData.map((entry, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const radius = radiusScale(entry.score);
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

    return (
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--chart-tick))"
        strokeWidth={2}
        strokeDasharray="5 4"
        opacity={0.75}
        aria-hidden="true"
      />
    );
  };

  return (
    <div className={className} style={{ width: "100%", height: 300 }}>
      <ResponsiveRadar
        data={labelledData}
        indexBy="label"
        keys={["score"]}
        maxValue={maxValue ?? 9}
        margin={{ top: 44, right: isNarrow ? 40 : 60, bottom: 28, left: isNarrow ? 40 : 60 }}
        borderWidth={2}
        borderColor={{ from: "color" }}
        gridShape="circular"
        gridLabelOffset={12}
        gridLabel={GridLabel}
        layers={["grid", "layers", ComparisonLayer, "dots"]}
        dotSize={8}
        dotColor={{ from: "color" }}
        dotBorderWidth={2}
        dotBorderColor={{ from: "color" }}
        colors={["hsl(var(--primary))"]}
        fillOpacity={0.2}
        motionConfig="gentle"
        theme={{
          background: "transparent",
          text: {
            fill: "hsl(var(--muted-foreground))",
            fontSize: isNarrow ? 10 : 11,
            fontFamily: "Raleway, system-ui, sans-serif",
          },
          grid: {
            line: { stroke: "hsl(var(--chart-grid))", strokeWidth: 1.5 },
          },
          dots: { text: { fill: "hsl(var(--foreground))", fontSize: 10 } },
        }}
      />
    </div>
  );
}
