import type { RegionalCountryCoverage, RegionRecord, RegionalMetricId } from '../data/regions';
import { REGIONAL_METRICS, formatRegionalValue, regionalTrendMetric } from '../data/regions';
import { fmt, useLang } from '../i18n';
import { TrendChart } from './TrendChart';

interface Props {
  countryName: string;
  regionName: string | null;
  region: RegionRecord | undefined;
  coverage: RegionalCountryCoverage;
  activeMetricId: RegionalMetricId;
  onClose: () => void;
}

export function RegionalPanel({
  countryName,
  regionName,
  region,
  coverage,
  activeMetricId,
  onClose,
}: Props) {
  const { lang, t } = useLang();
  const activeMetric = REGIONAL_METRICS.find((metric) => metric.id === activeMetricId) ?? REGIONAL_METRICS[0];
  const history = region
    ? Object.fromEntries(
        Object.entries(region.values)
          .filter(([, values]) => typeof values[activeMetricId] === 'number')
          .map(([year, values]) => [year, values[activeMetricId] as number]),
      )
    : null;

  return (
    <aside className="hud panel-right scroll-slim">
      <button className="panel__close" onClick={onClose} aria-label={t.close}>
        ×
      </button>

      <div className="panel__head regional-panel__head">
        <span className="regional-panel__marker" aria-hidden="true">⌖</span>
        <div>
          <h2 className="panel__name">{regionName ?? t.regionalSelectRegion}</h2>
          <p className="panel__meta">{countryName}</p>
        </div>
      </div>

      {!region ? (
        <div className="panel__empty">{t.regionalNoDataRegion}</div>
      ) : (
        <>
          <div className="panel__group">
            <h3 className="panel__group-title">{fmt(t.trendOf, { label: activeMetric.label[lang] })}</h3>
            {history && <TrendChart history={history} metric={regionalTrendMetric(activeMetric)} />}
          </div>

          <div className="panel__group">
            <h3 className="panel__group-title">{t.regionalMacroData}</h3>
            <ul className="metric-list">
              {REGIONAL_METRICS.map((metric) => {
                let latest: { value: number; year: number } | null = null;
                for (const [yearText, values] of Object.entries(region.values)) {
                  const value = values[metric.id];
                  const year = Number(yearText);
                  if (typeof value === 'number' && (!latest || year > latest.year)) latest = { value, year };
                }
                return (
                  <li key={metric.id} className={`metric-row${metric.id === activeMetricId ? ' metric-row--active' : ''}`}>
                    <span className="metric-row__label">{metric.label[lang]}</span>
                    <span className="metric-row__value">
                      {latest ? (
                        <>
                          {formatRegionalValue(latest.value, metric, lang)}
                          <span className="metric-row__year">{latest.year}</span>
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
        </>
      )}

      {coverage.matched < coverage.regions && (
        <p className="regional-panel__coverage">
          {fmt(t.regionalCoverage, { matched: coverage.matched, total: coverage.regions })}
        </p>
      )}

      <div className="panel__source">{t.regionalSourceNote}</div>
    </aside>
  );
}

