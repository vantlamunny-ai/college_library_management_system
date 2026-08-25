import './common.css';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="clms-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="clms-page-header-actions">{actions}</div>}
    </div>
  );
}
