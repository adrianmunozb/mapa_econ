import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { LangContext, STORAGE_KEY, STRINGS, type Lang } from './i18n';

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'de' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* private mode */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: STRINGS[lang] }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
