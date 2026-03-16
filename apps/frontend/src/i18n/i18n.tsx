import { useMemo, useState, type ReactNode } from 'react';

import {
  I18nContext,
  STORAGE_KEY,
  type I18nContextValue,
  type Language,
  getInitialLanguage,
  interpolate,
  resolveTranslation,
} from './shared';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  }

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (text, vars) => {
      const base = language === 'en' ? resolveTranslation(text) : text;
      return interpolate(base, vars);
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
