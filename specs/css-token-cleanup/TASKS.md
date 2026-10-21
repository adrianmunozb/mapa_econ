# TASKS — Limpieza de "AI slop" visual en App.css

## 1. Añadir tokens semánticos
- Archivo: `app/src/index.css`
- Cambio: añadir los 9 tokens de `PLAN.md` a `:root`.
- Hecho cuando: `npx tsc --noEmit` sigue sin errores (no afecta TS, pero confirma que no se ha
  roto nada al guardar).

## 2. Consolidar colores de estado en App.css
- Archivo: `app/src/App.css`
- Cambio: reemplazar los hex/rgba de "abierto", "cerrado/riesgo" y "destacado" por los tokens
  nuevos, revisando cada ocurrencia (no un sustituir-todo ciego).
- Hecho cuando: `grep -n "#22c55e\|#4ade80\|#ef4444\|#f87171\|#ffd166" app/src/App.css` solo
  devuelve la línea de definición de los tokens en `index.css` (ninguna en `App.css`).

## 3. Normalizar la escala de border-radius
- Archivo: `app/src/App.css`
- Cambio: remapear cada `border-radius` suelto al tier más cercano (`--radius-xs/sm/md/lg/full`),
  dejando intactos los `50%` literales (círculos).
- Hecho cuando: `grep -o "border-radius:[^;]*" app/src/App.css | sort -u` muestra como máximo
  5 valores con nombre + `50%`.

## 4. Retirar glow decorativo en puntos de estado
- Archivo: `app/src/App.css`
- Cambio: eliminar la línea `box-shadow` en `.ticker-pulse`, `.cable-network__status` y
  `.market-item__indicator.indicator--live` (mantener el `background`).
- Hecho cuando: ninguna de esas tres reglas tiene `box-shadow`.

## 5. Verificación de build
- Cambio: ninguno, solo comprobación.
- Comando: `cd app && npm run build`.
- Hecho cuando: build termina sin error (ya lo hizo antes del cambio; debe seguir así).

## 6. Verificación visual (pendiente del usuario)
- Sin extensión de Chrome conectada, esta tarea la confirma el usuario abriendo
  `http://localhost:5173`: paneles, chips, filas de ranking y los tres indicadores de estado
  deben verse igual que antes salvo por los colores/radios ahora consistentes.
