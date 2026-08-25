import { Modal } from './Modal';
import './common.css';

/**
 * @param {{
 *  open:boolean, title:string, message:string, confirmLabel?:string,
 *  tone?:'danger'|'neutral', loading?:boolean, onConfirm:()=>void, onCancel:()=>void
 * }} props
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="clms-btn clms-btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={`clms-btn ${tone === 'danger' ? 'clms-btn-danger' : 'clms-btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <span className="clms-spinner" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className={`clms-confirm-icon ${tone === 'neutral' ? 'is-neutral' : ''}`}>
        <i className={`ti ${tone === 'danger' ? 'ti-alert-triangle' : 'ti-info-circle'}`} />
      </div>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.86rem', lineHeight: 1.5 }}>{message}</p>
    </Modal>
  );
}
