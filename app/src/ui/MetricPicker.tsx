import type { MetricMeta } from '../types';
import { displayDomain, domainLabel, metricLabel, useLang } from '../i18n';
import { bondMetricId, isBondMetric } from '../data/bonds';

const DOMAIN_ORDER = [
  'finance',
  'economy',
  'social',
  'governance',
  'health',
  'demographics',
  'environment',
  'infrastructure',
  'trade',
];

interface Props {
  metrics: MetricMeta[];
  value: string;
  onChange: (id: string) => void;
}

export function MetricPicker({ metrics, value, onChange }: Props) {
  const { lang, t } = useLang();
  const groups = DOMAIN_ORDER.map((domain) => ({
    domain,
    items: metrics.filter((m) => displayDomain(m) === domain && (!isBondMetric(m.id) || m.id === (isBondMetric(value) ? value : bondMetricId(120)))),
  })).filter((g) => g.items.length > 0);

  return (
    <label className="field">
      <span>{t.metricPickerLabel}</span>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {groups.map((g) => (
          <optgroup key={g.domain} label={domainLabel(g.domain, lang)}>
            {g.items.map((m) => (
              <option key={m.id} value={m.id}>
                {metricLabel(m, lang)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
