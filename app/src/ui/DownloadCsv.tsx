import type { CountryData, MetricHistory, MetricMeta, TimeseriesIndex } from '../types';
import { metricLabel, metricUnit, useLang } from '../i18n';
import { downloadCsv, historyCsv, latestCsv } from '../lib/csv';

interface Props {
  metric: MetricMeta;
  countries: CountryData[];
  history?: MetricHistory;
  index: TimeseriesIndex | null;
}

/** Download the metric shown on the map: its yearly series and its latest values. */
export function DownloadCsv({ metric, countries, history, index }: Props) {
  const { lang, t } = useLang();
  const label = metricLabel(metric, lang);
  return (
    <details className="download">
      <summary>{t.downloadTitle}</summary>
      <div className="download__buttons">
        {history && index && (
          <button type="button" className="btn btn--ghost"
            onClick={() => downloadCsv(`${metric.id}_serie.csv`, historyCsv(countries, history, index.startYear, index.endYear))}>
            {t.downloadHistory}
          </button>
        )}
        <button type="button" className="btn btn--ghost"
          onClick={() => downloadCsv(`${metric.id}_actual.csv`, latestCsv(metric, label, metricUnit(metric, lang), countries))}>
          {t.downloadLatest}
        </button>
      </div>
      <p className="download__note">{t.downloadNote}</p>
    </details>
  );
}
