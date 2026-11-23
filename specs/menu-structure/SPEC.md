# SPEC — Reorganizar el panel de controles (menú izquierdo)

## Contexto

El usuario pide "menús mejor organizados, con más cabeza" y que planifique la estructura
antes de tocar código. He leído `App.tsx` completo (925 líneas) y el panel `.hud--top-left`
al detalle. Hoy es **una sola lista vertical sin secciones**, en este orden:

1. Marca + buscador + selector de indicador + (controles de bonos si aplica) + descripción +
   modo actual/cambio + selector de periodo
2. `AlliancePicker` (grupos geopolíticos)
3. Leyenda (si no hay alianzas seleccionadas)
4. Grid de 6 botones heterogéneos ("Capas Estratégicas": Comercio, Chokepoints + explorar,
   Cables, Bolsas, Día/noche) + pista de día/noche + `WebcamControls` (con su propio buscador
   y lista) + `NewsControls` (con sus propios filtros de tema/geografía/fuentes/horas) +
   leyenda de cables submarinos
5. Pista + leyenda de comercio (solo si el modo comercio está activo) — colocada *después*
   de todo el bloque de capas, lejos del botón que la activa
6. `RankingList` (ranking de países) — es el único bloque que **ya** es colapsable (tiene su
   propio botón + flecha, `ranking__toggle`/`chev`)

Son ~9 preocupaciones distintas (indicador, grupos, leyenda, comercio, chokepoints, cables,
bolsas, día/noche, webcams, noticias, ranking) mostradas siempre a la vez, sin jerarquía. En
móvil (`max-height: 44vh` en el breakpoint de 760px) esto es aún peor: una lista larga dentro
de una caja diminuta.

## Historias de usuario

- Como visitante, quiero ver primero lo esencial (elegir indicador, ver la leyenda) y que las
  herramientas secundarias (capas del mapa, grupos geopolíticos) estén recogidas pero
  accesibles en un clic, no todas desplegadas a la vez.
- Como visitante, quiero saber si una capa está activa (comercio, cables, bolsas…) **sin
  tener que abrir** su sección — un indicio visible en la cabecera de la sección colapsada.
- Como visitante en móvil, quiero que el panel no sea una lista interminable: debo poder ver
  el indicador y el mapa sin desplazar 10 bloques distintos.
- Como visitante, quiero que la pista y leyenda de comercio aparezcan junto al botón que
  activa el comercio, no al final de un bloque no relacionado.

## Alcance

Agrupar el contenido existente en **secciones plegables**, reutilizando el patrón que
`RankingList` ya implementa (botón + flecha `chev` + contenido condicional) en vez de
inventar uno nuevo:

- **"Indicador"** (siempre visible, sin plegar — es la tarea principal del panel): buscador,
  selector de indicador, controles de bonos, descripción, modo actual/cambio, periodo,
  leyenda. Se le añade solo una etiqueta de sección no interactiva (mismo estilo que
  `.panel__group-title`, ya usado en `CountryPanel`) para que visualmente combine con el
  resto.
- **"Grupos geopolíticos"** (plegable, cerrado por defecto): `AlliancePicker`. Insignia con el
  nº de grupos seleccionados cuando hay alguno.
- **"Capas del mapa"** (plegable, cerrado por defecto): el grid de 6 botones + `WebcamControls`
  + `NewsControls` + leyenda de cables + la pista/leyenda de comercio (movida aquí, justo
  después del botón de Comercio). Insignia con el nº de capas activas (p. ej. "2 activas"),
  visible aunque la sección esté cerrada.
- **"Ranking"**: sin cambios de comportamiento (sigue abierto por defecto, igual que hoy);
  solo se homogeneiza visualmente con las dos secciones nuevas.

## Fuera de alcance

- Cualquier cambio de layout mayor (barra lateral con iconos, paneles flotantes separados,
  pestañas en vez de acordeón). Sigo sin poder verificar visualmente — un acordeón dentro del
  mismo `.hud--top-left` que ya existe es el cambio de menor riesgo que resuelve el problema.
- Tocar `RankingList.tsx` (ya funciona, no se reescribe un patrón que ya está bien hecho —
  solo se replica su aspecto visual en las secciones nuevas).
- Normalizar el idioma de las etiquetas (hoy mezcla español embebido y claves `t.*` en
  inglés) — es una inconsistencia real que he visto al leer el código, pero es un problema de
  i18n distinto, no de estructura del menú. Lo anoto para otra tarea.
- Sustituir emoji por iconos SVG en los botones de capas (fuera de alcance desde la auditoría
  "ai slop", sigue necesitando verificación visual).

## Criterios de aceptación (EARS)

- CUANDO se abre el panel por primera vez, EL sistema DEBE mostrar expandida solo la sección
  "Indicador" (y "Ranking", que ya es así hoy); "Grupos geopolíticos" y "Capas del mapa"
  DEBEN estar colapsadas.
- CUANDO "Capas del mapa" está colapsada Y al menos una capa (comercio, chokepoints, cables,
  bolsas, día/noche, webcams, noticias) está activa, LA cabecera de la sección DEBE mostrar
  cuántas lo están, sin necesidad de abrirla.
- CUANDO el modo comercio está activo, LA pista y leyenda de comercio DEBEN aparecer dentro de
  "Capas del mapa", inmediatamente después del botón de Comercio.
- CUANDO se pulsa la cabecera de una sección plegable, EL sistema DEBE alternar su estado
  abierto/cerrado sin recargar ni perder el estado de los controles que contiene (p. ej. no
  se resetea si hay noticias cargadas o cámaras filtradas).
- CUANDO se ejecuta `npm run build`, EL sistema DEBE compilar sin error.
- El comportamiento de cada control individual (toggles de capa, buscador, selector de
  indicador, alianzas, ranking) DEBE ser idéntico al actual — este cambio es de
  **organización**, no de funcionalidad.
