import { useTranslation } from 'react-i18next';
import { describeWedge } from '../relaxation-wheel/wheelMath';
import type { ResponsibilityFactor } from './responsibilityPieRebalance';

interface ResponsibilityPieChartProps {
  factors: ResponsibilityFactor[];
}

const SLICE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--destructive) / 0.7)',
  'hsl(var(--muted-foreground) / 0.5)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--accent) / 0.6)',
];

const CX = 100;
const CY = 100;
const R = 90;

export default function ResponsibilityPieChart({ factors }: ResponsibilityPieChartProps) {
  const { t } = useTranslation();
  let cursor = 0;
  const slices = factors
    .filter((f) => f.percent > 0)
    .map((f, i) => {
      const startAngle = cursor;
      const endAngle = cursor + (f.percent / 100) * 360;
      cursor = endAngle;
      return {
        id: f.id,
        path: describeWedge(CX, CY, R, startAngle, endAngle),
        color: SLICE_COLORS[i % SLICE_COLORS.length],
      };
    });

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={t('responsibilityPie.chartLabel')}
      className="w-44 h-44 mx-auto"
    >
      {slices.map((slice) => (
        <path key={slice.id} d={slice.path} fill={slice.color} stroke="hsl(var(--card))" strokeWidth={2} />
      ))}
    </svg>
  );
}
