import './charts.css';

/** @param {{data:{m:string,v:number}[], height?:number}} props */
export function BarChart({ data, height = 160 }) {
  const max = Math.max(1, ...data.map((d) => d.v));

  if (data.every((d) => d.v === 0)) {
    return (
      <div className="clms-chart-empty" style={{ height }}>
        No activity recorded for this period yet.
      </div>
    );
  }

  return (
    <div className="clms-bar-chart" style={{ height }}>
      {data.map((d, i) => (
        <div className="clms-bar-col" key={d.key || d.m}>
          <div
            className="clms-bar"
            style={{ height: `${(d.v / max) * 100}%`, animationDelay: `${i * 0.04}s` }}
            title={`${d.m}: ${d.v}`}
          />
          <span className="clms-bar-label">{d.m}</span>
        </div>
      ))}
    </div>
  );
}
