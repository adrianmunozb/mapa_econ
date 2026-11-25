import { Fragment, type ReactNode } from 'react';
import { VERIFICATION, verificationDate } from '../data/verification';

/** Markdown links ([texto](https://…)) and `code` in the report notes, as React nodes. */
function rich(text: string): ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\(https?:[^)]+\)|`[^`]+`)/g);
  return parts.map((part, i) => {
    const link = /^\[([^\]]+)\]\((https?:[^)]+)\)$/.exec(part);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noreferrer">{rich(link[1])}</a>;
    if (/^`[^`]+`$/.test(part)) return <code key={i}>{part.slice(1, -1)}</code>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

const CHECKS = [
  ['Tipo oficial de la zona euro', 'Lo que publica el BIS para los 21 países del euro tiene que coincidir exactamente con el tipo de la facilidad de depósito que publica el BCE.'],
  ['Prima de riesgo frente al Bund', 'Se recalcula con la serie de Eurostat para el mismo mes del país y de Alemania; se admite como mucho 0,5 pb de diferencia.'],
  ['Rentabilidad de los bonos', 'Cada bono a 10 años se compara con Eurostat para su mismo mes (±10 pb) y se marca si va dos meses o más por detrás del último dato.'],
  ['Inflación', 'El IPC nacional (FMI) se compara con el IPCA armonizado de Eurostat del mismo mes. Son conceptos distintos, así que se tolera hasta 0,5 pp.'],
] as const;

const RULES = [
  'Una prima de riesgo solo resta rentabilidades del mismo mes, de una sola fuente y en la misma moneda (zona euro).',
  'Una serie que repite el mismo valor tres meses seguidos no es un precio de mercado: se excluye de la prima.',
  'El tipo real (tipo oficial − inflación) solo se calcula si las dos cifras distan tres meses o menos.',
  'No se muestra como inflación actual un dato de hace más de tres años, ni un tipo oficial sin actualizar en seis meses.',
  'Nunca se interpolan plazos de una curva ni se rellenan meses que faltan: lo que no existe se queda en gris.',
];

const FOUND = [
  ['Prima Italia–Bund', 'Restando valores de fechas distintas, el mapa daba ≈ 50 pb; con Eurostat y el mismo mes, ≈ 126 pb.'],
  ['Tipos oficiales borrados', 'Al regenerar los datos se perdió el tipo de 57 bancos centrales; se restauró desde el BIS.'],
  ['Bulgaria fuera del euro', 'El código no la incluía (está en el euro desde el 1-ene-2026) y se quedaba sin tipo oficial.'],
  ['Lituania por debajo del Bund', 'Su serie llevaba cuatro meses en 2,88 %: no era un precio de mercado.'],
  ['Inflación de 2013 como actual', 'Para algunos países el FMI devolvía datos de hace años como "último mes".'],
];

interface Props {
  onClose: () => void;
  onOpenMap: () => void;
}

export function VerificationPage({ onClose, onOpenMap }: Props) {
  const report = VERIFICATION;
  return (
    <div className="landing vpage" role="dialog" aria-modal="true" aria-labelledby="vpage-title">
      <header className="landing__nav">
        <button type="button" className="landing__brand vpage__back" onClick={onClose}>← Meridiano</button>
        <button type="button" className="ui-button ui-button--primary" onClick={onOpenMap}>Abrir mapa</button>
      </header>

      <section className="vpage__intro">
        <p className="landing__eyebrow">Método</p>
        <h1 id="vpage-title" className="landing__title">Cómo verificamos los datos</h1>
        <p className="landing__lead">
          El código que descarga y calcula las cifras se escribió con ayuda de IA. Por eso no damos ninguna
          cifra por buena porque la haya producido un programa: cada semana volvemos a descargarla de la
          institución que la publica y comparamos.
        </p>
        <p className={`vpage__status${report.issues ? ' vpage__status--warn' : ''}`}>
          Última verificación: <b>{verificationDate(report)}</b> · {report.issues
            ? `${report.issues} filas requieren atención`
            : 'ninguna discrepancia fuera de tolerancia'}
        </p>
      </section>

      <section>
        <h2 className="vpage__h2">Qué comprobamos</h2>
        <ol className="vpage__grid">
          {CHECKS.map(([title, text], i) => (
            <li key={title}><span className="landing__card-num">{String(i + 1).padStart(2, '0')}</span><b>{title}</b><p>{text}</p></li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="vpage__h2">Reglas que aplicamos a los datos</h2>
        <ul className="vpage__rules">{RULES.map(rule => <li key={rule}>{rule}</li>)}</ul>
      </section>

      <section>
        <h2 className="vpage__h2">Errores que la verificación ya encontró</h2>
        <dl className="vpage__found">
          {FOUND.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}
        </dl>
      </section>

      <section>
        <h2 className="vpage__h2">Resultado de la última verificación</h2>
        <p className="vpage__note">Muestra: {report.sample.join(', ')}. Se ejecuta automáticamente cada lunes y antes de cada publicación; si algo no cuadra, el resultado queda pendiente de revisión humana.</p>
        {report.sections.map(section => (
          <div key={section.title} className="vpage__table">
            <h3>{section.title}</h3>
            {section.notes.map(note => <p key={note} className="vpage__note">{rich(note)}</p>)}
            <div className="vpage__scroll">
              <table>
                <thead><tr>{section.columns.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
                <tbody>
                  {section.rows.map(row => (
                    <tr key={row.join('|')}>
                      {row.map((cell, i) => <td key={i} className={i === row.length - 1 && !/^OK$|^excluido/.test(cell) ? 'vpage__flag' : undefined}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <footer className="landing__footer">
        <span>Fuentes primarias: BCE · Eurostat · BIS · FMI</span>
        <a className="landing__navlink" href="https://github.com/adrianmunozb/mapa_econ" target="_blank" rel="noreferrer">Código y rastro completo</a>
      </footer>
    </div>
  );
}
