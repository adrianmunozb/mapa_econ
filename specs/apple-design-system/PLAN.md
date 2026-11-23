# PLAN — Apple-design pass (motion, materiales, craft)

## 1. Tokens nuevos (`app/src/index.css`, dentro de `:root`)

```css
/* Regla 4: muelle críticamente amortiguado (damping 1.0, response 0.35s),
   derivado con x(t) = 1 - e^(-ωt)(1+ωt), ω = 2π/0.35, muestreado en 24 puntos.
   No es un valor copiado de un blog: se calculó para este spec (ver TASKS.md). */
--ease-spring: linear(0.0000 0.0%, 0.0401 4.2%, 0.1313 8.3%, 0.2431 12.5%, 0.3577 16.7%,
  0.4656 20.8%, 0.5620 25.0%, 0.6452 29.2%, 0.7154 33.3%, 0.7736 37.5%, 0.8210 41.7%,
  0.8594 45.8%, 0.8900 50.0%, 0.9144 54.2%, 0.9336 58.3%, 0.9487 62.5%, 0.9605 66.7%,
  0.9696 70.8%, 0.9767 75.0%, 0.9822 79.2%, 0.9864 83.3%, 0.9896 87.5%, 0.9921 91.7%,
  0.9940 95.8%, 1.0000 100.0%);
--ease-spring-duration: 0.42s;

/* Regla 12: 3 niveles de material traslúcido */
--material-thin-bg: rgba(10, 21, 38, 0.85);
--material-thin-blur: 8px;
--material-regular-bg: rgba(20, 27, 46, 0.92);   /* = var(--panel) actual, sin cambio */
--material-regular-blur: 12px;
--material-thick-bg: rgba(10, 13, 23, 0.96);
--material-thick-blur: 16px;

/* Regla 16 / craft (del spec anterior) */
--ok: #22c55e; --ok-soft: rgba(34, 197, 94, 0.18);
--danger: #ef4444; --danger-soft: rgba(239, 68, 68, 0.15);
--warn: #ffd166; --warn-soft: rgba(255, 209, 102, 0.14);
--radius-xs: 4px; --radius-sm: 7px; --radius-md: 10px; --radius-lg: 16px; --radius-full: 999px;
```

Bajo `@media (prefers-reduced-transparency: reduce)`, redefinir dentro de `:root`:
`--material-*-blur` a `0px` y `--material-*-bg` a su versión opaca (alpha 1, mismo RGB).

Bajo `@media (prefers-contrast: more)`, redefinir `--panel-border: rgba(255,255,255,0.35)` y
`--text-faint: #c3cbdc` (ambos hoy más tenues: `0.08` y `#6b7794`).

## 2. Aplicar materiales (`app/src/App.css`)

- `.hud` (paneles estructurales): usa `var(--material-regular-bg)` /
  `var(--material-regular-blur)` — mismo valor que hoy, cero cambio visual, solo pasa a token.
- `.market-ticker-container` (badge flotante): `var(--material-thin-bg)` /
  `var(--material-thin-blur)` — antes `rgba(13,17,23,0.92)` + `blur(14px)`, ahora más discreto
  (regla "deference": un badge informativo no debe competir con el mapa).
- `.chokepoint-card` y `.compare-modal` (capa de mayor énfasis/alerta): `var(--material-thick-bg)`
  / `var(--material-thick-blur)`.
- `.solar-clock`: se queda en `regular` (widget informativo normal, no es ni badge discreto ni
  alerta).

## 3. Fundido de borde en listas con scroll (`app/src/App.css`)

En `.ranking__list` y `.webcam-list`, añadir:
```css
mask-image: linear-gradient(to bottom, transparent, black 20px, black calc(100% - 20px), transparent);
```
Sin cambio de `padding`/`max-height`; es puramente decorativo y degrada con seguridad si el
navegador no soporta `mask-image` (el contenido simplemente no se desvanece).

## 4. Curva de muelle en transiciones discretas (`app/src/App.css`)

