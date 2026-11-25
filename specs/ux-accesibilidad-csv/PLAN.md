# PLAN — Interfaz en español, ancla financiera primero, CSV y accesibilidad

| Decisión | Elegida | Descartada | Por qué |
|---|---|---|---|
| Idioma | Solo español | Selector EN/ES | Público del proyecto hispanohablante; un solo idioma evita mezclas y duplica menos texto. |
| Dónde viven las etiquetas en español | `app/src/i18n.ts` + `app/src/data/metricsEs.ts` | Añadir campos `labelEs` al pipeline | Sin regenerar datos; el pipeline sigue publicando EN/DE como hasta ahora. |
| Grupo financiero | Dominio derivado en la app (`displayDomain`) | Cambiar `domain` en el pipeline | El dato no cambia de naturaleza; es una decisión de presentación. |
| CSV | Generado en el navegador con `Blob` | Servir `data/csv/` como archivos | Funciona en el HTML de un solo archivo y sin red; coincide con lo que se ve. |
| Tema claro | **Descartado por ahora**: solo oscuro, con pulido tipo Apple (cifras tabulares, jerarquía tipográfica, objetivos táctiles de 44 px, hoja inferior en móvil) | Tema claro automático con `prefers-color-scheme` | El CSS tiene 278 colores fijos y la escala del mapa está pensada para fondo oscuro; hacerlo la víspera de la entrega arriesgaba contraste y legibilidad. Queda como siguiente paso. |

## Pasos

1. i18n en español, etiquetas de métricas, curva de bonos y textos sueltos.
2. Grupo "Tipos y riesgo soberano" y vista inicial en la prima de riesgo.
3. `lib/csv.ts`, botones de descarga y test contra `data/csv/history/`.
4. Accesibilidad.
5. Diseño: tokens de tema claro y oscuro, tipografía y hoja inferior en móvil.
6. Verificación en el navegador, despliegue en Vercel y PR.
