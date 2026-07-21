import { useMemo } from "react";

interface AnxietyCreatureProps {
  calmness: number;
  size?: number;
}

const STOPS = [
  { t: 0, color: "#ef4444" },
  { t: 0.25, color: "#f97316" },
  { t: 0.5, color: "#8B5CF6" },
  { t: 0.75, color: "#6366f1" },
  { t: 1, color: "#059669" },
];

function lerpColor(colors: { t: number; color: string }[], t: number): string {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < colors.length - 1; i++) {
    if (t >= colors[i].t && t <= colors[i + 1].t) {
      const local = (t - colors[i].t) / (colors[i + 1].t - colors[i].t);
      const c1 = hexToRgb(colors[i].color);
      const c2 = hexToRgb(colors[i + 1].color);
      const r = Math.round(c1.r + (c2.r - c1.r) * local);
      const g = Math.round(c1.g + (c2.g - c1.g) * local);
      const b = Math.round(c1.b + (c2.b - c1.b) * local);
      return `rgb(${r},${g},${b})`;
    }
  }
  return colors[colors.length - 1].color;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

export default function AnxietyCreature({ calmness, size = 200 }: AnxietyCreatureProps) {
  const t = calmness / 100;
  const color = lerpColor(STOPS, t);
  const pulseDuration = 0.3 + t * 2.7;
  const scale = 0.92 + t * 0.08;
  const eyeOpenness = 1 - t * 0.6;
  const mouthY = 62 + t * 4;
  const mouthCurve = -8 + t * 14;

  const filterStyle = useMemo(() => ({
    filter: "url(#creatureBlur)",
    transition: "fill 0.8s ease",
  }), []);

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className="drop-shadow-xl"
      style={{
        animation: `creaturePulse ${pulseDuration}s ease-in-out infinite`,
        transformOrigin: "center",
      }}
    >
      <defs>
        <filter id="creatureBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
        <radialGradient id="creatureGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="50" fill="url(#creatureGlow)" opacity="0.5" />
      <circle cx="60" cy="60" r="42" fill={color} style={filterStyle} />
      <g
        style={{
          transition: "transform 0.6s ease",
          transform: `scale(${scale})`,
          transformOrigin: "60px 60px",
        }}
      >
        <ellipse cx="45" cy="52" rx={6 + eyeOpenness * 3} ry={8 * eyeOpenness + 1} fill="white" opacity="0.9">
          <animate attributeName="ry" values={`${8 * eyeOpenness + 1}`} dur="3s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="75" cy="52" rx={6 + eyeOpenness * 3} ry={8 * eyeOpenness + 1} fill="white" opacity="0.9">
          <animate attributeName="ry" values={`${8 * eyeOpenness + 1}`} dur="3s" repeatCount="indefinite" keyTimes="0;0.48;0.5;0.98;1" />
        </ellipse>
        <circle cx="45" cy="52" r={4 - t * 2} fill="#1e1b4b" opacity={0.8 - t * 0.3} />
        <circle cx="75" cy="52" r={4 - t * 2} fill="#1e1b4b" opacity={0.8 - t * 0.3} />
      </g>
      <path
        d={`M 45 ${mouthY} Q 60 ${mouthY + mouthCurve} 75 ${mouthY}`}
        fill="none"
        stroke="#1e1b4b"
        strokeWidth={2 - t * 0.5}
        strokeLinecap="round"
        opacity={0.6 + t * 0.2}
        style={{ transition: "all 0.6s ease" }}
      />
      <style>{`
        @keyframes creaturePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>
    </svg>
  );
}
