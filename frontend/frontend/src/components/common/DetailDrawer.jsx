import { useEffect } from 'react';
import './common.css';

export function DetailDrawer({ open, title, subtitle, onClose, children }) {
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
    <>
      <div className="clms-drawer-overlay" onClick={onClose} />
      <div className="clms-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="clms-drawer-head">
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--cream)' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>{subtitle}</p>
            )}
          </div>
          <button className="clms-modal-close" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="clms-drawer-body">{children}</div>
      </div>
    </>
  );
}
