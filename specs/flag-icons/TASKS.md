# TASKS — Sustituir emoji de bandera por iconos SVG reales

Orden 1→7, cada una un commit atómico. A partir de la tarea 4 verifico en el navegador
(extensión conectada) antes de pasar a la siguiente.

## 1. Generador de banderas
- Archivos: `app/package.json` (`flag-icons` como devDependency), `app/scripts/build-flags.mjs`.
- Hecho cuando: `node scripts/build-flags.mjs` corre sin error.

## 2. Datos generados
- Archivo: `app/src/data/flags.ts` (salida del script, committeada).
- Hecho cuando: el fichero tiene 271 entradas y `npx tsc --noEmit` no da error.

## 3. Componente `Flag` + CSS
- Archivos: `app/src/ui/Flag.tsx`, `app/src/App.css`.
- Hecho cuando: `npm run build` compila sin error (el componente no se usa aún en ningún
  sitio — cero riesgo visual en este paso).

## 4. Migrar RankingList y SearchBox
- Archivos: `app/src/ui/RankingList.tsx`, `app/src/ui/SearchBox.tsx`.
- Hecho cuando: en el navegador, el ranking y los resultados del buscador muestran banderas
  SVG reales, no texto de dos letras.

## 5. Migrar CountryPanel y CompareBar/CompareTable
- Archivos: `app/src/ui/CountryPanel.tsx`, `app/src/ui/CompareBar.tsx`,
  `app/src/ui/CompareTable.tsx`.
- Hecho cuando: en el navegador, el panel de país, la barra de comparación y la tabla de
  comparación muestran banderas SVG reales.

## 6. Borrar `lib/flag.ts`
- Hecho cuando: `grep -rn "flagEmoji\|lib/flag" app/src` no devuelve nada y `npm run build`
  sigue sin error.

## 7. Build de archivo único + verificación final
- Comando: `cd app && npm run build`.
- Hecho cuando: build sin error, y al abrir `dist/index.html` (o `localhost:5173` tras el
  cambio) compruebo en el navegador que las banderas se ven en las 4 vistas y que no hay
  peticiones de red fallidas en la consola para mostrarlas.
