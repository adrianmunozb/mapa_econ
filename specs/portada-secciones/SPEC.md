# SPEC — Portada con globo y secciones separadas

## Problema
La app abre directamente en un mapa con dos paneles cargados: selector de 61 métricas,
leyenda, grupos geopolíticos, seis capas, webcams, noticias, ranking, ticker de bolsas y
ficha de país. Quien entra no sabe por dónde empezar y casi todo compite por la atención.

## Objetivo
Una **portada** (inspiración visual: landing oscura con titular grande, píldora de
contexto y tarjetas de servicio, como markanamedia.com, sin copiar marca ni textos) con un
**globo terráqueo** y un menú que lleva a **secciones** separadas, cada una con solo sus
controles y capas.

## Secciones
| id | Nombre | Qué muestra |
|---|---|---|
| `riesgo` | Tipos y riesgo soberano | Métricas financieras (prima, tipos, inflación, bonos), leyenda, ranking, descarga CSV |
| `economia` | Economía y sociedad | Resto de métricas, evolución 10/20 años, grupos geopolíticos, ranking, CSV |
| `comercio` | Comercio y rutas marítimas | Flujos comerciales, pasos marítimos, rutas, cables submarinos |
| `mercados` | Mercados y bolsas | Bolsas en el mapa, ticker de mercados, ciclo día/noche |
| `pais` | Explorar un país | Buscador grande; la ficha completa del país elegido |
| `actualidad` | Actualidad | Noticias georreferenciadas y cámaras en directo |

## Requisitos
- R1. Sin parámetros en la URL se ve la portada. Un enlace compartido (`#s=…&m=…&c=…`)
  abre directamente su sección.
- R2. Cada sección tiene cabecera con "Inicio", su título y un selector para saltar a otra.
- R3. Entrar en una sección fija sus capas por defecto (p. ej. Comercio activa flujos y
  pasos marítimos; Riesgo los apaga todos).
- R4. Globo con MapLibre (proyección `globe`), con los países del propio dataset: funciona
  sin conexión. Rota despacio y se detiene con `prefers-reduced-motion`.
- R5. Accesible: las tarjetas son botones con nombre; el foco es visible; se navega con
  teclado.

## Aceptación
Tests, lint y build en verde; en el navegador, cada sección muestra solo sus controles
y la portada funciona en escritorio y móvil.
