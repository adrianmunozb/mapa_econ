# PLAN — Limpieza de "AI slop" visual en App.css

## Nuevos tokens (`app/src/index.css`, dentro de `:root`)

```css
--ok: #22c55e;        /* abierto / vivo / positivo — ya era el color dominante usado */
--ok-soft: rgba(34, 197, 94, 0.18);
--danger: #ef4444;    /* cerrado / riesgo / negativo */
--danger-soft: rgba(239, 68, 68, 0.15);
--warn: #ffd166;      /* destacado / aviso — ya era el color dominante usado */
--warn-soft: rgba(255, 209, 102, 0.14);

--radius-xs: 4px;   /* antes: 2,3,4,5px */
--radius-sm: 7px;   /* antes: 6,7,8,9px */
--radius-md: 10px;  /* antes: 10,12px — ya existía como --radius (se mantiene como alias) */
--radius-lg: 16px;  /* antes: 14,16,18px */
--radius-full: 999px; /* círculos/pills — antes 30px y 50% ad-hoc se mantienen donde son
                          literalmente círculos (50%), solo las "pill" rectangulares pasan a
                          --radius-full */
```

Se eligen los valores *ya dominantes* en el CSS actual (p. ej. `#22c55e` aparece más veces que
`#4ade80`/`#f87171`), para minimizar el riesgo visual: no se inventa una paleta nueva, se
consolida la que ya está ahí implícitamente.

## Alcance del reemplazo

Solo en `app/src/App.css`, reemplazo mecánico 1:1 (buscar/sustituir), sin tocar estructura,
tamaños, orden de propiedades ni ningún otro valor:

- Colores: todo hex/rgba que signifique "abierto/vivo" → `var(--ok)`/`var(--ok-soft)`; todo
  lo que signifique "cerrado/riesgo" → `var(--danger)`/`var(--danger-soft)`; todo lo que
  signifique "destacado/aviso" (fondo `rgba(255, 209, 102, …)`, texto `#ffd166`) →
  `var(--warn)`/`var(--warn-soft)`.
- `border-radius`: cada valor se redondea al tier más cercano de la tabla de arriba. Los
  `50%` (círculos) y los casos donde el valor ya es `999px`/`var(--radius)` no cambian.
- `box-shadow` de glow puro en `.ticker-pulse`, `.cable-network__status`,
  `.market-item__indicator.indicator--live`: se elimina la línea `box-shadow`, el `background`
  (color) se mantiene.

## Archivos a tocar

1. `app/src/index.css` — añadir los 9 tokens nuevos a `:root`.
2. `app/src/App.css` — aplicar los reemplazos mecánicos descritos arriba.

No se toca: `app/src/App.tsx`, ningún otro `.css` (`bonds.css`, `maritime.css`, `news.css`
usan su propia paleta puntual y no fueron señalados en la auditoría — tocarlos sin motivo
concreto sería alcance no pedido), ni la estructura de componentes.

## Alternativas consideradas

- **Reescribir toda la paleta con una herramienta de contraste/accesibilidad.** Descartado:
  sin ver el render, cambiar los *valores* de color (no solo consolidar los existentes) es
  alto riesgo de empeorar las cosas a ciegas.
- **Sustituir también los emoji por iconos SVG en esta misma pasada.** Descartado (ver SPEC.md
  § Fuera de alcance): cambio de mayor superficie, necesita verificación visual.
- **Usar un preprocesador (Sass/PostCSS) para gestionar la escala.** Descartado por YAGNI: el
  proyecto no usa ninguno hoy, y 9 custom properties en `:root` resuelven el problema sin
  añadir una dependencia nueva.

## Riesgos

- **Reemplazo mecánico por regex puede fallar en casos borde** (p. ej. un hex dentro de un
  comentario, o un valor que coincide por casualidad pero significa otra cosa). Mitigación:
  cada sustitución se revisa línea por línea en el diff antes de commitear, no se aplica un
  `sed` ciego sobre todo el fichero.
- **Sin verificación visual real**, un cambio de radius de, p. ej., 18px→16px en
  `.chokepoint-card` podría verse "distinto" aunque no "roto". Mitigación: los tiers elegidos
  son los valores más próximos posibles (máximo 2px de diferencia en cualquier caso), y queda
  explícito en SPEC.md que la confirmación visual final la hace el usuario.