Reemplazar la curva fija por `var(--ease-spring)` + `var(--ease-spring-duration)` en:
- `.chev` (`transition: transform 0.2s ease` → `transform var(--ease-spring-duration) var(--ease-spring)`)
- `.market-item` (`transition: all 0.2s ease` → igual, aplicado a `all`)
- `.chokepoint-card` (`animation: slideUp 0.25s ease-out` → `animation: slideUp
  var(--ease-spring-duration) var(--ease-spring)`, manteniendo el `@keyframes slideUp`
  existente)
- `.alliance-chip` (`transition: background .15s, border-color .15s` → mismo muelle; es una
  transición corta de hover, buen candidato de bajo riesgo)

## 5. Reduced motion completo (`app/src/App.css`)

Ampliar el único bloque `@media (prefers-reduced-motion: reduce)` existente para cubrir
también `.spinner`, `.ticker-pulse` y `.chokepoint-card`:
```css
@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; border-top-color: var(--bg-elev-2); }
  .ticker-pulse { animation: none; }
  .chokepoint-card { animation: none; }
}
```
(El spinner sin animación pierde su indicación de carga — aceptable: es un spinner de carga
inicial de ~1-2s, no una espera larga; la regla 14 prioriza evitar oscilaciones/movimiento
sobre mantener el feedback de progreso en casos tan breves.)

## 6. Craft — colores/radios/glow (igual que el spec anterior, sin cambios de contenido)

Ver `specs/css-token-cleanup/PLAN.md` — se ejecuta tal cual estaba, ahora como parte de este
spec.

## Archivos a tocar

1. `app/src/index.css` — tokens de §1 + los 2 bloques `@media`.
2. `app/src/App.css` — §2, §3, §4, §5, más el craft pass del spec anterior.

No se toca `App.tsx` ni ningún componente: todo el trabajo es CSS/tokens, sin tocar
estructura ni lógica.

## Alternativas consideradas

- **Usar una librería de spring en JS (Framer Motion / `motion`) para interrumpibilidad real
  velocity-aware.** Descartado para esta pasada: añade una dependencia nueva y reescribe cómo
  se montan/desmontan varios componentes — demasiado riesgo sin poder verlo. `linear()` da el
  mismo *look* de muelle crítico (sin rebote) para transiciones discretas de abrir/cerrar sin
  tocar React. Si se quiere velocity handoff real (reglas 2/5/6, que están fuera de alcance),
  esa sí sería la vía — queda anotado para cuando se pueda iterar viendo el resultado.
- **Generar el `linear()` con una herramienta online (kvin.me/css-springs).** Descartado:
  prefiero derivar el valor con la fórmula cerrada del muelle crítico (ver arriba) para poder
  justificar cada número, en vez de copiar una curva de terceros sin saber sus parámetros
  exactos.
- **Aplicar fundido de borde (`mask-image`) a los 6 contenedores con scroll.** Reducido a 2
  (`.ranking__list`, `.webcam-list`): son los únicos donde el contenido es una lista densa de
  filas que se corta a media altura visualmente; `.hud--top-left`/`.panel-right` terminan en
  secciones con título propio (no listas continuas) y `.search__results` suele tener pocos
  resultados — aplicar la máscara ahí sería alcance no pedido sin beneficio claro.

## Riesgos

- `linear()` tiene soporte en navegadores modernos (Chrome/Edge/Firefox/Safari recientes) pero
  no en motores muy antiguos; si no se soporta, `transition-timing-function` con un valor no
  reconocido se ignora y el navegador usa su default (`ease`) — degrada con seguridad, no
  rompe nada.
- `mask-image` idem: sin soporte, el contenido simplemente no se desvanece (no hay corte de
  contenido ni error).
- Los 3 niveles de material cambian la opacidad/blur del ticker (más sutil) y del
  chokepoint-card/modal (más opaco) — es el único punto de este plan con un delta visual
  intencional más allá de "mover a variable sin cambiar valor"; el usuario lo confirma al ver
  el resultado.
