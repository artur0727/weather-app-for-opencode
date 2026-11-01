# AGENTS.md

Weather CLI app (Bun + TypeScript): interactive console app to look up current weather and a 7-day forecast for saved cities.

## Commands

- Install: `bun install`
- Run: `bun run index.ts` (interactive; needs a real TTY — `@clack/prompts` prompts hang or misrender when piped)
- Non-interactive flags: `bun run index.ts --help` / `--version` / `--config-path` (also `--version` on the compiled binary; unknown flags exit 1)
- Typecheck: `bun run typecheck` → runs `bun check`. TypeScript is strict (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`: use `import type` for type-only imports; imports keep `.ts` extensions).
- Build executable: `bun run build` → `weather-cli.exe` via `bun build --compile` (version comes from `package.json`, imported at build time).
- No test setup yet; the intended second pass is `bun test` with `fetch` mocked, testing `store`/`ui`/`api` pure logic (safe: `index.ts` runs its TTY loop only under `import.meta.main`).

## Structure

- `index.ts` — bootstrap only: CLI flags, banner, clack menu, dispatch to actions, central error handling. Guarded by `import.meta.main` so importing it has no side effects.
- `src/menu.ts` — menu as data: `OPCIONES_MENU(config)` (cyan labels) and `ACCIONES_MENU` (option → action). Adding a feature = add an action here + an option line.
- `src/actions.ts` — one async function per menu option; all interactive prompts and side effects (config saves) live here.
- `src/loading.ts` — `withSpinner(message, task)`: clack spinner for async work; always stops the spinner and rethrows the error so callers report it once.
- `src/api.ts` — OpenMeteo layer (no API key): geocoding search, current forecast and `getDailyForecast` (7 days: max/min temp, weather code, precipitation probability). `ApiError` carries user-ready Spanish messages. Params built with `URLSearchParams`, `AbortSignal.timeout(10s)`, `temperature_unit` follows the configured unit; shared `forecastUrl()` builder.
- `src/store.ts` — persistence at `~/.weather-cli/config.json` (`configPath`, kept deliberately — do not move without a migration). Load tolerates missing/corrupt files; writes via `Bun.write`. City `id` is derived from name+country+admin1+coords (dedupes cities); first added city auto-becomes default; removing the default reassigns the first remaining one.
- `src/ui.ts` — pure formatters (no clack dependency): banner (verbatim from README, cyan), WMO weather-code map in Spanish, `cityLabel`/`formatWeather`/`formatForecast` (temps in yellow), `Cancelado` sentinel for aborted prompts.
- `src/colors.ts` — palette over `node:util` `styleText` (auto-off without TTY / with `NO_COLOR`): cyan = menu/banner, yellow = temperatures, green = success, red = error, dim = secondary. Never write raw ANSI.
- `src/types.ts` — `City`, `Config`, `Unit` (`celsius` | `fahrenheit`), `WeatherInfo`, `ForecastDay`, `GeoResult`.

## Conventions

- All user-facing strings are Spanish (README/menu), matching the existing UI.
- Menu numbering is deliberately `1-6, 8, 9` — the README mockup is the spec; don't renumber. Option 6 is the 7-day forecast with a city picker (default preselected).
- Prefer Bun APIs (`Bun.file`, `Bun.write`) over Node equivalents; types come from `@types/bun`.
- Config mutations are pure functions in `store.ts` that return a new `Config`; callers persist with `saveConfig`.
- Async network calls go through `withSpinner`; success messages wrap text in `green(...)`.
