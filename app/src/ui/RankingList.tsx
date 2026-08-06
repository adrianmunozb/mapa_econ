import { useEffect, useRef, useState } from 'react';
import type { CountryData } from '../types';
import { flagEmoji } from '../lib/flag';
import { useLang } from '../i18n';

interface Props {
  countries: CountryData[];
  getValue: (c: CountryData) => number | undefined;
  format: (v: number) => string;
  ascending: boolean; // true → smallest first (rank 1 = lowest)
  label: string;
  selectedIso: string | null;
  onPick: (iso3: string) => void;
}

interface Row {
  iso3: string;
  name: string;
  iso2?: string;
  value: number;
}

export function RankingList({ countries, getValue, format, ascending, label, selectedIso, onPick }: Props) {
  const [open, setOpen] = useState(true);
  const { t } = useLang();
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // Scroll the selected country's row into view when the selection changes
  // (e.g. after clicking a country on the map).
  useEffect(() => {
    if (open && selectedIso && activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIso, open, label]);

  const rows: Row[] = [];
  for (const c of countries) {
    const v = getValue(c);
    if (typeof v === 'number') rows.push({ iso3: c.iso3, name: c.name, iso2: c.iso2, value: v });
  }
  rows.sort((a, b) => (ascending ? a.value - b.value : b.value - a.value));

  const values = rows.map((r) => r.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = max - min || 1;

  return (
    <div className="ranking">
      <button className="ranking__toggle" onClick={() => setOpen((o) => !o)}>
        <span>
          {label} · {rows.length} {t.countries}
        </span>
        <span className={`chev${open ? ' chev--open' : ''}`}>▾</span>
      </button>
      {open && (
        <ol className="ranking__list scroll-slim">
          {rows.map((r, i) => {
            const w = ((r.value - min) / span) * 100;
            const active = r.iso3 === selectedIso;
            return (
              <li key={r.iso3}>
                <button
                  ref={active ? activeRef : undefined}
                  className={`rank-row${active ? ' rank-row--active' : ''}`}
                  onClick={() => onPick(r.iso3)}
                  title={`${r.name} – ${t.rank} ${i + 1}`}
                >
                  <span className="rank-row__bar" style={{ width: `${Math.max(2, w)}%` }} />
                  <span className="rank-row__pos">{i + 1}</span>
                  <span className="rank-row__flag">{flagEmoji(r.iso2)}</span>
                  <span className="rank-row__name">{r.name}</span>
                  <span className="rank-row__val">{format(r.value)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
