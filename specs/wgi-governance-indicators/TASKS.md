# TASKS — Worldwide Governance Indicators (WGI)

Orden de ejecución: 1→6 (cada una depende de que la anterior esté hecha). Cada tarea = un
commit atómico.

## 1. Tipos: nuevo dominio `governance`
- Archivo: `app/src/types.ts`
- Cambio: añadir `'governance'` a la unión `MetricDomain`.
- Hecho cuando: `cd app && npx tsc --noEmit` no reporta errores nuevos.

## 2. i18n: etiqueta del dominio
- Archivo: `app/src/i18n.ts`
- Cambio: añadir `governance: 'Governance'` a `DOMAIN_LABELS`.
- Hecho cuando: `domainLabel('governance')` devuelve `'Governance'` (comprobación manual o
  test rápido en consola de Vite).

## 3. Selector de métricas: nuevo grupo visible
- Archivo: `app/src/ui/MetricPicker.tsx`
- Cambio: insertar `'governance'` en `DOMAIN_ORDER`, después de `'social'`.
- Hecho cuando: `npx tsc --noEmit` sigue sin errores (depende de la tarea 1). El grupo no
  será visible aún en el navegador hasta la tarea 5 (no hay datos con `domain: governance`
  todavía) — eso es esperado.

## 4. Pipeline: catálogo de métricas WGI
- Archivo: `pipeline/build_snapshot.py`
- Cambio: añadir los 6 objetos a `METRICS` con los códigos verificados en `PLAN.md`
  (`GOV_WGI_VA.SC`, `GOV_WGI_PV.SC`, `GOV_WGI_GE.SC`, `GOV_WGI_RQ.SC`, `GOV_WGI_RL.SC`,
  `GOV_WGI_CC.SC`), `domain: "governance"`, `format: "index"`, `higherIsBetter: true`.
- Hecho cuando: `python pipeline/build_snapshot.py` termina sin error y el log muestra, para
  cada uno de los 6 indicadores nuevos, un número de "Länder mit Wert" > 150 (cobertura
  comparable a `gini`/`poverty`, que también tienen huecos).

## 5. Regenerar datos committeados
- Archivos: `app/public/data/snapshot.json`, `app/public/data/timeseries.json`
- Cambio: ejecutar `python pipeline/build_snapshot.py && python pipeline/build_timeseries.py`
  y commitear el resultado.
- Hecho cuando:
  - `git diff --stat` muestra solo esos dos ficheros de datos modificados (ningún otro
    indicador existente pierde o cambia valores fuera de un refresh normal — comparar antes/
    después con `pipeline/audit.py` si procede, pero no es obligatorio para esta feature).
  - `python -c "import json; d=json.load(open('app/public/data/snapshot.json')); print([m['id'] for m in d['metrics'] if m['domain']=='governance'])"`
    imprime los 6 ids nuevos.

## 6. Verificación end-to-end en el navegador
- Cambio: ninguno (solo verificación manual, sin tocar más código).
- Pasos: `cd app && npm run dev`, abrir `http://localhost:5173`, abrir el selector de
  indicadores, confirmar que aparece el grupo "Governance" con los 6 indicadores, seleccionar
  cada uno y comprobar: el mapa colorea países, el panel de país muestra valor + año + fuente
  ("World Bank Open Data"), y la vista de tendencia / ranking / comparación los acepta sin
  errores de consola.
- Hecho cuando: los 6 indicadores funcionan en las 4 vistas (mapa, panel, ranking,
  comparación) sin errores en la consola del navegador.

---

Fuera de estas tareas (no forman parte de esta feature, ver SPEC.md § Fuera de alcance):
actualizar `README.md`, exponer intervalos de confianza, añadir fuentes de gobernanza
distintas a WGI.
