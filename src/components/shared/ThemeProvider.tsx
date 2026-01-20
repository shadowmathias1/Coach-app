'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  resolvedMode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'coach-app-theme';
const DEFAULT_PREFERENCE: ThemePreference = 'system';

function getSystemMode() {
  if (typeof window === 'undefined') return 'dark' as ThemeMode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [resolvedMode, setResolvedMode] = useState<ThemeMode>('dark');

  const applyMode = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(`theme-${mode}`);
    root.style.colorScheme = mode;
    setResolvedMode(mode);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    setPreference(stored ?? DEFAULT_PREFERENCE);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preference === 'system') {
        applyMode(getSystemMode());
      }
    };

    if (preference === 'system') {
      window.localStorage.removeItem(STORAGE_KEY);
      applyMode(getSystemMode());
      media.addEventListener('change', handleChange);
    } else {
      window.localStorage.setItem(STORAGE_KEY, preference);
      applyMode(preference);
    }

    return () => {
      media.removeEventListener('change', handleChange);
    };
  }, [applyMode, preference]);

  const value = useMemo(
    () => ({ preference, setPreference, resolvedMode }),
    [preference, resolvedMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
