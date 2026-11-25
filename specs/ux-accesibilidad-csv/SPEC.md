# SPEC — Interfaz en español, ancla financiera primero, CSV y accesibilidad

## Problema (inspección del 25-nov-2026 sobre https://mapaecon.vercel.app)

- La interfaz mezcla idiomas: el núcleo (métricas, curva de bonos, ranking, comparador)
  está en inglés, las capas añadidas en español, y la página se declara `lang="en"`.
- Las métricas financieras (tipo oficial, tipo real, prima frente al Bund, bonos) aparecen
  mezcladas entre 61 métricas dentro de "Economy"; la vista inicial es el PIB per cápita.
- Las series CSV solo existen en el repositorio (`data/csv/`); desde la app no se pueden
  descargar.
- Accesibilidad:
  - el buscador no tiene etiqueta (solo un placeholder con emoji);
  - no hay landmark `<main>`;
  - hay textos de 9,5–10,5 px;
  - el estado del mercado se comunica con emoji 🟢/🔴;
  - el idioma declarado no coincide con el texto.
- Diseño: solo tema oscuro; en móvil el panel tapa media pantalla.

## Requisitos

- R1. Toda la interfaz en español (`lang="es"`, números y fechas en `es-ES`), incluidos los
  nombres y descripciones de las métricas.
- R2. Grupo **"Tipos y riesgo soberano"**, el primero del selector y de la ficha de cada
  país, con inflación, tipo oficial, tipo real, prima frente al Bund y rentabilidad de los
  bonos.
- R3. La vista inicial es la prima de riesgo frente al Bund.
- R4. Botones de descarga CSV, generados en el navegador a partir de los datos cargados:
  - serie histórica de la métrica (país × año, mismo formato que `data/csv/history/`);
  - valores actuales de la métrica (país, valor, periodo, unidad, fuente);
  - todos los datos de un país.
- R5. Accesibilidad (WCAG 2.1 AA):
  - el buscador tiene etiqueta;
  - hay landmark `<main>`;
  - ningún texto baja de 12 px;
  - los estados se dicen con texto, no solo con color o emoji;
  - Escape cierra la ficha;
  - se respeta `prefers-reduced-motion`.
- R6. Diseño tipo Apple:
  - tema claro y oscuro según el sistema, también para el mapa base;
  - escala tipográfica clara;
  - paneles con material translúcido;
  - en móvil, paneles como hoja inferior.

## Fuera de alcance

- Traducir las capas añadidas que ya están en español (noticias, rutas, webcams).
- Mantener el idioma inglés como opción (no se usaba: solo había un idioma).

## Aceptación

- Lint, typecheck, tests y build en verde.
- Un test comprueba que el CSV generado en el navegador coincide con el del pipeline para
  una métrica.
- Inspección en el navegador, en escritorio y en móvil, sin textos en inglés en el núcleo.
