# SPEC — Sustituir emoji de bandera por iconos SVG reales

## Contexto

El usuario dijo que el diseño se ve "feo, poco profesional". Con la extensión de Chrome ya
conectada, lo he visto en `localhost:5173` (Windows): **las banderas de país se muestran como
texto plano** ("ES", "SX", "GU", "CY"…) en vez de banderas, en el ranking, el panel de país,
el comparador y el buscador. No es una opinión de diseño — es un bug real: `lib/flag.ts`
genera secuencias Unicode "regional indicator" (🇪🇸), que macOS/iOS/Android renderizan como
bandera, pero la fuente de emoji de Windows (Segoe UI Emoji) no — ahí degradan al código de
país en texto. La mayoría de usuarios de un mapa económico en escritorio están en Windows, así
que este es el problema de pulido más visible y verificable que hay hoy.

Esto estaba señalado como "fuera de alcance" en la auditoría de diseño anterior porque
entonces no podía ver el resultado. Ahora sí puedo (extensión conectada), así que lo saco de
"fuera de alcance" y lo arreglo verificando en el navegador en cada paso.

## Historias de usuario

- Como visitante en Windows (la mayoría), quiero ver banderas reales junto a cada país, no un
  código de dos letras, en cualquier sitio donde aparezcan hoy.
- Como responsable del proyecto, quiero que la app siga funcionando offline / como build de
  un único archivo (ver `README.md` — "Fast & offline-capable… zero external API keys"), así
  que las banderas no pueden depender de una llamada de red a un CDN externo en cada render.

## Alcance

- Sustituir `flagEmoji()` (`app/src/lib/flag.ts`) por un componente `<Flag iso2 />` que
  renderiza un SVG de bandera real, en los 5 sitios que hoy llaman a `flagEmoji`:
  `CompareBar.tsx`, `CompareTable.tsx`, `CountryPanel.tsx`, `RankingList.tsx`, `SearchBox.tsx`.
- Las banderas se generan **en build-time**, no se cargan de un CDN: se usa el paquete
  `flag-icons` (MIT, 271 banderas SVG) solo como `devDependency`/herramienta de generación —
  un script escribe un único módulo `app/src/data/flags.ts` con cada bandera codificada en
  base64 (`data:image/svg+xml;base64,…`), igual que el resto de datos del proyecto (pipeline
  Python → JSON committeado). **Cero dependencia en tiempo de ejecución, cero llamada de
  red**, compatible con el build de archivo único (ver `PLAN.md` para por qué un enfoque
  basado en CSS/`url()` no lo sería).

## Fuera de alcance

- Sustituir el resto de emoji (🌍, ⚓, 📈, ◐, etc.) de la interfaz — ese es un cambio mayor,
  de iconografía general, no de un bug de compatibilidad concreto como este. Se revisa aparte
  si el usuario lo pide tras ver este arreglo.
- Cambiar el tamaño/posición de las banderas respecto a hoy — mismo sitio, mismo tamaño
  aproximado, solo la fuente de la imagen cambia de emoji a SVG.

## Criterios de aceptación (EARS)

- CUANDO se abre `localhost:5173` en Chrome/Windows y se despliega el ranking, el panel de
  país, el comparador o el buscador, EL sistema DEBE mostrar una bandera gráfica real por
  país, no un código de dos letras.
- CUANDO un país no tiene `iso2` válido, EL sistema DEBE degradar de forma visible pero no
  rota (mismo comportamiento que hoy con `🏳️`, adaptado al nuevo componente).
- CUANDO se ejecuta `npm run build` (incluyendo el paso de archivo único), EL resultado DEBE
  seguir abriendo offline sin peticiones de red para mostrar banderas.
- CUANDO se ejecuta `npm run build`, EL sistema DEBE compilar sin error.
- Verificación visual: confirmo yo mismo en el navegador (extensión conectada) antes de dar la
  tarea por terminada — no vuelvo a reportar éxito sin haberlo visto.
