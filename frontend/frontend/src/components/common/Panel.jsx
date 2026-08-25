import './common.css';

export function Panel({ title, headerRight, children, className = '', glass = false }) {
  return (
    <section className={`clms-panel ${glass ? 'clms-panel-glass' : ''} ${className}`}>
      {(title || headerRight) && (
        <div className="clms-panel-head">
          {title && <h2>{title}</h2>}
          {headerRight}
        </div>
      )}
      {children}
    </section>
  );
}
