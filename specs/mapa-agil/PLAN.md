# PLAN — Mapa ágil

| Decisión | Elegida | Descartada | Por qué |
|---|---|---|---|
| Noticias en vivo | Función serverless de Vercel que reutiliza `scripts/news-feed.mjs` | Llamar a los RSS desde el navegador | Los medios no permiten CORS; el servidor además sanea y cachea. |
| Caché de noticias | 15 min en memoria + `/tmp` de la función | Base de datos | Basta para titulares; si la función se reinicia, vuelve a descargar. |
| Métricas | Botones con las clave + desplegable "Más indicadores" | Solo desplegable | Las 4–6 métricas que importan, a un clic. |
| Ficha de país | Pestañas | Scroll único | Menos desplazamiento; lo clave, primero. |
