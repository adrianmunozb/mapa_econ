import type { CSSProperties } from 'react';
import { ALLIANCES, ALLIANCE_REVIEWED } from '../data/alliances';

export function AlliancePicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const active = ALLIANCES.filter((alliance) => selected.includes(alliance.id));
  return <section className="alliance-picker" aria-label="Alianzas geopolíticas">
    <div className="alliance-picker__heading"><span>ALIANZAS GEOPOLÍTICAS</span>
      {active.length > 0 && <button className="alliance-picker__clear" onClick={() => onChange([])}>Ver indicadores</button>}
    </div>
    <p className="alliance-picker__hint">Selecciona varios grupos para ver sus coincidencias.</p>
    <div className="alliance-picker__buttons">
      {ALLIANCES.map((alliance) => <button key={alliance.id} type="button"
        className={`alliance-chip${selected.includes(alliance.id) ? ' alliance-chip--on' : ''}`}
        style={{ '--alliance-color': alliance.color } as CSSProperties}
        aria-pressed={selected.includes(alliance.id)} title={`${alliance.kind} · ${alliance.members.length} países`}
        onClick={() => onChange(selected.includes(alliance.id) ? selected.filter((id) => id !== alliance.id) : [...selected, alliance.id])}>
        <i aria-hidden="true" />{alliance.name}<span>{alliance.members.length}</span>
      </button>)}
    </div>
    {active.length > 0 && <>
      <p className="alliance-picker__hint">El color indica pertenencia a los grupos. El indicador económico sigue disponible en el ranking y las fichas.</p>
      <div className="alliance-picker__legend">
        <span><i style={{ background: '#253340' }} />Fuera de los grupos seleccionados</span>
        {active.length > 1 && <span><i style={{ background: '#e8d5a4' }} />Miembro de varios grupos</span>}
      </div>
      <details className="alliance-picker__sources">
        <summary>Composición y fuentes · {ALLIANCE_REVIEWED}</summary>
        {active.map((alliance) => <p key={alliance.id}><a href={alliance.source} target="_blank" rel="noreferrer">{alliance.name} ↗</a> · {alliance.note}</p>)}
        <p>Los grupos tienen fines distintos; la coincidencia no implica una alianza militar común. La escala económica se recupera con «Ver indicadores».</p>
      </details>
    </>}
  </section>;
}
