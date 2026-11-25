# SPEC — Verificación visible y automática; Economía por temas

## Problemas
1. "Cómo verificamos los datos" lleva a un archivo de GitHub: quien usa la web no ve una
   explicación, ve un repositorio.
2. La verificación contra fuente primaria solo existe en `docs/verificacion.md`; en la app
   no hay rastro de ella.
3. Refrescar y verificar los datos es manual: si nadie lo ejecuta, los datos envejecen.
4. "Mapa mundial" y "Economía y sociedad" muestran casi lo mismo.

## Requisitos
- R1. Página **Cómo verificamos los datos** dentro de la app (`#v=verificacion`): qué se
  comprueba, contra qué fuente, con qué tolerancia, y las tablas de la última verificación.
- R2. `wem verify` escribe además `app/src/data/verification.json` con las mismas filas.
- R3. Sello en Riesgo soberano: fecha de la última verificación, fuentes y nº de filas a
  revisar; enlaza a la página.
- R4. Tarea semanal de GitHub Actions (y manual): refresca tipos, inflación, prima,
  bonos y noticias, exporta CSV, verifica y abre un PR con el resultado.
- R5. Economía y sociedad se organiza por **temas** (crecimiento, empleo, desigualdad,
  salud, gobernanza, clima) y abre en **Evolución**; Mapa mundial sigue siendo el
  explorador con todos los indicadores.

## Aceptación
Tests (pipeline y app), lint y build en verde; la página y el sello visibles en el
navegador; el workflow es YAML válido y su paso de verificación se ha probado en local.
