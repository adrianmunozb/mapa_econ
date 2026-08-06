import type { CountryData, MetricMeta, ProductEntry } from '../types';
import type { YearMap } from '../lib/timeseries';
import { formatValueWithUnit, formatUsdCompact } from '../lib/format';
import { flagEmoji } from '../lib/flag';
import { fmt, domainLabel, metricLabel, tPeriod, useLang } from '../i18n';
import { TrendChart } from './TrendChart';

export interface TradeSummaryPartner {
  iso3: string;
  name: string;
  iso2?: string;
  value: number;
  share: number; // percent of total exports
}
export interface TradeSummary {
  year: number;
  total: number;
  partners: TradeSummaryPartner[];
}

interface Props {
  country: CountryData | null;
  metrics: MetricMeta[];
  activeMetricId: string;
  onClose: () => void;
  onAddCompare: (iso3: string) => void;
  inCompare: boolean;
  compareFull: boolean;
  trade: TradeSummary | null;
  onPickPartner: (iso3: string) => void;
  activeMetric: MetricMeta;
  history: YearMap | null;
  products: ProductEntry | null;
  productNames: Record<string, string>;
}

export function CountryPanel({
  country,
  metrics,
  activeMetricId,
  onClose,
  onAddCompare,
  inCompare,
  compareFull,
  trade,
  onPickPartner,
  activeMetric,
  history,
  products,
  productNames,
}: Props) {
  const { lang, t } = useLang();

  if (!country) {
    return (
      <aside className="hud panel-right">
        <button className="panel__close" onClick={onClose} aria-label={t.close}>
          ×
        </button>
        <div className="panel__empty">{t.noOfficialData}</div>
      </aside>
    );
  }

  // Group metrics by domain for readability, preserving catalog order.
  const domains: string[] = [];
  for (const m of metrics) if (!domains.includes(m.domain)) domains.push(m.domain);

  return (
    <aside className="hud panel-right scroll-slim">
      <button className="panel__close" onClick={onClose} aria-label={t.close}>
        ×
      </button>

      <div className="panel__head">
        <span className="panel__flag">{flagEmoji(country.iso2)}</span>
        <div>
          <h2 className="panel__name">{country.name}</h2>
          <p className="panel__meta">
            {[country.region, country.incomeGroup].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <button
        className="btn btn--compare"
        disabled={inCompare || compareFull}
        onClick={() => onAddCompare(country.iso3)}
      >
        {inCompare ? t.inCompare : compareFull ? t.compareFull : t.addCompare}
      </button>

      {history && (
        <div className="panel__group">
          <h3 className="panel__group-title">{fmt(t.trendOf, { label: metricLabel(activeMetric, lang) })}</h3>
          <TrendChart history={history} metric={activeMetric} />
        </div>
      )}

      {domains.map((domain) => (
        <div key={domain} className="panel__group">
          <h3 className="panel__group-title">{domainLabel(domain, lang)}</h3>
          <ul className="metric-list">
            {metrics
              .filter((m) => m.domain === domain)
              .map((m) => {
                const mv = country.metrics[m.id];
                const active = m.id === activeMetricId;
                return (
                  <li key={m.id} className={`metric-row${active ? ' metric-row--active' : ''}`}>
                    <span className="metric-row__label">{metricLabel(m, lang)}</span>
                    <span className="metric-row__value">
                      {mv ? (
                        <>
                          {formatValueWithUnit(mv.value, m, lang)}
                          <span className="metric-row__year">{tPeriod(mv.period, lang) ?? mv.year}</span>
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}

      {trade && trade.partners.length > 0 && (
        <div className="panel__group">
          <h3 className="panel__group-title">{fmt(t.topExportPartners, { year: trade.year })}</h3>
          <ul className="trade-list">
            {trade.partners.map((p) => {
              const maxShare = trade.partners[0].share || 1;
              return (
                <li key={p.iso3}>
                  <button
                    className="trade-row"
                    onClick={() => onPickPartner(p.iso3)}
                    title={fmt(t.goTo, { name: p.name })}
                  >
                    <span
                      className="trade-row__bar"
                      style={{ width: `${Math.max(3, (p.share / maxShare) * 100)}%` }}
                    />
                    <span className="trade-row__flag">{flagEmoji(p.iso2)}</span>
                    <span className="trade-row__name">{p.name}</span>
                    <span className="trade-row__val">{formatUsdCompact(p.value, lang)}</span>
                    <span className="trade-row__share">{p.share.toFixed(0)}%</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {products && products.products.length > 0 && (
        <div className="panel__group">
          <h3 className="panel__group-title">{fmt(t.topExportGoods, { year: products.year })}</h3>
          <ul className="trade-list">
            {products.products.map((p) => {
              const max = products.products[0].v || 1;
              const share = products.total ? (p.v / products.total) * 100 : 0;
              return (
                <li key={p.c}>
                  <div className="product-row">
                    <span
                      className="trade-row__bar"
                      style={{ width: `${Math.max(3, (p.v / max) * 100)}%` }}
                    />
                    <span className="trade-row__name">{productNames[p.c] ?? `HS ${p.c}`}</span>
                    <span className="trade-row__val">{formatUsdCompact(p.v, lang)}</span>
                    <span className="trade-row__share">{share.toFixed(0)} %</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="panel__source">{t.sourcesFooter}</div>
    </aside>
  );
}
