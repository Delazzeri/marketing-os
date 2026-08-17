export interface PieSlice {
  label: string;
  color: string;
  count: number;
  path: string;
  percent: number;
}

/** Builds SVG arc paths for a pie chart centered at (cx, cy) with the given radius. */
export function buildPieSlices(
  options: { label: string; color: string; count: number }[],
  cx: number,
  cy: number,
  radius: number,
): PieSlice[] {
  const total = options.reduce((sum, option) => sum + option.count, 0);
  if (total === 0) return [];

  let angle = -Math.PI / 2;
  return options.map((option) => {
    const fraction = option.count / total;
    const startAngle = angle;
    const endAngle = angle + fraction * Math.PI * 2;
    angle = endAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;

    const path =
      fraction >= 0.999
        ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { label: option.label, color: option.color, count: option.count, path, percent: Math.round(fraction * 100) };
  });
}
