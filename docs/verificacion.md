# Verificación contra fuente primaria

Generado con `python -m wem verify` el 2026-11-25. Compara lo que publica la app
con la institución que produce cada dato. Muestra: DEU, ESP, ITA, FRA, GRC, PRT, NLD, BGR.

## 1. Tipo oficial de la zona euro (BIS en la app) frente al BCE

Fuente primaria: [ECB Data Portal, facilidad de depósito (DFR)](https://data.ecb.europa.eu/data/datasets/FM/FM.B.U2.EUR.4F.KR.DFR.LEV).

| País | App | Periodo app | BCE (DFR) | Fecha BCE | Veredicto |
|---|---:|---|---:|---|---|
| DEU | 2.50 | 2026-11 | 2.50 | 2026-09-16 | OK |
| ESP | 2.50 | 2026-11 | 2.50 | 2026-09-16 | OK |
| BGR | 2.50 | 2026-11 | 2.50 | 2026-09-16 | OK |

## 2. Prima de riesgo frente al Bund (pb)

Fuente primaria: [Eurostat `irt_lt_mcby_m`](https://ec.europa.eu/eurostat/databrowser/view/irt_lt_mcby_m/default/table),
recalculada aquí con el mismo mes para el país y para Alemania. Se excluyen las series
con el mismo valor tres meses seguidos (no son precios de mercado).

| País | App (pb) | Mes app | Eurostat hoy (pb) | Mes Eurostat | Veredicto |
|---|---:|---|---:|---|---|
| DEU | 0.0 | 2026-10 | 0.0 | 2026-10 | OK |
| ESP | 65.0 | 2026-10 | 65.0 | 2026-10 | OK |
| ITA | 126.4 | 2026-10 | 126.4 | 2026-10 | OK |
| FRA | 147.4 | 2026-10 | 147.4 | 2026-10 | OK |
| GRC | 99.4 | 2026-10 | 99.4 | 2026-10 | OK |
| PRT | 50.1 | 2026-10 | 50.1 | 2026-10 | OK |
| NLD | 11.9 | 2026-10 | 11.9 | 2026-10 | OK |
| BGR | — | — | — | — | excluido: serie sin variación |

## 3. Capa de bonos (rentabilidad a 10 años) frente a Eurostat

La capa de bonos toma la fuente más reciente de cada país. Esta tabla mide si el valor
coincide con Eurostat para el mismo mes y cuántos meses va por detrás del último dato.
Por eso el diferencial se calcula aparte (sección 2) y no restando valores de esta capa.

| País | App 10A (%) | Fecha app | Fuente app | Eurostat mismo mes (%) | Dif. (pb) | Eurostat último (%) | Desfase (meses) | Veredicto |
|---|---:|---|---|---:|---:|---:|---:|---|
| DEU | 3.300 | 2026-11-25 | Deutsche Bundesbank | — | — | 3.416 (2026-10) | -1 | OK |
| ESP | 4.070 | 2026-10 | Banco de España · table 22.7 | 4.066 | 0.4 | 4.066 (2026-10) | 0 | OK |
| ITA | 4.680 | 2026-10 | Eurostat · EMU convergence criterion bond yields | 4.680 | 0.0 | 4.680 (2026-10) | 0 | OK |
| FRA | 4.766 | 2026-11-24 | Banque de France · CNO-TEC | — | — | 4.890 (2026-10) | -1 | OK |
| GRC | 4.410 | 2026-10 | Eurostat · EMU convergence criterion bond yields | 4.410 | 0.0 | 4.410 (2026-10) | 0 | OK |
| PRT | 3.917 | 2026-10 | Eurostat · EMU convergence criterion bond yields | 3.917 | 0.0 | 3.917 (2026-10) | 0 | OK |
| NLD | 3.535 | 2026-10 | Eurostat · EMU convergence criterion bond yields | 3.535 | 0.0 | 3.535 (2026-10) | 0 | OK |
| BGR | 4.090 | 2026-10 | Eurostat · EMU convergence criterion bond yields | 4.090 | 0.0 | 4.090 (2026-10) | 0 | OK |

## 4. Inflación (FMI en la app) frente al IPCA de Eurostat

Fuente primaria: [Eurostat `prc_hicp_minr`](https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_minr/default/table)
(tasa anual, total). La app usa el IPC nacional del FMI y Eurostat el IPC armonizado: son
conceptos distintos, así que se tolera hasta 0.5 pp.

| País | App (%) | Mes app | IPCA mismo mes (%) | Dif. (pp) | Veredicto |
|---|---:|---|---:|---:|---|
| DEU | 2.76 | 2026-10 | 2.90 | -0.14 | OK |
| ESP | 4.92 | 2026-09 | 5.00 | -0.08 | OK |
| ITA | 4.18 | 2026-09 | 4.20 | -0.02 | OK |
| FRA | 3.08 | 2026-09 | 3.40 | -0.32 | OK |
| GRC | 5.05 | 2026-09 | 5.10 | -0.05 | OK |
| PRT | 3.04 | 2026-07 | 3.10 | -0.06 | OK |
| NLD | 3.43 | 2026-09 | 3.00 | 0.43 | OK |
| BGR | 6.05 | 2026-10 | 5.90 | 0.15 | OK |

**Filas que requieren atención: 0.**
