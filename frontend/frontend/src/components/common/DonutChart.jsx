import './charts.css';

const DEFAULT_COLORS = ['var(--gold)', 'var(--info)', '#8a9a7c', 'var(--danger)', 'var(--warning)'];

function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = (a) => ((a - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

/** @param {{segments:{label:string, value:number, color?:string}[]}} props */
export function DonutChart({ segments }) {
  const total = segments.reduce((s, c) => s + c.value, 0);

  if (total === 0) {
    return <div className="clms-chart-empty" style={{ height: 160 }}>No data available yet.</div>;
  }

  const arcs = segments.map((seg, i) => {
    const prefix = segments.slice(0, i).reduce((sum, s) => sum + s.value, 0);
    const start = (prefix / total) * 360;
    const end = ((prefix + seg.value) / total) * 360;
    return { ...seg, start, end, color: seg.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] };
  });

  return (
    <div className="clms-donut-wrap">
      <svg viewBox="0 0 120 120" className="clms-donut">
        {arcs.map((seg) =>
          seg.value > 0 ? <path key={seg.label} d={describeArc(60, 60, 55, seg.start, seg.end)} fill={seg.color} /> : null
        )}
        <circle cx="60" cy="60" r="34" fill="var(--forest-panel)" />
      </svg>
      <div className="clms-donut-legend">
        {arcs.map((seg) => (
          <div className="clms-legend-row" key={seg.label}>
            <span className="clms-legend-dot" style={{ background: seg.color }} />
            <span className="clms-legend-label">{seg.label}</span>
            <span className="clms-legend-value">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
