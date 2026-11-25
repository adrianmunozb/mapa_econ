# Bitácora — Mapa económico mundial con ancla en riesgo soberano

Adrián López Lamata · Adrián Muñoz Borbón · Carril abierto, nivel 2 (CONSTRUIR) · 26-nov-2026
Repositorio: https://github.com/adrianmunozb/mapa_econ · Uso de IA declarado en [`IA.md`](IA.md)

> **BORRADOR.** Los hechos, cifras y fuentes están comprobados y enlazados. Los bloques ✏️
> los tenéis que escribir vosotros, con vuestras palabras: son vuestras decisiones y nadie
> más puede contarlas. Borrad esta nota y los ✏️ antes de entregar.

## 1. Qué queríamos hacer y qué hicimos

✏️ *Qué propusisteis el 24-sep (2-3 líneas) y vuestro criterio de éxito tal como lo
escribisteis entonces. Si la idea cambió por el camino, decid cuándo y por qué: el
profesor pide que se documente.*

**Qué hicimos.** Partimos de un mapa abierto de indicadores macro
([vrjo/WorldEconomicMap](https://github.com/vrjo/WorldEconomicMap)) y lo convertimos en una
herramienta en la que cada cifra financiera es **trazable y verificable**:

- **Datos:** 33 indicadores más del Banco Mundial (58 en total); gobernanza WGI; tipo
  oficial de 58 bancos centrales (BIS) y tipo real.
- **Lo que no salió:** los 7 indicadores del FMI previstos (entre ellos deuda pública y saldo
  fiscal) no se publican, porque la API DataMapper del FMI rechaza las peticiones
  automatizadas desde nuestro equipo. El pipeline los marca como opcionales y los omite sin
  inventarlos.
- **Bonos:** curvas de deuda pública por plazo; prima de riesgo frente al Bund en la zona
  euro.
- **Control:** un paso, `wem verify`, que contrasta lo publicado con la fuente primaria.

Reparto del trabajo:
- **Adrián Muñoz:** regiones, capa de bonos, rutas marítimas, noticias y webcams.
- **Adrián López:** WGI, banderas, menú, refactor del pipeline, CI, auditoría y ancla
  financiera.
- ✏️ *Corregid o completad el reparto.*

## 2. El ancla financiera

La pieza del sistema que tocamos es la de **tipos de interés y riesgo soberano**:

- **Tipo oficial.** Es el instrumento del banco central. En la zona euro, desde el
  18-sep-2024 el BCE dirige su política con el tipo de la facilidad de depósito (DFR), no
  con el de las operaciones principales (MRO). En noviembre de 2026 la DFR está en el 2,50 %.
- **Tipo real ex post** (tipo oficial − inflación). Dice si la política es restrictiva en
  términos reales. Turquía: 36 % − 29,7 % = +6,3 pp. Usa inflación pasada, no esperada, y
  lo indicamos en el propio dato.
- **Prima de riesgo** (rentabilidad a 10 años del país − la del Bund alemán). Mide lo que el
  mercado exige por el riesgo de crédito de ese Estado frente al activo de referencia. Solo
  es comparable si los dos bonos están en **la misma moneda**: fuera del euro, el
  diferencial también incluye el riesgo de tipo de cambio y la inflación esperada. Por eso
  la calculamos solo para los 21 países del euro.

✏️ *Por qué os interesa esta pieza (2-3 líneas). Ejemplo concreto: en octubre de 2026
Francia (4,89 %) paga más que Italia (4,68 %) a 10 años según Eurostat. ¿Qué os dice eso?*

## 3. Tres decisiones importantes y qué descartamos

**D1. Partir de un proyecto abierto existente en lugar de empezar de cero.**
- *Ganamos:* un mapa funcional desde la primera semana, para dedicar el tiempo a los datos
  y a su verificación.
- *Coste:* firmamos código que no escribimos. Lo mitigamos documentando cada cambio en
  `specs/` (SPEC, PLAN y TASKS antes de programar) y declarando la base en el README.
- *Descartado:* construir el mapa desde cero.
- ✏️ *Vuestra razón real.*

**D2. Datos estáticos, versionados en el repo, en lugar de llamadas a las API en vivo.**
- *Ganamos:* la app funciona sin red ni claves, es un único HTML y cualquiera reproduce
  exactamente lo que vimos.
- *Coste:* los datos envejecen. Lo sufrimos: la capa de bonos medía la antigüedad contra
  el reloj del navegador, y la curva española (dato de julio) iba a desaparecer sola a
  finales de diciembre. Ahora la antigüedad se mide contra la fecha en que se generaron
  los datos.
- *Descartado:* consultar las API desde el navegador (claves, límites de uso, CORS, y nada
  reproducible).

**D3. Una sola fuente homogénea para comparar países, aunque sea menos reciente.**
- La capa de bonos toma, para cada país, el dato más reciente que encuentra: Bundesbank
  diario, Banco de España mensual, OCDE vía FRED o Eurostat. Para la curva de un solo país
  es lo correcto. Para comparar países, no.
- Para la prima de riesgo usamos solo Eurostat (`irt_lt_mcby_m`, criterio de convergencia
  de Maastricht), el mismo método y **el mismo mes** para el país y para Alemania.
- *Descartado:* restar los valores de la capa de bonos (caso 1 del apartado 4).
- *También descartado:* interpolar plazos que no existen. Si un país no tiene bono a
  7 años, el mapa lo deja en gris (regla `No nearest-term fallback` en `bonds.ts`).

✏️ *Lo que dejasteis fuera de alcance y por qué (por ejemplo, webcams, noticias y rutas
marítimas no forman parte del ancla financiera).*

## 4. Dónde falló la máquina

### Caso 1 — Una prima de riesgo con fechas mezcladas

- **Qué dijo la IA.** Construyó la capa de bonos eligiendo "la observación oficial más
  reciente" de cada país. En el mapa, Alemania aparecía con 3,49 % (Bundesbank, 19-oct-2026)
  e Italia con 3,986 % (OCDE vía FRED, agosto de 2026). Cualquiera que restara leía una
  prima Italia–Bund de **≈ 50 pb**.
- **Cómo lo detectamos.** Al revisar la tabla de fuentes de `docs/bond-yields.md`, las
  fechas de los países del euro iban de julio a octubre. Un diferencial solo tiene sentido
  con la misma fecha.
- **Fuente primaria.** Eurostat `irt_lt_mcby_m`, octubre de 2026: Italia 4,68 % y Alemania
  3,416 %, es decir, **≈ 126 pb**. El mapa mostraba menos de la mitad.
- Incluso usando el mes del dato italiano (agosto: 3,986 − 3,185), la prima habría sido de
  80 pb, no de 50.
- **Arreglo:** la métrica `euro_spread_bund` (decisión D3), con un test que impide restar
  meses distintos.

### Caso 2 — Los tipos oficiales desaparecieron al añadir indicadores

- **Qué hizo la IA.** Al regenerar los datos para añadir los indicadores WGI (commit
  `06b9f1b`, sesión con Claude Sonnet 5) ejecutó `wem snapshot`, que reescribe
  `snapshot.json` desde cero, pero no `wem current`, que es el paso que añade el tipo
  oficial y la inflación mensual. El README ya avisaba de ese orden.
- **Resultado.** El mapa pasó de 20 a 25 métricas, pero perdió justo el tipo oficial: el
  indicador más financiero. El README lo seguía anunciando. El PR #1, además, decía
  "add 40 indicators" con 25 métricas publicadas.
- **Cómo lo detectamos.** Comparando la lista de métricas de `snapshot.json` commit a
  commit (`git log` del archivo).
- **Fuente primaria.** BIS `WS_CBPOL`. Restaurado: 57 países. La zona euro tiene un 2,50 %
  a 17-nov-2026, igual que la DFR del BCE.

### Caso 3 — Bulgaria seguía fuera del euro

- **Qué dijo la IA.** El código asignaba el tipo del BCE a 20 países (`EURO_AREA_ISO3`). Es
  la lista anterior a 2026: el conocimiento del modelo iba por detrás del cambio.
- **Cómo lo detectamos.** Bulgaria salía sin tipo oficial. Consultamos la API del BIS para
  Bulgaria (`D.BG`) y no hay serie, así que el dato tenía que venir del BCE.
- **Fuente primaria.** BCE: Bulgaria es miembro de la zona euro desde el 1-ene-2026.
  ✏️ *Enlazad la nota del BCE o la Decisión del Consejo que hayáis consultado.*
- **Arreglo:** 21 miembros y un test.

### La máquina repitió el error del caso 1

Al programar el tipo real, la IA restó para Argentina un tipo oficial de julio de 2025 a una
inflación de octubre de 2026 (−4,1 pp). El BCRA dejó de publicar un tipo de referencia en
julio de 2025, así que la cifra no significaba nada.

Salió en la sesión de auditoría, al revisar la salida país por país buscando periodos que no
cuadraban. Ahora el tipo
real solo se calcula si las dos cifras son mensuales y están a 3 meses o menos (commit
`8c3cd16`). Es la misma lección que el caso 1: **una resta solo vale con fechas
comparables**.

### Y una vez en que la máquina sospechó mal

Durante la auditoría, la IA planteó que el BIS daba para la zona euro la MRO (2,65 %) en
lugar de la DFR. Lo comprobamos:
- los metadatos de la serie del BIS dicen *"from 18 Sep 2024 onwards: official central bank
  steering rate is the deposit facility rate"*;
- la ECB Data API da DFR = 2,50 %.

La sospecha era falsa. Desconfiar de la máquina también incluye desconfiar de sus alarmas.

## 5. Qué haríamos distinto

- **Verificar contra la fuente primaria desde el primer día.** Hacerlo al final es lo que
  nos dejó encontrar tres errores la víspera de la entrega. `wem verify` existe ahora; debía
  existir en septiembre.
- **No dar por buena la descripción que la IA hace de su propio trabajo** (los "40
  indicadores"). Comprobar el artefacto, no el resumen.
- **Menos capas, más profundidad.** ✏️ *¿Lo creéis así? Decidlo con vuestras palabras.*
- ✏️ *Una cosa más que sea solo vuestra.*

---
*Anexo (fuera de las 4 páginas): [`IA.md`](IA.md) (herramientas, modelos y rastro),
[`docs/verificacion.md`](docs/verificacion.md) (última verificación) y [`specs/`](specs/)
(diseño antes del código).*
