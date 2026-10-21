# PLAN — Worldwide Governance Indicators (WGI)

## Códigos de indicador verificados

Verificado en vivo contra `api.worldbank.org` (source=3, "Worldwide Governance Indicators"),
variante `.SC` = "Governance score (0–100)" (más legible en un mapa que la variante `.EST`,
que usa una escala ~-2.5..+2.5):

| id (nuevo)              | indicatorCode    | Ejemplo real (confirmado por API)        |
|--------------------------|------------------|-------------------------------------------|
| `voice_accountability`   | `GOV_WGI_VA.SC`  | DEU 2025 = 86.0                            |
| `political_stability`    | `GOV_WGI_PV.SC`  | —                                           |
| `government_effectiveness` | `GOV_WGI_GE.SC` | —                                        |
| `regulatory_quality`     | `GOV_WGI_RQ.SC`  | —                                           |
| `rule_of_law`            | `GOV_WGI_RL.SC`  | USA 2025 = 71.7                            |
| `control_of_corruption`  | `GOV_WGI_CC.SC`  | —                                           |

Nota: los códigos "intuitivos" (`VA.PER.RNK`, `RL.PER.RNK`, etc., del antiguo percentile
rank) están **archivados/eliminados** en la API actual — confirmado con un 404 lógico
("indicator not found"). Solo los códigos `GOV_WGI_*.SC` listados arriba responden hoy.

## Modelo de datos

- `app/src/types.ts`: `MetricDomain` gana un nuevo miembro `'governance'`. No hace falta
  ningún `MetricFormat` nuevo: `'index'` (ya usado por `gini`, escala 0–100) sirve tal cual.
- `pipeline/build_snapshot.py`: 6 entradas nuevas en `METRICS`, mismo shape que las 18
  existentes (`domain: "governance"`, `format: "index"`, `unit: "Index 0–100"`,
  `higherIsBetter: true`, `source` implícito = `WB_SOURCE` como todas las demás).
- `snapshot.json` / `timeseries.json`: no cambia su *esquema*, solo gana 6 entradas en
  `metrics[]` y 6 claves nuevas por país en `metrics{}` / `data{}` — el pipeline ya es
  genérico sobre `METRICS`, así que `build_timeseries.py` no necesita tocarse.

## Archivos a tocar

1. `pipeline/build_snapshot.py` — añadir 6 objetos a `METRICS`.
2. `app/src/types.ts` — añadir `'governance'` a `MetricDomain`.
3. `app/src/i18n.ts` — añadir `governance: 'Governance'` a `DOMAIN_LABELS`.
4. `app/src/ui/MetricPicker.tsx` — añadir `'governance'` a `DOMAIN_ORDER` (determina dónde
   aparece el grupo en el `<select>`; se coloca tras `'social'`, antes de `'demographics'`,
   por afinidad temática con el resto de indicadores sociales/institucionales).
5. Regenerar datos committeados: `app/public/data/snapshot.json` y
   `app/public/data/timeseries.json` (ejecutando los scripts del pipeline).
6. `README.md` — opcional, actualizar la lista de features si se quiere reflejar la nueva
   categoría (no bloqueante, no forma parte de los criterios de aceptación).

No se toca: `types.ts` (`MetricMeta`/`MetricValue`/`Snapshot`), `colors.ts`, `format.ts`,
`CountryPanel.tsx`, `CompareTable.tsx`, rankings — todos son genéricos sobre
`domain`/`format`/`higherIsBetter` y ya funcionan sin cambios (verificado: ningún id de
métrica ni valor de `format` está hardcodeado fuera de `MetricPicker`/`i18n`).

## Alternativas consideradas

- **Usar `.EST` (escala -2.5..+2.5) en vez de `.SC` (0–100).** Descartado: rompería la
  convención de formato `'index'` 0–100 ya establecida por `gini`, y `format.ts` no tiene
  hoy un formateador para escalas con signo centradas en 0. `.SC` es un drop-in perfecto.
- **Crear un `SourceRef` nuevo ("World Bank — Worldwide Governance Indicators") en vez de
  reutilizar `WB_SOURCE`.** Descartado por consistencia: el pipeline ya atribuye a
  `WB_SOURCE` indicadores cuyo compilador original es otro organismo (p. ej. `unemployment`
  es una estimación de la OIT, pero se sirve — y se atribuye — vía World Bank Open Data). Se
  documenta aquí como decisión explícita, no silenciosa.
- **Añadir también intervalo de confianza (`.SC_LB`/`.SC_UB`) o nº de fuentes (`.SR`).**
  Descartado por YAGNI: ningún otro indicador del mapa muestra incertidumbre estadística hoy;
  añadirlo solo para WGI sería una asimetría de UI no pedida. Puede revisitarse si se pide
  explícitamente.

## Riesgos

- **Cobertura incompleta.** WGI no cubre algunos microestados/territorios que sí tienen
  geometría en Natural Earth. Mitigación: ya es el comportamiento estándar del pipeline
  (criterio de aceptación "omitir sin romper el mapa"); no se necesita código nuevo.
- **Rate limiting de la API del World Bank** al añadir 6 llamadas más a `fetch_indicator`.
  Mitigación: ninguna — el patrón `get_json` ya tiene reintento/backoff y el resto del
  pipeline ya hace ~18 llamadas secuenciales sin problema; 6 más es el mismo orden de
  magnitud.
- **Nombre de dominio inconsistente con el resto (inglés como label visible vs. etiquetas en
  alemán del catálogo de `METRICS`).** Mitigación: seguir el patrón exacto de las etiquetas de
  métrica existentes (`label` alemán + `labelEn` inglés) tal cual se hace para los otros 18
  indicadores; no inventar un patrón nuevo.
