import { getCurrentWeather } from "../api/weather.ts";
import { withSpinner } from "../presentation/loading.ts";
import { printWeather, printWeatherFailure, showWarning } from "../presentation/output.ts";
import { getDefaultCity } from "../storage/citiesStorage.ts";
import type { Config } from "../types/Config.ts";

/** Opción 1: clima actual de la ciudad default. */
export async function getDefaultWeather(config: Config): Promise<Config> {
  const city = getDefaultCity(config);
  if (!city) {
    showWarning("No hay ciudad default. Busca y agrega una ciudad primero (opción 3).");
    return config;
  }
  const weather = await withSpinner(`Consultando el clima de ${city.name}…`, () =>
    getCurrentWeather(city, config.unit),
  );
  printWeather(city, weather, config.unit);
  return config;
}

/** Opción 2: clima actual de todas las ciudades guardadas, en paralelo. */
export async function getAllWeather(config: Config): Promise<Config> {
  if (config.cities.length === 0) {
    showWarning("No hay ciudades guardadas.");
    return config;
  }
  const results = await withSpinner(`Consultando ${config.cities.length} ciudades…`, () =>
    Promise.allSettled(config.cities.map((city) => getCurrentWeather(city, config.unit))),
  );
  for (const [i, city] of config.cities.entries()) {
    const result = results[i];
    if (!result) continue;
    if (result.status === "fulfilled") {
      printWeather(city, result.value, config.unit);
    } else {
      printWeatherFailure(city);
    }
  }
  return config;
}
