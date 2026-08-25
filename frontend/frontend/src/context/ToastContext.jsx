import { createContext, useCallback, useContext, useRef, useState } from 'react';
import '../styles/toast.css';

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 220);
  }, []);

  const push = useCallback(
    (message, { type = 'info', duration = 4000 } = {}) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type, closing: false }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  const value = {
    push,
    success: (msg, opts) => push(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => push(msg, { ...opts, type: 'error' }),
    info: (msg, opts) => push(msg, { ...opts, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.closing ? 'toast-closing' : ''}`}
            role="status"
          >
            <span className="toast-icon">
              {t.type === 'success' && <i className="ti ti-circle-check" />}
              {t.type === 'error' && <i className="ti ti-alert-circle" />}
              {t.type === 'info' && <i className="ti ti-info-circle" />}
            </span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <i className="ti ti-x" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook is intentional
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
