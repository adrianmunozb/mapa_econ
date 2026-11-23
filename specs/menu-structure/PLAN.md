# PLAN — Reorganizar el panel de controles

## Componente nuevo: `Section`

`app/src/ui/Section.tsx` — generaliza el patrón que `RankingList` ya usa (botón +
`chev` + contenido condicional), sin tocar `RankingList.tsx`:

```tsx
interface SectionProps {
  title: string;
  badge?: string;       // p. ej. "2 activas" — se muestra aunque esté cerrada
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Section({ title, badge, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <button type="button" className="section__toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="section__title">{title}</span>
        {badge && <span className="section__badge">{badge}</span>}
        <span className={`chev${open ? ' chev--open' : ''}`}>▾</span>
      </button>
      {open && <div className="section__body">{children}</div>}
    </div>
  );
}
```

Estado `open` es local al componente (no sube a `App.tsx`): nada que persistir, nada que
sincronizar con la URL — igual que hace `RankingList` hoy.

## CSS nuevo (`app/src/App.css`)

Bloque nuevo `.section`/`.section__toggle`/`.section__title`/`.section__badge`/`.section__body`,
modelado visualmente sobre `.ranking__toggle`/`.chev`/`.ranking__list` (mismo tamaño de fuente,
mismo padding, mismo borde superior) para que las 3 secciones del panel sean indistinguibles
en estilo aunque no comparten código con `RankingList`. `.section__badge` reutiliza el aspecto
de `.layer-toggles__title` (texto apagado, mayúsculas pequeñas) para que no compita visualmente
con el título.

## Cambios en `App.tsx`

1. Añadir una etiqueta no interactiva "Indicador" (mismo span/clase que
   `.panel__group-title`) justo antes del `<SearchBox>` actual — puramente visual, cero
   lógica nueva.
2. Envolver el `<AlliancePicker>` existente en `<Section title="Grupos geopolíticos"
   badge={selectedAlliances.length ? String(selectedAlliances.length) : undefined}>`.
3. Envolver en `<Section title="Capas del mapa" badge={activeLayerCount ? \`${activeLayerCount}
   activas\` : undefined}>`: el bloque `layer-toggles` completo (grid de 6 botones +
   `WebcamControls` + `NewsControls` + leyenda de cables) **más** el bloque de pista/leyenda
   de comercio, que se mueve de donde está hoy (después de `layer-toggles`, antes de
   `RankingList`) a justo después del botón de Comercio dentro del grid.
4. Nueva constante derivada (sin nuevo `useState`):
   ```tsx
   const activeLayerCount = [tradeMode, showChokepoints, showCables, showMarkets, showDayNight, showWebcams, showNews]
     .filter(Boolean).length;
   ```
5. `RankingList` no se toca — sigue exactamente donde está, después de la nueva sección
   "Capas del mapa".

Nada de esto cambia ningún `useState`/`useEffect`/callback existente: es mover JSX ya
existente dentro de wrappers nuevos, más una constante derivada de variables que ya existen.

## Archivos a tocar

1. `app/src/ui/Section.tsx` — nuevo.
2. `app/src/App.css` — nuevo bloque de estilos `.section*`.
3. `app/src/App.tsx` — reordenar/envolver JSX existente (sin tocar lógica de estado).

No se toca: `RankingList.tsx`, `AlliancePicker.tsx`, `WebcamControls.tsx`, `NewsControls.tsx`,
ningún archivo de datos/pipeline.

## Alternativas consideradas

- **Pestañas (tabs) en vez de acordeón independiente.** Descartado: con pestañas solo una
  sección es visible a la vez, pero un usuario puede querer tener "Capas del mapa" abierta
  mientras mira el "Ranking" simultáneamente — ya es posible hoy (ranking siempre visible) y
  un acordeón independiente lo preserva; pestañas lo romperían.
- **Persistir qué secciones están abiertas (localStorage o URL hash).** Descartado por YAGNI:
  nadie ha pedido recordar el estado entre sesiones, y `RankingList` tampoco lo hace hoy —
  mantener el mismo nivel de persistencia (ninguna) es coherente.
- **Barra lateral tipo VS Code/Figma (iconos + flyout).** Descartado: cambio de layout mucho
  mayor, alto riesgo sin poder verlo, y no resuelve nada que un acordeón no resuelva ya.
- **Refactorizar `RankingList` para que use el `Section` nuevo (DRY).** Descartado para esta
  pasada: `RankingList` ya funciona y está verificado; tocarlo sin necesidad añade riesgo a
  un componente que no forma parte del problema. Se deja como posible limpieza futura, anotada
  aquí, no ejecutada a ciegas.

## Riesgos

- Mover el bloque de pista/leyenda de comercio de un sitio a otro del árbol JSX no cambia su
  JSX interno, solo su posición — riesgo bajo, pero es el único punto de este plan que no es
  "envolver sin tocar"; se revisa con cuidado en el diff antes de commitear.
- Colapsar "Capas del mapa" por defecto significa que, tras este cambio, activar Comercio o
  Cables por primera vez requiere un clic adicional (abrir la sección) que hoy no hace falta.
  Es la consecuencia directa — y buscada — de reducir lo que se ve de entrada; el insignia de
  "N activas" compensa dando visibilidad sin necesidad de abrir.
