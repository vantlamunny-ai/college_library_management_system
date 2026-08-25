import './common.css';

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="clms-state is-error">
      <div className="clms-state-icon">
        <i className="ti ti-alert-triangle" />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {onRetry && (
        <button className="clms-btn clms-btn-ghost" onClick={onRetry}>
          <i className="ti ti-refresh" /> Try again
        </button>
      )}
    </div>
  );
}

/**
 * Distinct from ErrorState: used when a feature is blocked because the
 * backend hasn't shipped the endpoint yet (see plan's "Known backend gaps").
 * Communicates this honestly instead of showing a broken screen or fake data.
 */
export function UnavailableState({ title = 'Not available yet', message }) {
  return (
    <div className="clms-state">
      <div className="clms-state-icon">
        <i className="ti ti-tool" />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}
