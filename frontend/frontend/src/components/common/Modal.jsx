import { useEffect } from 'react';
import './common.css';

export function Modal({ open, title, onClose, children, footer, width }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="clms-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="clms-modal" style={width ? { maxWidth: width } : undefined} role="dialog" aria-modal="true" aria-label={title}>
        <div className="clms-modal-head">
          <h3>{title}</h3>
          <button className="clms-modal-close" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="clms-modal-body">{children}</div>
        {footer && <div className="clms-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
