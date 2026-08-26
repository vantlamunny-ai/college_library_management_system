import { createContext, useContext, useEffect, useState } from 'react';
import { THEMES, THEME_GROUPS } from './themes';

const THEME_STORAGE_KEY = 'clms_theme';
const DEFAULT_THEME = 'forest';
const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.some((t) => t.id === stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private browsing, etc.) — theme just won't persist.
    }
  }, [theme]);

  function setTheme(id) {
    if (THEMES.some((t) => t.id === id)) setThemeState(id);
  }

  return <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, groups: THEME_GROUPS }}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook is intentional
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
