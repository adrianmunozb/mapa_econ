# PLAN — Portada y secciones

| Decisión | Elegida | Descartada | Por qué |
|---|---|---|---|
| Navegación | Estado `section` en `App` + `#s=` en la URL | Router (react-router) | Una dependencia nueva para 7 vistas que comparten el mismo mapa. |
| Globo | MapLibre con `projection: globe` y el GeoJSON de países ya cargado | Three.js / imagen estática | MapLibre ya está instalado y el globo usa los mismos datos, también sin red. |
| Configuración de secciones | Tabla `SECTIONS` en `src/sections.ts` (métricas, capas y paneles por sección) | Condiciones repartidas por `App` | Un solo sitio para leer qué ve cada sección. |
| Mapa detrás de la portada | El mapa se sigue cargando debajo | Cargarlo al salir de la portada | Al elegir sección el mapa ya está listo. |

## Pasos
1. `sections.ts` + tests de la tabla.
2. `Globe.tsx` y `Landing.tsx` (+ CSS).
3. `App`: estado de sección, cabecera con navegación y paneles condicionados.
4. Verificación en navegador, despliegue y PR.
