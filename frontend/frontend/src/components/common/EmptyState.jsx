import './common.css';

export function EmptyState({ icon = 'ti-inbox', title = 'Nothing here yet', message, action }) {
  return (
    <div className="clms-state">
      <div className="clms-state-icon">
        <i className={`ti ${icon}`} />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
