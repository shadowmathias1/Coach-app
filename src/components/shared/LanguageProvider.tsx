'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextValue {
  language: Language;
  setLanguage: (value: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'coach-app-language';
const DEFAULT_LANGUAGE: Language = 'fr';

function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  const setLanguage = useCallback((value: Language) => {
    setLanguageState(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    setLanguageState(stored ?? detectLanguage());
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
