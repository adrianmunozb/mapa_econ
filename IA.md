# Uso de IA en este proyecto

Esta página cumple las reglas del carril: **declarar** qué herramientas usamos y para qué, y
**guardar el rastro**. Lo que no aparece aquí no lo hizo una IA.

## Herramientas y para qué

| Herramienta | Modelo | Para qué | Rastro |
|---|---|---|---|
| Claude Code (escritorio) | Claude Sonnet 5 | Indicadores de gobernanza WGI, banderas, reorganización del menú y diseño (21-oct-2026). | 20 commits con `Co-Authored-By: Claude Sonnet 5`; `specs/wgi-governance-indicators`, `specs/flag-icons`, `specs/menu-structure`, `specs/apple-design-system` |
| Claude Code (web) | Claude Sonnet 5.5 | Refactor del pipeline en el paquete `wem`, Sáhara Occidental, catálogo de 40 indicadores, exportación CSV, CI (PR #1, 1-oct y 23-nov-2026). | 8 commits con autor `Claude`; sesión `claude.ai/code/session_01W3Lv3JMEUQePZDG7ZJLh8M` |
| Claude Code (escritorio) | Claude Opus 5.5 | Auditoría contra fuentes primarias, Bulgaria, caducidad de bonos, prima de riesgo, tipo real y `wem verify` (25-nov-2026). | Rama `feat/ancla-financiera`; `specs/ancla-financiera` |
| PENDIENTE (Adrián Muñoz) | PENDIENTE | Capas de bonos, rutas marítimas, noticias, webcams y regiones (commits `30c8597`, `9e6a8e4`). | PENDIENTE |

## Cómo la usamos

- **La IA escribe código; nosotros decidimos y comprobamos.** Cada cambio no trivial empieza
  con un `SPEC.md` / `PLAN.md` / `TASKS.md` en `specs/`, y se hace en commits pequeños.
- **Ningún dato se acepta porque lo diga la IA.** Las cifras se contrastan con la institución
  que las publica (BIS, BCE, Eurostat, Banco de España). `python -m wem verify` lo automatiza
  y deja el resultado en [`docs/verificacion.md`](docs/verificacion.md).
- **Tests y CI** en cada cambio: tests offline del pipeline, tests de la app, lint, typecheck
  y build.

## Errores de la máquina detectados

Están detallados, con la fuente primaria de cada comprobación, en la bitácora. Resumen:

1. En la sesión con IA que regeneró los datos de WGI (commit `06b9f1b`) se ejecutó
   `wem snapshot` sin `wem current`, y eso borró el tipo oficial y la inflación mensual. Lo comprobamos contra el BIS (`WS_CBPOL`).
2. La capa de bonos mezclaba fuentes y fechas: la prima Italia–Bund implícita era de unos
   50 pb, frente a unos 126 pb reales en octubre de 2026. Lo comprobamos contra Eurostat
   (`irt_lt_mcby_m`).
3. Bulgaria seguía fuera del euro en el código (conocimiento del modelo anterior a 2026).
   Lo comprobamos contra el BCE y los metadatos del BIS.
4. El PR #1 anunciaba 40 indicadores, pero los datos publicados tenían 25. Lo comprobamos
   contra `snapshot.json`.

En la auditoría, la IA también sospechó que el BIS daba la MRO del BCE en lugar de la DFR.
Era falso: los metadatos del BIS y la ECB Data API confirman que es la DFR desde el
18-sep-2024. Lo dejamos anotado porque también es control sobre la máquina.
