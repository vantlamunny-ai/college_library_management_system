import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeSwitcher.css';

/**
 * Sits inline in a sidebar, right above the logout link, on purpose, not
 * a floating corner button. Reuses whatever nav-item class the calling
 * sidebar already uses (clms-nav-item / sdg-nav-item / ag-nav-item /
 * lcg-nav-item) so it looks like a native part of that sidebar instead of
 * a bolted-on widget. Popup opens upward since this sits near the bottom
 * of the page.
 */
export function ThemeSwitcher({ itemClassName = 'clms-nav-item', labelClassName = '' }) {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="clms-theme-switcher">
      {open && (
        <div className="clms-theme-popup">
          <div className="clms-theme-popup-label">Theme</div>
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`clms-theme-option ${t.id === theme ? 'active' : ''}`}
              onClick={() => { setTheme(t.id); setOpen(false) }}
            >
              <span className="clms-theme-swatch-row">
                {t.swatches.slice(0, 4).map((c, i) => (
                  <span key={i} className="clms-theme-dot" style={{ background: c, marginLeft: i === 0 ? 0 : -4 }} />
                ))}
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className={itemClassName}
        onClick={() => setOpen((v) => !v)}
        title="Change theme"
      >
        <i className="ti ti-palette" />
        <span className={labelClassName}>Theme</span>
      </button>
    </div>
  );
}
