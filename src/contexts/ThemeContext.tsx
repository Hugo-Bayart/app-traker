import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, ThemeId, THEMES, DEFAULT_THEME_ID, getThemeById } from '../themes';

const STORAGE_KEY = 'goal-tracker-theme';

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const v = theme.vars;

  root.style.setProperty('--clr-bg', v.bg);
  root.style.setProperty('--clr-surface', v.card);
  root.style.setProperty('--clr-surface-2', v.surface2);
  root.style.setProperty('--clr-accent1', v.accent1);
  root.style.setProperty('--clr-accent2', v.accent2);
  root.style.setProperty('--clr-accent3', v.accent3);
  root.style.setProperty('--clr-primary', v.accent1);
  root.style.setProperty('--clr-primary-hover', v.accent2);
  root.style.setProperty('--clr-primary-light', v.primaryLight);
  root.style.setProperty('--clr-primary-shadow', v.primaryShadow);
  root.style.setProperty('--clr-text', v.textPrimary);
  root.style.setProperty('--clr-text-secondary', v.textSecondary);
  root.style.setProperty('--clr-text-muted', v.textMuted);
  root.style.setProperty('--clr-border', v.border);
  root.style.setProperty('--radius-card', v.radiusCard);
  root.style.setProperty('--radius-btn', v.radiusBtn);
  root.style.setProperty('--radius-pill', v.radiusPill);
  root.style.setProperty('--radius-icon', v.radiusIcon);
  root.style.setProperty('--font-title', v.titleFont);
  root.style.setProperty('--font-data', v.dataFont);
  root.style.setProperty('--title-transform', v.titleTransform);
  root.style.setProperty('--title-weight', v.titleWeight);
  root.style.setProperty('--data-weight', v.dataWeight);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    return stored && THEMES.some(t => t.id === stored) ? stored : DEFAULT_THEME_ID;
  });

  const theme = getThemeById(themeId);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setThemeId(id: ThemeId) {
    setThemeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
