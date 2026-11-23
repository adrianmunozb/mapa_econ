import { useEffect, useMemo, type ReactNode } from 'react';
import { LangContext, STRINGS_EN, type Lang } from './i18n';

export function LangProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  const value = useMemo(
    () => ({
      lang: 'en' as Lang,
      setLang: () => {},
      t: STRINGS_EN,
    }),
    [],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
