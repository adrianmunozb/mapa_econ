# SPEC — Apple-design pass (motion, materiales, craft)

> **Supersede** `specs/css-token-cleanup/` — el trabajo de colores/radios/glows de ese spec
> queda absorbido aquí bajo el principio "Craft" (§16). No se ha borrado por seguridad (el
> hook de destructivos lo bloqueó), pero queda obsoleto.

## Contexto

El usuario pidió aplicar la skill real de diseño Apple:
https://github.com/emilkowalski/skills/tree/main/skills/apple-design (Emil Kowalski — no
estaba instalada localmente, se ha traído su `SKILL.md` completo y se sigue al pie de la
letra). Esa skill **no** es una paleta de colores "estilo Apple" — es un conjunto de 17 reglas
sobre **movimiento, materiales, tipografía y accesibilidad** basadas en las charlas WWDC de
diseño, traducidas a la web (springs en vez de curvas fijas, traslucidez con jerarquía,
interrumpibilidad, reduced-motion, tracking tipográfico).

Sigo sin poder ver el mapa (sin extensión de Chrome conectada). El usuario ha aceptado
explícitamente avanzar "a ciegas". Por eso este spec se ciñe a las reglas de la skill que son
**mecánicas y de bajo riesgo visual** (aditivas, con fallback seguro, o sustituciones 1:1), y
deja fuera las que requieren feedback visual continuo para no empeorar nada sin poder
verificarlo.

## Alcance — reglas de la skill aplicadas

- **Regla 4 (springs, no curvas fijas)** y **Regla 3 (interrumpibilidad)**: las 2
  transiciones discretas que hoy usan `ease`/`ease-out` (`.chev`, `.market-item`) y la entrada
  del `.chokepoint-card` (`slideUp … ease-out`) pasan a una curva `linear()` que aproxima un
  muelle críticamente amortiguado (damping 1.0, response ≈0.35s, parámetros que la propia
  skill recomienda como "Default UI spring"). Las transiciones CSS ya parten del valor
  computado actual al interrumpirse (no del valor final), así que esto también mejora la
  regla 3 sin necesitar JS.
- **Regla 12 (materiales y profundidad)**: se definen 3 niveles de "material" (`thin` /
  `regular` / `thick`) como tokens, y cada superficie traslúcida existente se asigna al nivel
  que corresponde a su peso jerárquico (ticker flotante = thin/discreto; paneles
  estructurales = regular, sin cambio; tarjeta de alerta de chokepoint + modal de comparación
  = thick, la capa de mayor énfasis). Además, las listas que se cortan a media fila dentro de
  un contenedor con scroll (`.ranking__list`, `.webcam-list`) ganan un fundido de borde
  (`mask-image`) en vez de un corte duro — tal cual pide la regla.
- **Regla 14 (reduced motion / transparencia / contraste)**: hoy solo 1 de las 4 animaciones
  respeta `prefers-reduced-motion`. Se extiende a las 4, y se añaden `@media
  (prefers-reduced-transparency: reduce)` (los 3 niveles de material se vuelven opacos, sin
  blur) y `@media (prefers-contrast: more)` (bordes y texto apagado con más contraste).
- **Regla 15 (tipografía)**: auditada — el proyecto ya usa pila de fuentes de sistema
  (`-apple-system` incluido) y ya aplica `letter-spacing: -0.01em` en `h1-h3`. No se toca: ya
  cumple la regla, inventar cambios aquí sería riesgo sin beneficio.
- **Regla 16 (craft — del spec anterior)**: colores de estado ad-hoc (`#22c55e`/`#4ade80` para
  "abierto", `#ef4444`/`#f87171` para "cerrado/riesgo", `#ffd166` para "destacado") se
  consolidan en 3 tokens semánticos; la escala de `border-radius` (13+ valores sueltos de 2 a
  30px) se reduce a 5 tokens; se retira el `box-shadow` de glow puramente decorativo en 3
  indicadores de estado de ≤8px.

## Fuera de alcance (necesita ver el resultado o JS nuevo)

- Reglas 1, 2, 5, 6, 9, 10 (respuesta a puntero, 1:1 drag, velocity handoff, momentum,
  rubber-banding, gestos): no hay superficies de arrastre/gesto propias en la app — el único
  "drag" es el paneo del mapa, que ya gestiona MapLibre con su propia física. No aplica.
  (El `compare-bar` y los `chip`s no son arrastrables hoy; añadir esa interacción sería una
  feature nueva, no un ajuste de diseño.)
- Regla 13 (sonido/haptics): no aplica a una SPA de escritorio sin audio/haptics.
- Regla 17 (proceso — prototipar, revisar fotograma a fotograma): requiere verse; queda para
  cuando el usuario conecte la extensión.
- Sustituir emoji por iconos SVG (señalado en la auditoría anterior): sigue fuera, es un
  cambio de mayor superficie que necesita feedback visual.

## Criterios de aceptación (EARS)

- CUANDO el sistema operativo tiene activado "reducir movimiento", EL sitio DEBE anular las 4
  animaciones (`spin`, `pulse`, `slideUp`, `cable-signal`) — ya sea quitándolas o
  reemplazándolas por un cross-fade estático, tal como pide la regla 14.
- CUANDO el sistema operativo tiene activado "reducir transparencia", EL sitio DEBE mostrar
  cada superficie `thin/regular/thick` sin `backdrop-filter` y con fondo sólido equivalente.
- CUANDO el sistema operativo tiene activado "más contraste", EL sitio DEBE usar bordes y
  texto secundario con más contraste que el valor por defecto.
- CUANDO una fila de `.ranking__list` o `.webcam-list` se corta a media altura por el scroll,
  EL borde DEBE desvanecerse (máscara de 20-24px) en vez de cortarse en seco.
- CUANDO se abre el `.chokepoint-card` o el modal de comparación, LA transición DEBE usar la
  curva de muelle (`--ease-spring`) en vez de `ease-out`/`ease`.
- CUANDO se ejecuta `npm run build`, EL sistema DEBE compilar sin error.
- El resto de criterios del spec anterior (colores/radios/glow, ver `css-token-cleanup/SPEC.md`)
  se mantienen vigentes, ahora bajo este spec.
