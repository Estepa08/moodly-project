/** Точка на окружности радиуса r с центром (cx, cy) под углом angleDeg (0° = 12 часов, по часовой). */
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

/** SVG path одного сегмента-сектора колеса между двумя углами. */
export function describeWedge(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

/** Равновероятный выбор индекса сегмента — без весов, без «подкрутки» шансов. */
export function pickRandomSegmentIndex(segmentCount: number): number {
  return Math.floor(Math.random() * segmentCount);
}

/**
 * Считает конечный угол вращения (в градусах, без ограничения сверху — накопительно),
 * чтобы центр сегмента targetIndex оказался под неподвижным указателем на 12 часах.
 * 5-8 лишних полных оборотов + случайный джиттер внутри сегмента (не точно по центру) —
 * см. docs/plans/relaxation-wheel-strategy.md, раздел «Механика и анимация вращения».
 */
export function computeTargetRotation(
  currentRotation: number,
  targetIndex: number,
  segmentCount: number,
): number {
  const segmentAngle = 360 / segmentCount;
  const targetCenter = targetIndex * segmentAngle + segmentAngle / 2;
  const jitter = (Math.random() - 0.5) * segmentAngle * 0.6;
  const desiredAngle = targetCenter + jitter;

  const desiredMod = (((360 - desiredAngle) % 360) + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  const forwardDelta = (((desiredMod - currentMod) % 360) + 360) % 360;

  const extraTurns = 5 + Math.floor(Math.random() * 4); // 5-8 лишних оборотов
  return currentRotation + extraTurns * 360 + forwardDelta;
}
