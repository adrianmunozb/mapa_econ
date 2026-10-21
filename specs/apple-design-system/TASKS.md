# TASKS — Apple-design pass (motion, materiales, craft)

Orden 1→8, cada una un commit atómico.

## 1. Tokens de muelle + materiales + accesibilidad en index.css
- Archivo: `app/src/index.css`
- Cambio: añadir los tokens de `PLAN.md` §1, más los 2 bloques `@media
  (prefers-reduced-transparency: reduce)` y `@media (prefers-contrast: more)`.
- Hecho cuando: `npx tsc --noEmit` sigue sin error (no afecta TS, solo confirma que no se ha
  roto el guardado) y el valor de `--ease-spring` coincide con el derivado en PLAN.md (24
  puntos, 0.0 a 100.0%, terminando en `1.0000 100.0%`).

## 2. Migrar `.hud`, `.market-ticker-container`, `.chokepoint-card`, `.compare-modal`, `.solar-clock` a tokens de material
- Archivo: `app/src/App.css`
- Cambio: sustituir sus `background`/`backdrop-filter` literales por
  `var(--material-{thin,regular,thick}-bg)` / `var(--material-*-blur)` según PLAN.md §2.
- Hecho cuando: ninguna de esas 5 reglas tiene un `rgba(...)` o `blur(...)` literal — todo pasa
  por los tokens.

## 3. Fundido de borde en listas con scroll
- Archivo: `app/src/App.css`
- Cambio: añadir `mask-image` a `.ranking__list` y `.webcam-list` (PLAN.md §3).
- Hecho cuando: ambas reglas tienen la línea `mask-image` y ningún otro valor (`max-height`,
  `overflow-y`, `padding`) ha cambiado.

## 4. Curva de muelle en transiciones discretas
- Archivo: `app/src/App.css`
- Cambio: `.chev`, `.market-item`, `.chokepoint-card` (animation), `.alliance-chip` pasan a
  `var(--ease-spring)` / `var(--ease-spring-duration)` (PLAN.md §4).
- Hecho cuando: ninguna de esas 4 reglas tiene `ease`/`ease-out` como timing function.

## 5. Reduced motion completo
- Archivo: `app/src/App.css`
- Cambio: ampliar el bloque `@media (prefers-reduced-motion: reduce)` para cubrir `.spinner`,
  `.ticker-pulse`, `.chokepoint-card` (PLAN.md §5).
- Hecho cuando: las 4 animaciones del fichero (`spin`, `pulse`, `slideUp`, `cable-signal`)
  tienen una entrada correspondiente bajo `prefers-reduced-motion: reduce`.

## 6. Craft — colores de estado
- Igual que la tarea 2 de `specs/css-token-cleanup/TASKS.md` (consolidar `--ok`/`--danger`/`--warn`).
- Hecho cuando: `grep -n "#22c55e\|#4ade80\|#ef4444\|#f87171\|#ffd166" app/src/App.css` solo
  aparece en los tokens de `index.css`.

## 7. Craft — radios y glow decorativo
- Igual que las tareas 3 y 4 de `specs/css-token-cleanup/TASKS.md`.
- Hecho cuando: `grep -o "border-radius:[^;]*" app/src/App.css | sort -u` da ≤5 valores con
  nombre + `50%`; `.ticker-pulse`, `.cable-network__status`,
  `.market-item__indicator.indicator--live` no tienen `box-shadow`.

## 8. Build + verificación visual pendiente
- Comando: `cd app && npm run build`.
- Hecho cuando: build sin error. La verificación visual real (materiales, fundidos, muelle en
  movimiento, reduced-motion/transparencia/contraste activados en el SO) la confirma el
  usuario — sigo sin extensión de Chrome conectada.
