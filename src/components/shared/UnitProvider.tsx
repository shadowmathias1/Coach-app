'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLanguage } from './LanguageProvider';

export type UnitSystem = 'metric' | 'imperial';

interface UnitContextValue {
  unit: UnitSystem;
  setUnit: (value: UnitSystem) => void;
}

const UnitContext = createContext<UnitContextValue | undefined>(undefined);

const STORAGE_KEY = 'coach-app-units';

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const [unit, setUnitState] = useState<UnitSystem>('metric');

  const setUnit = useCallback((value: UnitSystem) => {
    setUnitState(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as UnitSystem | null;
    if (stored === 'metric' || stored === 'imperial') {
      setUnitState(stored);
      return;
    }
    setUnitState(language === 'en' ? 'imperial' : 'metric');
  }, [language]);

  const value = useMemo(() => ({ unit, setUnit }), [unit, setUnit]);

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnits() {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnits must be used within UnitProvider');
  }
  return context;
}
