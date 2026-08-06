import { useMemo, useState } from 'react';
import type { CountryData } from '../types';
import { flagEmoji } from '../lib/flag';
import { useLang } from '../i18n';

interface Props {
  countries: CountryData[];
  onPick: (iso3: string) => void;
}

export function SearchBox({ countries, onPick }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const { t } = useLang();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const starts = countries.filter((c) => c.name.toLowerCase().startsWith(q));
    const contains = countries.filter(
      (c) => !c.name.toLowerCase().startsWith(q) && c.name.toLowerCase().includes(q),
    );
    return [...starts, ...contains].slice(0, 8);
  }, [query, countries]);

  const pick = (iso3: string) => {
    onPick(iso3);
    setQuery('');
    setFocused(false);
  };

  return (
    <div className="search">
      <input
        className="search__input"
        type="text"
        placeholder={t.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) pick(results[0].iso3);
          if (e.key === 'Escape') setQuery('');
        }}
      />
      {focused && results.length > 0 && (
        <ul className="search__results scroll-slim">
          {results.map((c) => (
            <li key={c.iso3}>
              <button className="search__row" onMouseDown={() => pick(c.iso3)}>
                <span className="search__flag">{flagEmoji(c.iso2)}</span>
                <span className="search__name">{c.name}</span>
                <span className="search__region">{c.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
