import './common.css';

/** @param {{options:string[], active:string, onChange:(v:string)=>void}} props */
export function FilterChips({ options, active, onChange }) {
  return (
    <div className="clms-filter-chips">
      {options.map((opt) => (
        <button
          key={opt}
          className={`clms-chip-filter ${active === opt ? 'active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/** @param {{value:string, onChange:(v:string)=>void, options:{value:string,label:string}[], ariaLabel?:string}} props */
export function SelectFilter({ value, onChange, options, ariaLabel }) {
  return (
    <select className="clms-select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toolbar({ children }) {
  return <div className="clms-toolbar">{children}</div>;
}
