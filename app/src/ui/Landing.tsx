import { Globe } from '../map/Globe';
import { SECTIONS, type SectionId } from '../sections';

interface Props {
  countries: unknown | null;
  /** One short figure per section, e.g. "19 primas · 57 bancos centrales". */
  stats: Partial<Record<SectionId, string>>;
  updated?: string;
  onPick: (section: SectionId) => void;
}

const VERIFY_URL = 'https://github.com/adrianmunozb/mapa_econ/blob/main/docs/verificacion.md';

export function Landing({ countries, stats, updated, onPick }: Props) {
  const cards = SECTIONS.filter(section => !section.noCard);
  return (
    <div className="landing">
      <header className="landing__nav">
        <span className="landing__brand">Mapa económico mundial</span>
        <a className="landing__navlink" href={VERIFY_URL} target="_blank" rel="noreferrer">Cómo verificamos los datos</a>
      </header>

      <section className="landing__hero">
        <div className="landing__copy">
          <p className="landing__eyebrow">Datos oficiales · comprobados contra la fuente</p>
          <h1 className="landing__title">
            El sistema financiero mundial, <em>en un mapa que puedes comprobar.</em>
          </h1>
          <p className="landing__lead">
            Prima de riesgo, tipos de interés, deuda pública, comercio y rutas marítimas de más de
            200 países. Elige una sección o pulsa el globo para abrir el mapa completo.
          </p>
          <div className="landing__ctas">
            <button type="button" className="ui-button ui-button--primary" onClick={() => onPick('riesgo')}>
              Ver el riesgo soberano
            </button>
            <button type="button" className="ui-button" onClick={() => onPick('pais')}>Explorar un país</button>
          </div>
        </div>
        <button type="button" className="globe-button" onClick={() => onPick('mapa')} aria-label="Abrir el mapa mundial completo">
          <Globe countries={countries} />
          <span className="globe-button__hint" aria-hidden="true">Abrir el mapa mundial</span>
        </button>
      </section>

      <nav className="landing__grid" aria-label="Secciones">
        {cards.map((section, i) => (
          <button key={section.id} type="button" className="landing__card" onClick={() => onPick(section.id)}>
            <span className="landing__card-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <span className="landing__card-title">{section.title}</span>
            <span className="landing__card-text">{section.tagline}</span>
            {stats[section.id] && <span className="landing__card-stat">{stats[section.id]}</span>}
          </button>
        ))}
      </nav>

      <footer className="landing__footer">
        <span>Fuentes: BIS · BCE · Eurostat · Banco Mundial · FMI · UN Comtrade · IMF PortWatch</span>
        {updated && <span>Datos del {updated}</span>}
      </footer>
    </div>
  );
}
