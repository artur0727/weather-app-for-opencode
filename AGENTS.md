# AGENTS.md

Weather CLI exercise project: a Bun + TypeScript console app for looking up weather by city.

## Commands

- Install: `bun install`
- Run: `bun run index.ts` (single-file app; entry point is `index.ts`)
- Typecheck: `bun run typecheck` → runs `bun check`. TypeScript is strict (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`: use `import type` for type-only imports; imports keep `.ts` extensions).
- No test or lint setup exists.

## Project state

- `index.ts` is still the `bun init` hello-world; the actual CLI described in `README.md` is not implemented yet. `README.md` (Spanish) is the spec: menu with default city, multiple saved cities, delete/set-default, units setting, exit.
- Target workflow is two OpenMeteo calls (no API key needed): geocoding search by city name → forecast by returned lat/lon. Example URLs are in the README. Build the URL from the geocoding response; don't hardcode coordinates.
- README mentions the end goal is a compiled executable (`bun build --compile` output).

## Conventions

- README and the target UI (menu text) are in Spanish; user-facing strings should be Spanish to match.
- Uses Bun APIs (e.g. `Bun.file`) rather than Node-only APIs; types come from `@types/bun` (`"types": ["bun"]` in tsconfig).
