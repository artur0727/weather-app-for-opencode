# Revisión Weather CLI

- [x] **Colores:** definidos en `src/colors.ts` (`node:util` `styleText`): cyan (menú/banner), amarillo (temp), verde/rojo (ok/error), dim (secundario); auto-off sin TTY / con `NO_COLOR`.
- [x] **AGENTS.md:** actualizado al estado real (app funcional, nuevos módulos, paleta, flags, ruta de config).
- [ ] **Tests:** no existen; conviene al menos probar storage y las APIs con mocks.
- [x] **Binario:** verifica ruta con `weather-cli --config-path` (y `--help`/`--version`); se mantiene la ruta `~/.weather-cli/config.json` (decisión: no migrar).
- [x] **Escalabilidad:** `index.ts` reducido a bootstrap; menú como datos en `src/menu.ts`, una acción por opción en `src/actions.ts`, `import.meta.main` guard en `index.ts`.
- [x] **Carga:** `src/loading.ts` `withSpinner()` para búsquedas, clima default, todas las ciudades (en paralelo) y pronóstico.
- [x] **7 day forecast:** opción 6 "Pronóstico 7 días" (elige ciudad, default preseleccionada); `getDailyForecast` en `api.ts` + `formatForecast` en `ui.ts`.
