import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Floating, mounted once at the app root so it's reachable from every
 * page — including Login and the 4 preserved ZIP pages, which don't share
 * the common `Topbar`. Fixed-position by design: adding it doesn't touch
 * any existing page's layout.
 */
export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const active = themes.find((t) => t.id === theme) || themes[0];

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 500 }}>
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 52,
            right: 0,
            background: 'var(--forest-panel)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 12,
            boxShadow: 'var(--shadow-md)',
            width: 200,
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
            Theme
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTheme(t.id); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit',
                  background: t.id === theme ? 'rgba(var(--gold-rgb), 0.15)' : 'transparent',
                  color: t.id === theme ? 'var(--gold)' : 'var(--cream)',
                }}
              >
                <span style={{ display: 'flex', flexShrink: 0 }}>
                  {t.swatches.slice(0, 4).map((c, i) => (
                    <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c, marginLeft: i === 0 ? 0 : -4, border: '1px solid rgba(0,0,0,0.25)' }} />
                  ))}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: t.id === theme ? 700 : 500 }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        aria-label="Change theme"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 46, height: 46, borderRadius: '50%', border: '1px solid var(--border)',
          background: `conic-gradient(${active.swatches.join(', ')})`,
          cursor: 'pointer', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <i className="ti ti-palette" style={{ fontSize: 18, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }} />
      </button>
    </div>
  );
}
