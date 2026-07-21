import { ResponsiveRadar } from "@nivo/radar";
import { useTranslation } from "react-i18next";

export interface DistortionEntry {
  key: string;
  score: number;
}

interface Props {
  data: DistortionEntry[];
  maxValue?: number;
  className?: string;
}

export default function RadarChart({ data, maxValue, className }: Props) {
  const { t } = useTranslation();

  const labelledData = data.map((d) => ({
    ...d,
    label: t(`cognitiveDistortions.${d.key}`),
  }));

  return (
    <div className={className} style={{ width: "100%", height: 300 }}>
      <ResponsiveRadar
        data={labelledData}
        indexBy="label"
        keys={["score"]}
        maxValue={maxValue ?? 9}
        margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
        borderWidth={2}
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        gridShape="circular"
        gridLabelOffset={12}
        dotSize={6}
        dotColor={{ from: "color" }}
        dotBorderWidth={2}
        dotBorderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        colors={["#8B5CF6"]}
        fillOpacity={0.2}
        blendMode="multiply"
        motionConfig="gentle"
        theme={{
          background: "transparent",
          text: {
            fill: "#64748b",
            fontSize: 11,
            fontFamily: "Raleway, system-ui, sans-serif",
          },
          grid: {
            line: {
              stroke: "#e0d4f5",
              strokeWidth: 1,
            },
          },
          dots: {
            text: {
              fill: "#4C1D95",
              fontSize: 10,
            },
          },
        }}
      />
    </div>
  );
}
