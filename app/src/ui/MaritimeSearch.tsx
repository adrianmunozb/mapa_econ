import { useId, useState } from 'react';
import { CHOKEPOINTS } from '../data/chokepoints';
import { maritimeSuggestions } from '../data/maritimeSearch';

export function MaritimeSearch({ value, onChange, kind }: { value: string; onChange: (value: string) => void; kind: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = maritimeSuggestions(CHOKEPOINTS, value, kind);
  const expanded = open && suggestions.length > 0;
  const activeIndex = expanded && active < suggestions.length ? active : -1;
  const choose = (label: string) => { onChange(label); setOpen(false); setActive(-1); };
  return (
    <div className="maritime-search" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setOpen(false); setActive(-1); }
    }}>
      <label htmlFor={id}>Nombre, mercancía o amenaza</label>
      <input id={id} type="search" role="combobox" autoComplete="off" value={value}
        placeholder="Petróleo, sequía…" aria-autocomplete="list" aria-expanded={expanded}
        aria-controls={expanded ? `${id}-suggestions` : undefined}
        aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        onFocus={() => { setOpen(true); setActive(-1); }}
        onChange={(event) => { onChange(event.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={(event) => {
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length) {
            event.preventDefault(); setOpen(true);
            setActive(event.key === 'ArrowDown' ? (activeIndex + 1) % suggestions.length : activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1);
          } else if (event.key === 'Enter' && expanded && activeIndex >= 0) {
            event.preventDefault(); choose(suggestions[activeIndex].label);
          } else if (event.key === 'Escape' && open) {
            event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1);
          } else if (event.key === 'Tab') { setOpen(false); setActive(-1); }
        }}
      />
      {expanded && <ul id={`${id}-suggestions`} className="maritime-suggestions" role="listbox" aria-label="Sugerencias de búsqueda">
        {suggestions.map((suggestion, index) => <li id={`${id}-option-${index}`} key={suggestion.label} role="option"
          aria-selected={activeIndex === index} onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setActive(index)} onClick={() => choose(suggestion.label)}>
          <span>{suggestion.label}</span><small>{suggestion.category}</small>
        </li>)}
      </ul>}
      <span className="maritime-search-status" role="status">{expanded ? `${suggestions.length} ${suggestions.length === 1 ? 'sugerencia' : 'sugerencias'}. Usa las flechas y Enter para seleccionar.` : ''}</span>
    </div>
  );
}
