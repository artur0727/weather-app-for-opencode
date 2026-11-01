# AGENTS.md

Weather CLI app (Bun + TypeScript): console app to look up current weather for saved cities.

## Commands

- Install: `bun install`
- Run: `bun run index.ts` (interactive; needs a real TTY — `@clack/prompts` prompts hang or misrender when piped)
- Typecheck: `bun run typecheck` → runs `bun check`. TypeScript is strict (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`: use `import type` for type-only imports; imports keep `.ts` extensions).
- Build executable: `bun run build` → `weather-cli.exe` via `bun build --compile`.
- No test setup yet; the intended second pass is `bun test` with `fetch` mocked, testing `store`/`ui`/`api` pure logic (don't import `index.ts`, it starts the TTY loop on import).

## Structure

- `index.ts` — main loop: banner, clack menu, option dispatch. All interactive prompts live here.
- `src/api.ts` — OpenMeteo layer (no API key): geocoding search → forecast by lat/lon. `ApiError` carries user-ready Spanish messages. Params built with `URLSearchParams`, `AbortSignal.timeout(10s)`, `temperature_unit` follows the configured unit.
- `src/store.ts` — persistence at `~/.weather-cli/config.json` (`configPath`). Load tolerates missing/corrupt files; writes via `Bun.write`. City `id` is derived from name+country+admin1+coords (dedupes cities); first added city auto-becomes default; removing the default reassigns the first remaining one.
- `src/ui.ts` — banner (verbatim from README), WMO weather-code map in Spanish, `cityLabel`/`formatWeather` formatters, `Cancelado` sentinel for aborted prompts.
- `src/types.ts` — `City`, `Config`, `Unit` (`celsius` | `fahrenheit`), `WeatherInfo`, `GeoResult`.

## Conventions

- All user-facing strings are Spanish (README/menu), matching the existing UI.
- Menu numbering is deliberately `1-5, 8, 9` — the README mockup is the spec; don't renumber.
- Prefer Bun APIs (`Bun.file`, `Bun.write`) over Node equivalents; types come from `@types/bun`.
- Config mutations are pure functions in `store.ts` that return a new `Config`; callers persist with `saveConfig`.

