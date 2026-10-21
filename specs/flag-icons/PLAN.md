# PLAN — Sustituir emoji de bandera por iconos SVG reales

## Por qué no el CSS de `flag-icons` tal cual

El paquete expone `css/flag-icons.css` con reglas `.fi-xx { background-image:
url(../flags/4x3/xx.svg); }` — rutas relativas a ficheros. Con Vite normal esto funciona (los
SVG se emiten como assets con hash). Pero `scripts/make-single-file.mjs` **borra
`dist/assets/` y `dist/data/` después de inlinear JS/CSS/datos en el HTML** (paso 5 del
script) — cualquier `url()` que siga apuntando a un fichero de `assets/` quedaría rota en el
build de archivo único, que es una feature explícita y valorada del proyecto. Por eso las
banderas se generan como **data URI base64 embebidas directamente en un módulo JS**, no vía
CSS con rutas de fichero.

## Generación (una vez, committeada)

Script nuevo `app/scripts/build-flags.mjs` (Node, sin dependencias nuevas de runtime):
1. Lee cada SVG de `node_modules/flag-icons/flags/4x3/*.svg` (271 banderas, ~2.3 MB en total,
   confirmado).
2. Los codifica en base64 y escribe `app/src/data/flags.ts`:
   ```ts
   // Generado por scripts/build-flags.mjs — no editar a mano.
   export const FLAGS: Record<string, string> = {
     es: "data:image/svg+xml;base64,...",
     us: "data:image/svg+xml;base64,...",
     // …271 entradas
   };
   ```
3. Se ejecuta a mano cuando haga falta (como los scripts del pipeline Python); el resultado
   se commitea, igual que `snapshot.json`.

`flag-icons` se añade a `devDependencies` (solo usado por este script, nunca importado por el
código de la app ni por el bundle final).

## Componente `Flag`

`app/src/ui/Flag.tsx`:
```tsx
import { FLAGS } from '../data/flags';

export function Flag({ iso2, className }: { iso2?: string; className?: string }) {
  const src = iso2 && FLAGS[iso2.toLowerCase()];
  if (!src) return <span className={`flag-icon flag-icon--placeholder ${className ?? ''}`} aria-hidden="true" />;
  return <img className={`flag-icon ${className ?? ''}`} src={src} alt="" aria-hidden="true" loading="lazy" />;
}
```
`alt=""`/`aria-hidden` porque el nombre del país ya está en texto junto a la bandera en los 5
sitios que la usan — la bandera es decorativa, no información adicional (igual que lo era el
emoji).

## CSS (`app/src/App.css`)

```css
.flag-icon {
  display: inline-block;
  width: 1.2em;
  height: 0.9em; /* ratio 4:3, escala con el font-size del contexto como hacía el emoji */
  object-fit: cover;
  border-radius: var(--radius-xs);
  vertical-align: middle;
}
.flag-icon--placeholder {
  background: var(--bg-elev-2);
}
```
Al dimensionar en `em`, la bandera hereda el `font-size` de cada contexto actual
(`.rank-row__flag`, `.chip__flag`, `.panel__flag`, `.cmp-flag`, la columna de bandera en
`SearchBox`) sin tener que tocar esas reglas una a una.

## Cambios en los 5 sitios de uso

Reemplazo mecánico en `CompareBar.tsx`, `CompareTable.tsx`, `CountryPanel.tsx`,
`RankingList.tsx`, `SearchBox.tsx`: `{flagEmoji(iso2)}` (texto dentro de un `<span
className="...__flag">`) → `<Flag iso2={iso2} className="...__flag" />` (el `<span>` que lo
envolvía se sustituye por el `<img>`/`<span>` que ya trae su propia clase).

`lib/flag.ts` se borra una vez migrados los 5 sitios (ya no tiene consumidores).

## Archivos a tocar

1. `app/package.json` — `flag-icons` como devDependency.
2. `app/scripts/build-flags.mjs` — nuevo, generador.
3. `app/src/data/flags.ts` — nuevo, generado y committeado.
4. `app/src/ui/Flag.tsx` — nuevo componente.
5. `app/src/App.css` — `.flag-icon*`.
6. `CompareBar.tsx`, `CompareTable.tsx`, `CountryPanel.tsx`, `RankingList.tsx`,
   `SearchBox.tsx` — migrar a `<Flag />`.
7. `app/src/lib/flag.ts` — eliminado.

## Alternativas consideradas

- **CDN de banderas (flagcdn.com).** Descartado: rompe "offline-capable" del README y añade
  una petición de red por bandera mostrada (cientos en el ranking).
- **Importar los SVG como assets de Vite normales (`import flag from '…/es.svg'`).**
  Descartado: por debajo del umbral de inlineado de Vite (4 KB) se emiten como ficheros aparte
  en `dist/assets/`, que el paso 5 de `make-single-file.mjs` borra — mismo problema que la
  opción CSS, solo que más difícil de detectar (funcionaría en `npm run dev` y fallaría solo
  en el build de archivo único).
- **Reducir a un subconjunto de banderas (solo las que aparecen en `snapshot.json` hoy).**
  Descartado: añade una dependencia entre el generador y el contenido del snapshot (si se
  añade un país nuevo, hay que acordarse de regenerar banderas); 2.3 MB para 271 banderas es
  proporcional a un build que ya pesa 13.5 MB con datos regionales/series temporales.

## Riesgos

- El build de archivo único crece ~2.3-3 MB (base64). Aceptable dado el tamaño actual
  (13.5 MB) y que son banderas realmente usadas en 4 vistas distintas de la app.
- `.flag-icon` en `em` asume que cada contexto ya define un `font-size` razonable en el
  elemento padre (cierto hoy, verificado en `App.css`) — si alguno no lo hiciera, la bandera
  heredaría el tamaño de fuente global por defecto; se revisa visualmente en el navegador en
  cada uno de los 5 sitios antes de dar la tarea por cerrada.
