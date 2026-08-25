import './common.css';

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="clms-search-box">
      <i className="ti ti-search" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
