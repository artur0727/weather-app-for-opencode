# AGENTS.md

Weather CLI app (Bun + TypeScript): interactive console app to look up current weather and a 7-day forecast for saved cities.

## Commands

- Install: `bun install`
- Run: `bun run src/index.ts` (interactive; needs a real TTY — `@clack/prompts` prompts hang or misrender when piped)
- Non-interactive flags: `bun run src/index.ts --help` / `--version` / `--config-path` (also `--version` on the compiled binary; unknown flags exit 1)
- Typecheck: `bun run typecheck` → runs `bun check`. TypeScript is strict (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`: use `import type` for type-only imports; imports keep `.ts` extensions).
- Build executable: `bun run build` → `weather-cli.exe` via `bun build --compile` from `src/index.ts` (version comes from `package.json`, imported at build time).
- No test setup yet; the intended second pass is `bun test` with `fetch` mocked, testing `storage`/`format`/`api` pure logic (safe: `src/index.ts` runs its TTY loop only under `import.meta.main`).

## Structure

- `src/index.ts` — bootstrap only: CLI flags, banner/header, clack menu loop, dispatch to actions, central error handling. Guarded by `import.meta.main` so importing it has no side effects.
- `src/actions/` — one module per menu option; all interactive prompts and side effects (config saves) live here:
  - `getWeather.ts` — options 1 (default city) and 2 (all cities, in parallel).
  - `addCity.ts`, `removeCity.ts`, `setDefaultCity.ts`, `listCities.ts` — city management (options 3-5 and 7).
  - `getForecast.ts` — 7-day forecast with city picker (option 6).
  - `settings.ts` — temperature unit (option 8).
- `src/presentation/` — console/CLI interaction:
  - `menu.ts` — `menuOptions(config)` (cyan labels), `menuActions` (option → action) and `selectMenuOption`.
  - `input.ts` — clack prompts and validation; `Cancelado` sentinel for aborted prompts.
  - `output.ts` — banner, header, weather/forecast blocks, city list and success/warning/info/error messages.
  - `loading.ts` — `withSpinner(message, task)`: clack spinner for async work; always stops and rethrows so callers report once.
- `src/storage/` — persistence and pure config mutations:
  - `settingsStorage.ts` — `~/.weather-cli/config.json` (`configPath`, deliberately kept — do not move without a migration), load/save and normalization.
  - `citiesStorage.ts` — city id derivation, lookups and `addCityToConfig`/`removeCityFromConfig`/`setDefaultCityInConfig`.
- `src/api/` — OpenMeteo layer (no API key):
  - `client.ts` — `fetchJson` with `AbortSignal.timeout(10s)` and `ApiError` (user-ready Spanish messages).
  - `geocoding.ts` — `searchCity`.
  - `weather.ts` — current weather and `getDailyForecast` (7 days: max/min temp, weather code, precipitation probability); shared `forecastUrl`, unit follows config.
- `src/types/` — `Unit`, `City`/`CityInput`, `Config`, `WeatherInfo`/`ForecastDay`, `GeoResult`, `MenuOption`/`MenuAction`.
- `src/utils/`:
  - `colors.ts` — palette over `node:util` `styleText` (auto-off without TTY / with `NO_COLOR`): cyan = menu/banner, yellow = temperatures, green = success, red = error, dim = secondary. Never write raw ANSI.
  - `constants.ts` — endpoints, timeout, limits, forecast days, config location, menu exit, default unit and WMO code map.
  - `format.ts` — pure formatters (no clack): labels, dates, temperatures, `formatWeather`, `formatForecast`.

## Conventions

- All user-facing strings are Spanish (README/menu), matching the existing UI. File names, functions and types are English.
- Menu numbering is `1-9`: option 6 is the 7-day forecast with a city picker (default preselected), option 7 lists saved cities, option 8 settings, option 9 exit. Don't renumber.
- Prefer Bun APIs (`Bun.file`, `Bun.write`) over Node equivalents; types come from `@types/bun`.
- Config mutations are pure functions in `storage/citiesStorage.ts` / `storage/settingsStorage.ts` that return a new `Config`; callers persist with `saveConfig`.
- Async network calls go through `withSpinner`; success messages wrap text in `green(...)`.
