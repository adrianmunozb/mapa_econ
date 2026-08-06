import type { ColorScale } from '../lib/colors';
import { NO_DATA_COLOR } from '../lib/colors';
import { useLang } from '../i18n';

interface Props {
  unit: string;
  hint: string;
  scale: ColorScale;
  formatTick: (v: number) => string;
}

export function Legend({ unit, hint, scale, formatTick }: Props) {
  const { t } = useLang();
  const gradient = `linear-gradient(90deg, ${scale.legendColors.join(', ')})`;
  return (
    <div className="legend">
      <div className="legend__head">
        <span className="legend__unit">{unit}</span>
        <span className="legend__hint">{hint}</span>
      </div>
      <div className="legend__bar" style={{ background: gradient }} />
      <div className="legend__scale">
        <span>{scale.empty ? '—' : formatTick(scale.min)}</span>
        <span>{scale.diverging && !scale.empty ? '0' : ''}</span>
        <span>{scale.empty ? '—' : formatTick(scale.max)}</span>
      </div>
      <div className="legend__nodata">
        <span className="legend__swatch" style={{ background: NO_DATA_COLOR }} />
        {t.noData}
      </div>
    </div>
  );
}
