# SPEC — Worldwide Governance Indicators (WGI)

## Contexto

`mapa_econ` ("World Economic Map") muestra ~20 indicadores por país (economía, salud,
demografía, medio ambiente, infraestructura) alimentados por la API del World Bank y otros.
No existe hoy ninguna categoría de **gobernanza institucional**.

## Historias de usuario

- Como visitante del mapa, quiero poder seleccionar indicadores de gobernanza (estado de
  derecho, control de la corrupción, estabilidad política, eficacia del gobierno, calidad
  regulatoria, voz y rendición de cuentas) para comparar la calidad institucional entre países,
  igual que ya comparo PIB o esperanza de vida.
- Como visitante, quiero ver la fuente y el año de cada valor de gobernanza, igual que para
  cualquier otro indicador del mapa (trazabilidad).
- Como visitante, quiero que estos indicadores aparezcan también en las vistas de tendencia
  (serie temporal), ranking y comparación de países, sin tener que aprender una interfaz nueva.

## Alcance

**Indicadores a añadir** (los 6 pilares estándar de WGI, puntuación 0–100, World Bank Open
Data, fuente ya usada por el pipeline — ver PLAN.md para los códigos verificados):

1. Voice and Accountability (voz y rendición de cuentas)
2. Political Stability and Absence of Violence/Terrorism (estabilidad política)
3. Government Effectiveness (eficacia del gobierno)
4. Regulatory Quality (calidad regulatoria)
5. Rule of Law (estado de derecho)
6. Control of Corruption (control de la corrupción)

Nueva categoría (`domain`) de indicador: `governance`.

## Criterios de aceptación (EARS)

- CUANDO se ejecuta `python pipeline/build_snapshot.py`, EL sistema DEBE incluir los 6
  indicadores de gobernanza en `app/public/data/snapshot.json`, cada uno con `value`, `year`
  y la referencia de fuente (`source`), para todos los países con dato disponible en la API
  del World Bank.
- CUANDO se ejecuta `python pipeline/build_timeseries.py`, EL sistema DEBE incluir la serie
  histórica (2004–2024, donde exista) de los 6 indicadores de gobernanza en
  `app/public/data/timeseries.json`, sin cambios adicionales al script (reutiliza el catálogo
  de métricas existente).
- CUANDO el usuario abre el selector de indicadores del mapa, EL sistema DEBE mostrar un grupo
  "Governance" (o su traducción) con los 6 nuevos indicadores, en el mismo selector donde ya
  aparecen "Economy", "Health", etc.
- CUANDO el usuario selecciona un indicador de gobernanza, EL sistema DEBE colorear el mapa
  usando la misma escala de color que el resto de indicadores tipo "index" (p. ej. Gini), con
  `higherIsBetter = true` (más puntuación = mejor gobernanza).
- CUANDO el usuario abre el panel de un país con un indicador de gobernanza seleccionado, EL
  sistema DEBE mostrar valor, año y fuente igual que para cualquier otro indicador.
- CUANDO un país no tiene dato para un indicador de gobernanza (p. ej. territorios sin
  cobertura WGI), EL sistema DEBE omitir ese país para ese indicador sin romper el resto del
  mapa (mismo comportamiento que los indicadores existentes con cobertura parcial).

## Fuera de alcance

- Mostrar el intervalo de confianza / error estándar de cada estimación WGI (la API los
  expone, pero no se consumen en esta iteración).
- Cualquier fuente de gobernanza distinta de World Bank WGI (p. ej. V-Dem, Freedom House):
  quedan para una iteración futura si se decide usarlas.
- Cambios de diseño visual nuevos (iconos de dominio, paleta de color dedicada): se reutiliza
  el mecanismo de dominios/colores existente tal cual.
- Actualizar el recuento "20+ indicadores" u otro texto de marketing en `README.md` (cosmético,
  no bloquea la funcionalidad; puede hacerse aparte).
