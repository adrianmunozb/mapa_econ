# SPEC — Ancla financiera: prima de riesgo, tipos y verificación contra fuente primaria

## Problema

Una auditoría del 25-nov-2026 contra fuentes primarias encontró que el mapa, en su parte
más financiera, mostraba datos incompletos o engañosos:

1. **Tipos oficiales perdidos.** Al regenerar `snapshot.json` para los indicadores WGI
   (commit `06b9f1b`) se ejecutó `wem snapshot` sin `wem current`: desaparecieron el tipo
   oficial (BIS) y la inflación mensual (FMI). El README los seguía anunciando.
2. **Prima de riesgo no comparable.** La capa de bonos toma la fuente "más fresca" de cada
   país (Bundesbank diario, BdE mensual, OCDE vía FRED, Eurostat). En octubre de 2026 el mapa
   comparaba Alemania (19-oct, 3,49 %) con Italia (agosto, 3,986 %): diferencial implícito
   ≈ 50 pb, cuando Eurostat da ≈ 126 pb para octubre (IT 4,68 % − DE 3,416 %).
3. **Bulgaria fuera del euro.** Es miembro desde el 1-ene-2026, pero `bis.py` solo asignaba
   el tipo del BCE a 20 países y el BIS no publica serie propia para BG: Bulgaria se quedaba
   sin tipo oficial.
4. **Bonos que caducan solos.** La ventana de 180 días se medía contra la fecha del
   navegador, no contra la fecha del snapshot: con datos estáticos, España (julio) desaparece
   del mapa a finales de diciembre aunque nadie haya tocado nada.
5. **Indicadores prometidos y no publicados.** El PR #1 anunciaba 40 indicadores nuevos;
   los datos publicados seguían en 25.

## Objetivo

Que la pieza financiera del mapa (tipos oficiales, inflación, rentabilidades soberanas y
prima de riesgo de la zona euro) sea **correcta, comparable y verificable por cualquiera**
contra la fuente primaria.

## Requisitos

- R1. `snapshot.json` incluye `policy_rate` (BIS) e inflación mensual (FMI) y los
  indicadores del catálogo (incluida la deuda pública del FMI).
- R2. Los 21 miembros de la zona euro (con BGR) reciben el tipo del BCE que publica el BIS
  (desde el 18-sep-2024 es la facilidad de depósito, DFR).
- R3. Nueva métrica `euro_spread_bund`: diferencial a 10 años frente al Bund, en puntos
  básicos, **solo zona euro** (misma moneda) y **de una única fuente y un único mes**
  (Eurostat `irt_lt_mcby_m`, criterio de convergencia de Maastricht).
- R4. Nueva métrica `real_policy_rate`: tipo oficial menos inflación interanual más reciente
  (tipo real ex post). El periodo indica las dos fechas usadas.
- R5. La antigüedad de una curva de bonos se mide contra `generatedAt` del snapshot de bonos.
- R6. `python -m wem verify` (solo lectura) vuelve a descargar de la fuente primaria una
  muestra de lo que publica la app y escribe `docs/verificacion.md` con valor en la app,
  valor en la fuente, diferencia y veredicto.
- R7. Cada valor nuevo lleva fuente, licencia y periodo, como el resto del mapa.

## Fuera de alcance

- Primas de riesgo entre monedas distintas (no son comparables sin cubrir el tipo de cambio).
- Interpolar plazos o rellenar meses que faltan.
- Refrescar regiones, comercio, productos, webcams o noticias.

## Criterios de aceptación

- Tests offline del pipeline y de la app en verde; lint y build en verde; CSV en sync.
- En el mapa: el diferencial ITA–DEU de octubre de 2026 es de unos 126 pb, no 50.
- `docs/verificacion.md` existe, está fechado y cada fila cita su fuente primaria.
