import { Fragment } from 'react';
import type { CountryData, MetricMeta } from '../types';
import { formatValueWithUnit } from '../lib/format';
import { flagEmoji } from '../lib/flag';
import { domainLabel, metricLabel, useLang } from '../i18n';

interface Props {
  countries: CountryData[];
  metrics: MetricMeta[];
  onClose: () => void;
}

export function CompareTable({ countries, metrics, onClose }: Props) {
  const { lang, t } = useLang();

  /** ISO3 of the country with the best value for a metric (null if neutral / no data). */
  const bestIso = (m: MetricMeta): string | null => {
    if (m.higherIsBetter === null) return null;
    let best: { iso: string; v: number } | null = null;
    for (const c of countries) {
      const v = c.metrics[m.id]?.value;
      if (typeof v !== 'number') continue;
      if (!best || (m.higherIsBetter ? v > best.v : v < best.v)) best = { iso: c.iso3, v };
    }
    return best?.iso ?? null;
  };

  const domains: string[] = [];
  for (const m of metrics) if (!domains.includes(m.domain)) domains.push(m.domain);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="compare-modal hud scroll-slim" onClick={(e) => e.stopPropagation()}>
        <div className="compare-modal__head">
          <h2>{t.compareTitle}</h2>
          <button className="panel__close" onClick={onClose} aria-label={t.close}>
            ×
          </button>
        </div>

        <div className="compare-scroll scroll-slim">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="cmp-metric-col">{t.metricCol}</th>
                {countries.map((c) => (
                  <th key={c.iso3}>
                    <span className="cmp-flag">{flagEmoji(c.iso2)}</span>
                    <span className="cmp-cname">{c.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <Fragment key={d}>
                  <tr className="cmp-group">
                    <td colSpan={countries.length + 1}>{domainLabel(d, lang)}</td>
                  </tr>
                  {metrics
                    .filter((m) => m.domain === d)
                    .map((m) => {
                      const best = bestIso(m);
                      return (
                        <tr key={m.id}>
                          <td className="cmp-metric-col">{metricLabel(m, lang)}</td>
                          {countries.map((c) => {
                            const mv = c.metrics[m.id];
                            return (
                              <td key={c.iso3} className={best === c.iso3 ? 'cmp-best' : ''}>
                                {mv ? formatValueWithUnit(mv.value, m, lang) : <span className="muted">—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel__source">{t.compareFooter}</div>
      </div>
    </div>
  );
}
