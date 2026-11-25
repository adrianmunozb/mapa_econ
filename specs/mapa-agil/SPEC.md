# SPEC — Mapa más ágil, noticias visibles y en vivo

## Problemas (revisión del 25-nov-2026)
1. El botón principal de la portada lleva al riesgo soberano; se quiere "Abrir mapa".
2. Noticias: hay 146 titulares, pero solo aparecen al pulsar un país de una lista de 40
   situada al fondo del panel, tras periodo, tema, ubicación, gráfico, medios e importar.
   En producción son una foto fija: la actualización RSS solo funciona en desarrollo.
3. El mapa obliga a desplazarse por un panel largo (pestañas, buscador, desplegable de 61
   métricas, descripción, descargas, leyenda, ranking) y la ficha de país es un scroll único.

## Requisitos
- R1. Portada: botón principal "Abrir mapa" → mapa mundial completo.
- R2. Actualidad muestra al entrar la lista de titulares (título, medio, hora, país, enlace),
  con filtros rápidos de tema y periodo; pulsar un país la filtra; lo avanzado, plegado.
- R3. En Vercel, `/api/news-feed` sirve titulares RSS en vivo (caché 15 min) con el mismo
  lector y saneado que en desarrollo; si falla, la app conserva la última foto.
- R4. Barra superior fija con marca, Inicio, secciones y buscador (tecla `/`).
- R5. Cada sección ofrece sus métricas clave como botones; "Más indicadores" da el resto.
- R6. Leyenda flotante sobre el mapa; descripción de la métrica plegable.
- R7. Ranking: top 10 y "Ver todos".
- R8. Descargas en un único menú.
- R9. Ficha de país en pestañas con cifras clave al principio.
- R10. Controles de zoom y vista inicial.

## Aceptación
Tests, lint y build en verde; revisión en navegador (escritorio y móvil); la función de
noticias responde en producción con titulares de hoy.
