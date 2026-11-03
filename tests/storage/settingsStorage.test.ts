import { afterEach, describe, expect, it } from "bun:test";
import { join } from "node:path";
import {
  defaultConfig,
  loadConfig,
  saveConfig,
  setUnitInConfig,
} from "../../src/storage/settingsStorage.ts";
import type { Config } from "../../src/types/Config.ts";
import { cleanupTempDirs, createTempDir, makeCity, makeConfig } from "../helpers/fixtures.ts";

afterEach(async () => {
  await cleanupTempDirs();
});

function configFilePath(dir: string): string {
  return join(dir, "config.json");
}

describe("saveConfig", () => {
  it("crea las carpetas necesarias y escribe JSON con sangría y salto de línea final", async () => {
    const dir = await createTempDir();
    const path = join(dir, "nested", "deeper", "config.json");
    const config = makeConfig({ defaultCityId: "a", cities: [makeCity({ id: "a" })] });

    await saveConfig(config, path);

    const text = await Bun.file(path).text();
    expect(text.endsWith("\n")).toBe(true);
    expect(text).toContain('\n  "defaultCityId": "a"');
    expect(JSON.parse(text)).toEqual(config);
  });
});

describe("loadConfig", () => {
  it("hace roundtrip de lo guardado", async () => {
    const dir = await createTempDir();
    const path = configFilePath(dir);
    const config = makeConfig({
      defaultCityId: "a",
      unit: "fahrenheit",
      cities: [makeCity({ id: "a" })],
    });

    await saveConfig(config, path);

    expect(await loadConfig(path)).toEqual(config);
  });

  it("devuelve el config default cuando el archivo no existe", async () => {
    const dir = await createTempDir();

    expect(await loadConfig(configFilePath(dir))).toEqual(defaultConfig);
  });

  it("devuelve el config default cuando el JSON está corrupto", async () => {
    const dir = await createTempDir();
    const path = configFilePath(dir);
    await Bun.write(path, "{ esto no es json");

    expect(await loadConfig(path)).toEqual(defaultConfig);
  });

  it("devuelve el config default cuando la raíz no es un objeto", async () => {
    const dir = await createTempDir();
    const path = configFilePath(dir);
    await Bun.write(path, JSON.stringify("no soy un config"));

    expect(await loadConfig(path)).toEqual(defaultConfig);

    await Bun.write(path, "null");
    expect(await loadConfig(path)).toEqual(defaultConfig);
  });
});

describe("normalización al cargar", () => {
  async function loadRaw(raw: unknown): Promise<Config> {
    const dir = await createTempDir();
    const path = configFilePath(dir);
    await Bun.write(path, JSON.stringify(raw));
    return loadConfig(path);
  }

  it("convierte unidades desconocidas a celsius y conserva fahrenheit", async () => {
    expect((await loadRaw({ unit: "kelvin" })).unit).toBe("celsius");
    expect((await loadRaw({ unit: "celsius" })).unit).toBe("celsius");
    expect((await loadRaw({ unit: "fahrenheit" })).unit).toBe("fahrenheit");
    expect((await loadRaw({})).unit).toBe("celsius");
  });

  it("descarta ciudades con forma inválida", async () => {
    const valid = makeCity({ id: "buena" });
    const config = await loadRaw({ cities: [valid, { id: "sin-coords", name: "X" }, null, "texto"] });

    expect(config.cities).toEqual([valid]);
  });

  it("anula el default si apunta a una ciudad descartada", async () => {
    const valid = makeCity({ id: "buena" });

    expect((await loadRaw({ defaultCityId: "fantasma", cities: [valid] })).defaultCityId).toBeNull();
    expect((await loadRaw({ defaultCityId: "buena", cities: [valid] })).defaultCityId).toBe("buena");
  });

  it("ignora claves desconocidas", async () => {
    const valid = makeCity({ id: "buena" });
    const config = await loadRaw({ cities: [valid], defaultCityId: "buena", extra: true });

    expect(config).toEqual({ defaultCityId: "buena", unit: "celsius", cities: [valid] });
  });
});

describe("setUnitInConfig", () => {
  it("devuelve un config nuevo con la unidad pedida", () => {
    const base = makeConfig({ unit: "celsius" });
    const next = setUnitInConfig(base, "fahrenheit");

    expect(next.unit).toBe("fahrenheit");
    expect(base.unit).toBe("celsius");
    expect(next).not.toBe(base);
  });
});
