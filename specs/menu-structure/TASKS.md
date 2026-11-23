# TASKS — Reorganizar el panel de controles

Orden 1→5, cada una un commit atómico.

## 1. Componente `Section`
- Archivo nuevo: `app/src/ui/Section.tsx` (ver `PLAN.md`).
- Hecho cuando: `npx tsc --noEmit` compila sin error (el componente no se usa todavía en
  ningún sitio, así que no hay cambio visual aún).

## 2. Estilos de sección
- Archivo: `app/src/App.css` — bloque `.section*` nuevo.
- Hecho cuando: `npm run build` sigue sin error (las clases no se usan todavía, cero riesgo
  visual en este paso).

## 3. Etiqueta "Indicador" + sección "Grupos geopolíticos"
- Archivo: `app/src/App.tsx`
- Cambio: añadir la etiqueta no interactiva antes del buscador; envolver `AlliancePicker` en
  `<Section title="Grupos geopolíticos" …>`.
- Hecho cuando: `npm run build` sin error; `grep -n "Grupos geopolíticos" app/src/App.tsx`
  encuentra la nueva sección.

## 4. Sección "Capas del mapa" + mover la pista/leyenda de comercio
- Archivo: `app/src/App.tsx`
- Cambio: envolver el bloque `layer-toggles` (+ Webcam/News/cable legend) en
  `<Section title="Capas del mapa" …>`; mover el bloque de pista/leyenda de comercio a justo
  después del botón de Comercio, dentro de la misma sección; añadir `activeLayerCount`.
- Hecho cuando: `npm run build` sin error; el bloque de comercio ya no aparece después de
  `layer-toggles` en el JSX sino dentro de la nueva sección (revisar diff línea a línea, es el
  único movimiento no trivial de este plan).

## 5. Build final
- Comando: `cd app && npm run build`.
- Hecho cuando: build sin error. La verificación visual (que las 3 secciones se vean, se
  plieguen/desplieguen, y que la insignia de capas activas aparezca) la confirma el usuario —
  sigo sin extensión de Chrome conectada.
