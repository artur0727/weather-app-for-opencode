import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { Config } from "../types/Config.ts";
import type { Unit } from "../types/Unit.ts";
import { CONFIG_DIR_NAME, CONFIG_FILE_NAME, DEFAULT_UNIT } from "../utils/constants.ts";
import { isCity } from "./citiesStorage.ts";

/**
 * Ruta absoluta de la configuración persistente.
 * Vive en el perfil del usuario para que el binario compilado también la encuentre.
 */
export const configPath = join(homedir(), CONFIG_DIR_NAME, CONFIG_FILE_NAME);

export const defaultConfig: Config = {
  defaultCityId: null,
  unit: DEFAULT_UNIT,
  cities: [],
};

function toUnit(value: unknown): Unit {
  return value === "fahrenheit" ? "fahrenheit" : "celsius";
}

/** Valida lo persistido y descarta entradas corruptas sin romper la app. */
function normalize(raw: unknown): Config {
  if (typeof raw !== "object" || raw === null) return defaultConfig;
  const data = raw as Partial<Config>;
  const cities = Array.isArray(data.cities) ? data.cities.filter(isCity) : [];
  const defaultCityId =
    typeof data.defaultCityId === "string" && cities.some((city) => city.id === data.defaultCityId)
      ? data.defaultCityId
      : null;
  return { defaultCityId, unit: toUnit(data.unit), cities };
}

/** Carga el config desde disco; si no existe o está corrupto, usa el default. */
export async function loadConfig(path: string = configPath): Promise<Config> {
  try {
    const raw = await Bun.file(path).json();
    return normalize(raw);
  } catch {
    return defaultConfig;
  }
}

/** Guarda el config creando la carpeta si hace falta. */
export async function saveConfig(config: Config, path: string = configPath): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, `${JSON.stringify(config, null, 2)}\n`);
}

/** Devuelve un config nuevo con la unidad de temperatura indicada. */
export function setUnitInConfig(config: Config, unit: Unit): Config {
  return { ...config, unit };
}
