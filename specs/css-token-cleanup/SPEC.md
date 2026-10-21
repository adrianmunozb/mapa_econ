# SPEC — Limpieza de "AI slop" visual en App.css

## Contexto

El usuario describe el diseño actual como "ai slop". No tengo la extensión de Claude en
Chrome conectada en este equipo, así que no puedo verificar visualmente el resultado — el
usuario ha aceptado explícitamente avanzar con una auditoría a ciegas basada en el CSS y en
patrones conocidos de "AI slop" (investigados en foros/repos: `avoid-ai-design`, `no-slop-ui`,
`Anti-AI-UI`, blogs sobre por qué las IAs siempre generan gradientes morados/glassmorphism).

Tras leer `app/src/App.css` (1248 líneas) y `app/src/index.css` completos, **no** encuentro
los clichés más citados (gradiente morado/índigo, fuente Inter, hero de 3 tarjetas
redondeadas) — esto ya es un dashboard de mapa bastante bespoke, no una landing de SaaS
genérica. Sí encuentro tres patrones concretos y objetivamente verificables que sí coinciden
con la lista de anti-patrones investigada:

1. **Colores ad-hoc sin sistema**: docenas de hex literales distintos para el mismo
   significado semántico (verde "abierto/vivo": `#22c55e`, `#4ade80`; rojo "cerrado/riesgo":
   `#ef4444`, `#f87171`; amarillo "destacado": `#ffd166`), repetidos con ligeras variaciones en
   vez de usar los tokens que ya existen en `:root` (`--accent`, `--accent-2`). Es justo el
   síntoma "la saturación hace el trabajo que debería hacer la jerarquía" que señala la
   investigación.
2. **Escala de `border-radius` sin sistema**: valores 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16,
   18, 30px y `50%`/`999px` usados indistintamente sin una escala — otro síntoma típico de
   generación sin un sistema de diseño.
3. **Glow decorativo en puntos de estado diminutos**: varios `box-shadow: 0 0 Npx <color>`
   puramente decorativos en indicadores de 5-7px (punto de pulso del ticker, estado del cable
   submarino, indicador de mercado) — el "todo lleva una sombra/brillo para parecer
   sofisticado" que cita la investigación, sin aportar legibilidad.

## Fuera de alcance (requiere verificación visual que hoy no puedo hacer)

- Sustituir los emoji usados como iconos (🌍, banderas, 📍, etc.) por un set de iconos SVG
  consistente. Es un cambio de mayor alcance (nueva dependencia o set de SVG a medida, toca
  `App.tsx` y varios componentes) que debería hacerse viendo el resultado, no a ciegas. Se
  documenta como follow-up.
- Cualquier cambio de layout, tipografía o jerarquía visual (tamaños, espaciados) — tocar esto
  sin ver el render es más probable que rompa algo que arreglarlo.
- Rediseño de la paleta base (`--bg`, `--accent`, `--accent-2`) — se mantiene, solo se
  consolidan los colores *ad-hoc* que ya apuntan al mismo significado que esos tokens.

## Criterios de aceptación (EARS)

- CUANDO se grep-ea `app/src/App.css` buscando los hex literales de "abierto/vivo" y
  "cerrado/riesgo" fuera de la definición de los nuevos tokens, EL resultado DEBE ser vacío
  (todos los usos pasan por `var(--ok)` / `var(--danger)` / `var(--warn)`).
- CUANDO se lista cada valor de `border-radius` usado en `App.css`, EL conjunto DEBE reducirse
  a como máximo 5 valores con nombre (`--radius-xs/sm/md/lg/full`), reemplazando los
  13+ valores sueltos actuales.
- CUANDO se grep-ea `box-shadow: 0 0` en elementos de estado de ≤8px (`.ticker-pulse`,
  `.cable-network__status`, `.market-item__indicator.indicator--live`), EL resultado DEBE ser
  vacío (el glow decorativo se retira, el color sigue comunicando el estado).
- CUANDO se ejecuta `npm run build`, EL sistema DEBE compilar sin errores (ningún cambio de
  comportamiento, solo de valores CSS).
- CUANDO el usuario abre el mapa en el navegador tras el cambio, NINGÚN layout debe romperse
  (paneles, chips, filas de ranking deben verse en la misma posición/tamaño relativo — a
  confirmar visualmente por el usuario, ya que yo no puedo verificarlo aquí).
