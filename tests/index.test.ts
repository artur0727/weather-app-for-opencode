import { describe, expect, it } from "bun:test";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const ENTRY = join(ROOT, "src", "index.ts");
const pkg = (await Bun.file(join(ROOT, "package.json")).json()) as { version: string };

interface CliResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

/** Ejecuta el CLI en un proceso aparte (los flags no interactivos no necesitan TTY). */
function runCli(...args: string[]): CliResult {
  const result = Bun.spawnSync([process.execPath, ENTRY, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  return {
    exitCode: result.exitCode,
    stdout: result.stdout.toString().trim(),
    stderr: result.stderr.toString().trim(),
  };
}

describe("bootstrap", () => {
  it("se puede importar sin arrancar el menú interactivo", async () => {
    const module = await import("../src/index.ts");

    expect(Object.keys(module)).toEqual([]);
  });
});

describe("flags no interactivos", () => {
  it("--version muestra la versión del package.json", () => {
    const { exitCode, stdout } = runCli("--version");

    expect(exitCode).toBe(0);
    expect(stdout).toBe(`WEATHER CLI ${pkg.version}`);
  });

  it("-v es un alias de --version", () => {
    expect(runCli("-v").stdout).toBe(`WEATHER CLI ${pkg.version}`);
  });

  it("--help muestra el uso y la ruta de configuración", () => {
    const { exitCode, stdout } = runCli("--help");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Uso:");
    expect(stdout).toContain("weather-cli --config-path");
    expect(stdout).toContain("Configuración:");
    expect(stdout).toContain(join(".weather-cli", "config.json"));
  });

  it("-h es un alias de --help", () => {
    expect(runCli("-h").stdout).toContain("Uso:");
  });

  it("--config-path muestra la ruta absoluta del config", () => {
    const { exitCode, stdout } = runCli("--config-path");

    expect(exitCode).toBe(0);
    expect(stdout.endsWith(join(".weather-cli", "config.json"))).toBe(true);
  });

  it("rechaza flags desconocidos con código 1", () => {
    const { exitCode, stdout, stderr } = runCli("--nope");

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Flag desconocido: --nope");
    expect(stdout).toContain("Uso:");
  });
});
