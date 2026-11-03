import type { City, CityInput } from "../types/City.ts";
import type { Config } from "../types/Config.ts";

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Identificador estable de una ciudad (evita duplicados). */
export function cityIdFor(city: CityInput): string {
  const parts = [city.name, city.country, city.admin1]
    .filter((part): part is string => Boolean(part))
    .map(slug)
    .filter(Boolean);
  parts.push(`${city.latitude.toFixed(3)},${city.longitude.toFixed(3)}`);
  return parts.join("-");
}

/** Valida que un valor persistido tenga la forma mínima de una ciudad. */
export function isCity(value: unknown): value is City {
  if (typeof value !== "object" || value === null) return false;
  const city = value as Partial<City>;
  return (
    typeof city.id === "string" &&
    typeof city.name === "string" &&
    typeof city.latitude === "number" &&
    typeof city.longitude === "number"
  );
}

export function getCity(config: Config, id: string): City | undefined {
  return config.cities.find((city) => city.id === id);
}

export function getDefaultCity(config: Config): City | undefined {
  return config.defaultCityId ? getCity(config, config.defaultCityId) : undefined;
}

/** Agrega (o actualiza) una ciudad; la primera agregada pasa a ser default. */
export function addCityToConfig(config: Config, city: CityInput): Config {
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
export function removeCityFromConfig(config: Config, id: string): Config {
  const cities = config.cities.filter((city) => city.id !== id);
  return {
    ...config,
    cities,
    defaultCityId: config.defaultCityId === id ? (cities[0]?.id ?? null) : config.defaultCityId,
  };
}

/** Establece la ciudad default por id. */
export function setDefaultCityInConfig(config: Config, id: string): Config {
  return { ...config, defaultCityId: id };
}
