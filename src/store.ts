import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { City, Config, Unit } from "./types.ts";

/**
 * Ruta absoluta de la configuración persistente. Conversada en el plan:
 * guarda en el perfil del usuario para que el binario compilado también la encuentre.
 */
export const configPath = join(homedir(), ".weather-cli", "config.json");

export const defaultConfig: Config = {
  defaultCityId: null,
  unit: "celsius",
  cities: [],
};

function toUnit(value: unknown): Unit {
  return value === "fahrenheit" ? "fahrenheit" : "celsius";
}

/** Valida lo persistido y descarta entradas corruptas sin romper la app. */
function normalize(raw: unknown): Config {
  if (typeof raw !== "object" || raw === null) return defaultConfig;
  const data = raw as Partial<Config>;
  const cities = Array.isArray(data.cities)
    ? data.cities.filter(
        (city): city is City =>
          typeof city === "object" &&
          city !== null &&
          typeof city.id === "string" &&
          typeof city.name === "string" &&
          typeof city.latitude === "number" &&
          typeof city.longitude === "number",
      )
    : [];
  const defaultCityId =
    typeof data.defaultCityId === "string" && cities.some((city) => city.id === data.defaultCityId)
      ? data.defaultCityId
      : null;
  return { defaultCityId, unit: toUnit(data.unit), cities };
}

/** Carga el config desde disco; si no existe o está corrupto, usa el default. */
export async function loadConfig(): Promise<Config> {
  try {
    const raw = await Bun.file(configPath).json();
    return normalize(raw);
  } catch {
    return defaultConfig;
  }
}

/** Guarda el config creando la carpeta si hace falta. */
export async function saveConfig(config: Config): Promise<void> {
  await mkdir(dirname(configPath), { recursive: true });
  await Bun.write(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Identificador estable de una ciudad (evita duplicados). */
export function cityIdFor(city: Omit<City, "id">): string {
  const parts = [city.name, city.country, city.admin1]
    .filter((part): part is string => Boolean(part))
    .map(slug)
    .filter(Boolean);
  parts.push(`${city.latitude.toFixed(3)},${city.longitude.toFixed(3)}`);
  return parts.join("-");
}

export function getCity(config: Config, id: string): City | undefined {
  return config.cities.find((city) => city.id === id);
}

export function getDefaultCity(config: Config): City | undefined {
  return config.defaultCityId ? getCity(config, config.defaultCityId) : undefined;
}

/** Agrega (o actualiza) una ciudad; la primera agregada pasa a ser default. */
export function addCity(config: Config, city: Omit<City, "id">): Config {
  const full: City = { ...city, id: cityIdFor(city) };
  const exists = config.cities.some((c) => c.id === full.id);
  const cities = exists
    ? config.cities.map((c) => (c.id === full.id ? full : c))
    : [...config.cities, full];
  return {
    ...config,
    cities,
    defaultCityId: config.defaultCityId ?? full.id,
  };
}

/** Elimina una ciudad por id; reasigna el default si era necesario. */
export function removeCity(config: Config, id: string): Config {
  const cities = config.cities.filter((city) => city.id !== id);
  return {
    ...config,
    cities,
    defaultCityId: config.defaultCityId === id ? (cities[0]?.id ?? null) : config.defaultCityId,
  };
}

export function setDefaultCity(config: Config, id: string): Config {
  return { ...config, defaultCityId: id };
}
