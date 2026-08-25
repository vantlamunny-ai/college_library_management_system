import './common.css';

export function SkeletonRows({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="clms-skeleton clms-skeleton-row" style={{ animationDelay: `${i * 0.05}s` }} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="clms-stat-row">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="clms-skeleton clms-skeleton-card" style={{ animationDelay: `${i * 0.05}s` }} />
      ))}
    </div>
  );
}

export function SkeletonBlock({ height }) {
  return <div className="clms-skeleton clms-skeleton-block" style={height ? { height } : undefined} />;
}
