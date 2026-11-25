import { useEffect, useMemo, type ReactNode } from 'react';
import { LangContext, STRINGS_ES, type Lang } from './i18n';

export function LangProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = 'es';
  }, []);

  const value = useMemo(
    () => ({
      lang: 'es' as Lang,
      setLang: () => {},
      t: STRINGS_ES,
    }),
    [],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
