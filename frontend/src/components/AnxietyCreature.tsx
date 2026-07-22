import { useReducedMotion } from "../hooks/useReducedMotion";

interface AnxietyCreatureProps {
  calmness: number;
  size?: number;
}

const STOPS = [
  { t: 0, hex: "#E08F2E" },
  { t: 0.3, hex: "#8B5CF6" },
  { t: 0.7, hex: "#8B5CF6" },
  { t: 1, hex: "#059669" },
];

function lerpColor(t: number): string {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t >= STOPS[i].t && t <= STOPS[i + 1].t) {
      const local = (t - STOPS[i].t) / (STOPS[i + 1].t - STOPS[i].t);
      const c1 = hexToRgb(STOPS[i].hex);
      const c2 = hexToRgb(STOPS[i + 1].hex);
      const r = Math.round(c1.r + (c2.r - c1.r) * local);
      const g = Math.round(c1.g + (c2.g - c1.g) * local);
      const b = Math.round(c1.b + (c2.b - c1.b) * local);
      return `rgb(${r},${g},${b})`;
    }
  }
  return STOPS[STOPS.length - 1].hex;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

export default function AnxietyCreature({ calmness, size = 200 }: AnxietyCreatureProps) {
  const reducedMotion = useReducedMotion();
  const t = Math.max(0, Math.min(1, calmness / 100));
  const color = lerpColor(t);

  const bodyScaleX = 0.9 + t * 0.1;
  const bodyRotate = -3 + t * 3;
  const eyeRy = 10 - t * 3;
  const pupilR = 2.5 + t * 1.5;
  const mouthCurve = 1 + t * 7;
  const blushOpacity = 0.15 + t * 0.45;
  const browAngle = 6 - t * 6;
  const armRaise = 58 - t * 16;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Calmness: ${calmness}%`}
      className="drop-shadow-xl"
    >
      <title>Calmness: {calmness}%</title>

      <defs>
        <radialGradient id="creatureGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="60" cy="60" r="50" fill="url(#creatureGlow)" />

      <g
        style={{
          transformOrigin: "60px 60px",
          transition: reducedMotion ? "none" : "transform 0.6s ease",
          transform: `scaleX(${bodyScaleX}) rotate(${bodyRotate}deg)`,
        }}
      >
        <path
          d="M60,14 C88,14 106,32 106,60 C106,88 88,106 60,106 C32,106 14,88 14,60 C14,32 32,14 60,14 Z"
          fill={color}
          style={{ transition: reducedMotion ? "none" : "fill 0.8s ease" }}
        />
      </g>

      <g>
        <path
          d={`M 16,${armRaise} Q 4,${armRaise - 4} 6,${armRaise - 12}`}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          style={{ transition: reducedMotion ? "none" : "all 0.6s ease" }}
        />
        <path
          d={`M 104,${armRaise} Q 116,${armRaise - 4} 114,${armRaise - 12}`}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          style={{ transition: reducedMotion ? "none" : "all 0.6s ease" }}
        />
      </g>

      <path
        d={`M 36,${36 + browAngle} L 50,${36 - browAngle * 0.6}`}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
        style={{ transition: reducedMotion ? "none" : "all 0.6s ease" }}
      />
      <path
        d={`M 70,${36 - browAngle * 0.6} L 84,${36 + browAngle}`}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
        style={{ transition: reducedMotion ? "none" : "all 0.6s ease" }}
      />

      <ellipse cx="43" cy="48" rx="9" ry={eyeRy} fill="white" opacity="0.95" />
      <circle cx="43" cy="48" r={pupilR + 2} fill={color} opacity="0.8" />
      <circle cx="43" cy="48" r={pupilR} fill="hsl(var(--foreground))" />
      <circle cx="44.5" cy="46.5" r="1.2" fill="white" opacity="0.8" />

      <ellipse cx="77" cy="48" rx="9" ry={eyeRy} fill="white" opacity="0.95" />
      <circle cx="77" cy="48" r={pupilR + 2} fill={color} opacity="0.8" />
      <circle cx="77" cy="48" r={pupilR} fill="hsl(var(--foreground))" />
      <circle cx="78.5" cy="46.5" r="1.2" fill="white" opacity="0.8" />

      <ellipse cx="30" cy="62" rx="6" ry="4" fill="hsl(350, 80%, 75%)" opacity={blushOpacity} />
      <ellipse cx="90" cy="62" rx="6" ry="4" fill="hsl(350, 80%, 75%)" opacity={blushOpacity} />

      <path
        d={`M 48,65 Q 60,${65 - mouthCurve} 72,65`}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.65"
        style={{ transition: reducedMotion ? "none" : "all 0.6s ease" }}
      />
    </svg>
  );
}
