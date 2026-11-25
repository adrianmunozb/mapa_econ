# PLAN — Ancla financiera

## Decisiones

| Decisión | Elegida | Descartada | Por qué |
|---|---|---|---|
| Fuente de la prima de riesgo | Eurostat `irt_lt_mcby_m`, mismo mes para todos | Restar los valores de la capa de bonos | La capa mezcla fuentes, fechas (diario/mensual) y métodos; un diferencial solo tiene sentido con la misma fecha y el mismo método. |
| Perímetro | Solo zona euro (21 países con BGR) | Todos los países con bono a 10 años | Fuera del euro el diferencial mezcla riesgo de crédito con riesgo de tipo de cambio e inflación esperada. |
| Mes de referencia | El último mes con dato **para Alemania y el país** a la vez | El último mes de cada país | Evita restar meses distintos (el error original). |
| Tipo real | Tipo oficial − última inflación interanual (ex post) | Tipo − inflación esperada (ex ante) | No hay expectativas homogéneas para ~180 países; se documenta la aproximación. |
| Tipo del BCE | El que publica el BIS (DFR desde 18-sep-2024) | Sustituirlo por la MRO | Verificado contra los metadatos del BIS y la ECB Data API: DFR = 2,5 %, igual que el BIS. |
| Caducidad de bonos | Relativa a `generatedAt` | Relativa a `Date.now()` | Con datos estáticos, "reciente" debe significar "reciente cuando se publicó". |
| Verificación | Paso `wem verify` reproducible que escribe un informe | Comprobaciones manuales sueltas | La rúbrica premia el control sobre la máquina: así es repetible delante de quien corrige. |

## Cambios

- `pipeline/wem/providers/bis.py`: BGR en `EURO_AREA_ISO3`.
- `pipeline/wem/providers/eurostat.py` (nuevo): parser JSON-stat de `irt_lt_mcby_m`.
- `pipeline/wem/providers/ecb.py` (nuevo): última DFR desde la ECB Data API (solo `verify`).
- `pipeline/wem/steps/current.py`: añade `euro_spread_bund` y `real_policy_rate`.
- `pipeline/wem/steps/verify.py` (nuevo, fuera de `all`): informe `docs/verificacion.md`.
- `app/src/data/bonds.ts`, `YieldCurve.tsx`, `CountryPanel.tsx`, `App.tsx`: caducidad por
  `generatedAt` y fuente honesta en la métrica de bonos.
- Datos: `snapshot`, `timeseries`, `current`, `i18n` y `export` regenerados.

## Riesgos

- APIs caídas el día de la entrega: los datos se versionan en el repo, la app no depende de
  la red; `verify` informa del fallo en lugar de abortar.
- El refresco cambia muchos valores a la vez: se revisa el diff de métricas y países antes
  de hacer commit.
