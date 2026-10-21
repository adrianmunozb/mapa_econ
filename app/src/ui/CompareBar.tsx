import type { CountryData } from '../types';
import { Flag } from './Flag';
import { fmt, useLang } from '../i18n';

interface Props {
  countries: CountryData[];
  onRemove: (iso3: string) => void;
  onClear: () => void;
  onOpen: () => void;
}

export function CompareBar({ countries, onRemove, onClear, onOpen }: Props) {
  const { t } = useLang();
  if (countries.length === 0) return null;
  return (
    <div className="compare-bar hud">
      <span className="compare-bar__label">{t.compareBar}</span>
      <div className="compare-bar__chips">
        {countries.map((c) => (
          <span key={c.iso3} className="chip">
            <Flag iso2={c.iso2} className="chip__flag" />
            {c.name}
            <button className="chip__x" onClick={() => onRemove(c.iso3)} aria-label={t.remove}>
              ×
            </button>
          </span>
        ))}
      </div>
      <button className="btn btn--primary" disabled={countries.length < 2} onClick={onOpen}>
        {fmt(t.compareBtn, { n: countries.length })}
      </button>
      <button className="btn" onClick={onClear}>
        {t.clear}
      </button>
    </div>
  );
}
