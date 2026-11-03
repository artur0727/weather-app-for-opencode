import { printCityList, showWarning } from "../presentation/output.ts";
import type { Config } from "../types/Config.ts";

/** Opción 7: lista todas las ciudades guardadas y marca la default. */
export async function listCities(config: Config): Promise<Config> {
  if (config.cities.length === 0) {
    showWarning("No hay ciudades guardadas.");
    return config;
  }
  printCityList(config.cities, config.defaultCityId);
  return config;
}
