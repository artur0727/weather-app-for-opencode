import { getDailyForecast } from "../api/weather.ts";
import { pickCity } from "../presentation/input.ts";
import { withSpinner } from "../presentation/loading.ts";
import { printForecast, showWarning } from "../presentation/output.ts";
import { getCity } from "../storage/citiesStorage.ts";
import type { Config } from "../types/Config.ts";

/** Opción 6: pronóstico de 7 días de la ciudad elegida (default preseleccionada). */
export async function getForecast(config: Config): Promise<Config> {
  if (config.cities.length === 0) {
    showWarning("No hay ciudades guardadas.");
    return config;
  }
  let id = config.defaultCityId;
  if (config.cities.length > 1) {
    id = await pickCity("Ciudad para el pronóstico", config.cities, id ?? undefined);
  }
  const city = id ? getCity(config, id) : config.cities[0];
  if (!city) {
    showWarning("No hay ciudad default. Establece una primero (opción 5).");
    return config;
  }
  const days = await withSpinner(`Consultando el pronóstico de ${city.name}…`, () =>
    getDailyForecast(city, config.unit),
  );
  printForecast(city, days, config.unit);
  return config;
}
