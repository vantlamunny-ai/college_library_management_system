import './common.css';

const TONE_CLASS = {
  success: 'clms-badge-success',
  warning: 'clms-badge-warning',
  danger: 'clms-badge-danger',
  neutral: 'clms-badge-neutral',
  info: 'clms-badge-info',
};

/** Maps common backend status strings to a visual tone. Override with `tone`. */
const STATUS_TONE = {
  Available: 'success',
  Issued: 'info',
  Reserved: 'warning',
  Returned: 'neutral',
  Overdue: 'danger',
  Damaged: 'danger',
  Lost: 'danger',
  New: 'success',
  Good: 'success',
  Pending: 'warning',
  Approved: 'success',
  Completed: 'success',
  Cancelled: 'neutral',
  Expired: 'neutral',
  Paid: 'success',
  Waived: 'info',
  Active: 'success',
  Inactive: 'neutral',
  Graduated: 'info',
  Blocked: 'danger',
};

export function StatusBadge({ status, tone, icon }) {
  const resolvedTone = tone || STATUS_TONE[status] || 'neutral';
  return (
    <span className={`clms-badge ${TONE_CLASS[resolvedTone]}`}>
      {icon && <i className={`ti ${icon}`} />}
      {status}
    </span>
  );
}
