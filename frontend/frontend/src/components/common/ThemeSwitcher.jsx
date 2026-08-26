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
 *
 * Two-step popup: opening it always starts on the Dark/Light mode picker,
 * picking a mode then shows that mode's theme swatches with a back arrow.
 */
export function ThemeSwitcher({ itemClassName = 'clms-nav-item', labelClassName = '' }) {
  const { theme, setTheme, groups } = useTheme();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // null = mode picker, else 'dark' | 'light'

  function close() {
    setOpen(false);
    setMode(null);
  }

  const activeGroup = groups.find((g) => g.mode === mode);

  return (
    <div className="clms-theme-switcher">
      {open && (
        <div className="clms-theme-popup" role="menu" aria-label="Choose a theme">
          {!activeGroup ? (
            <>
              <div className="clms-theme-popup-label">Theme</div>
              {groups.map((g) => (
                <button
                  key={g.mode}
                  type="button"
                  role="menuitem"
                  className="clms-theme-mode-option"
                  onClick={() => setMode(g.mode)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`clms-theme-mode-icon is-${g.mode}`}>
                      <i className={`ti ${g.mode === 'dark' ? 'ti-moon' : 'ti-sun'}`} />
                    </span>
                    {g.label}
                  </span>
                  <i className="ti ti-chevron-right" />
                </button>
              ))}
            </>
          ) : (
            <>
              <button type="button" className="clms-theme-back" onClick={() => setMode(null)}>
                <i className="ti ti-chevron-left" /> {activeGroup.label}
              </button>
              {activeGroup.themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={t.id === theme}
                  className={`clms-theme-option ${t.id === theme ? 'active' : ''}`}
                  onClick={() => { setTheme(t.id); close(); }}
                >
                  <span className="clms-theme-swatch-row">
                    {t.swatches.slice(0, 4).map((c, i) => (
                      <span key={i} className="clms-theme-dot" style={{ background: c, marginLeft: i === 0 ? 0 : -4 }} />
                    ))}
                  </span>
                  <span>{t.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
      <button
        type="button"
        className={itemClassName}
        onClick={() => setOpen((v) => { const next = !v; if (!next) setMode(null); return next; })}
        title="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <i className="ti ti-palette" />
        <span className={labelClassName}>Theme</span>
      </button>
    </div>
  );
}
