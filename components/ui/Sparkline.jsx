// Minimal inline sparkline — no charting library needed for a 7-point trend.
// Line stays in the de-emphasis gray; only the current (last) point carries
// the tile's accent color, per the stat-tile trend contract.
export function Sparkline({ data, accentClassName = "text-ink", width = 56, height = 22 }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1);
  const stepX = width / (data.length - 1);
  const pad = 3;
  const scaleY = (v) => height - pad - (v / max) * (height - pad * 2);

  const points = data.map((v, i) => [i * stepX, scaleY(v)]);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink6" />
      {/* surface-color ring + accent dot marks the current period */}
      <circle cx={lastX} cy={lastY} r="4.5" className="text-surf" fill="currentColor" />
      <circle cx={lastX} cy={lastY} r="3" className={accentClassName} fill="currentColor" />
    </svg>
  );
}
