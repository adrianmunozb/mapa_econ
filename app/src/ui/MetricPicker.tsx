import type { MetricMeta } from '../types';
import { domainLabel, useLang } from '../i18n';

const DOMAIN_ORDER = [
  'economy',
  'social',
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
    items: metrics.filter((m) => m.domain === domain),
  })).filter((g) => g.items.length > 0);

  return (
    <label className="field">
      <span>{t.metricPickerLabel}</span>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {groups.map((g) => (
          <optgroup key={g.domain} label={domainLabel(g.domain, lang)}>
            {g.items.map((m) => (
              <option key={m.id} value={m.id}>
                {lang === 'de' ? m.label : (m.labelEn ?? m.label)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
