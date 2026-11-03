import { pickCity } from "../presentation/input.ts";
import { showSuccess, showWarning } from "../presentation/output.ts";
import { getCity, setDefaultCityInConfig } from "../storage/citiesStorage.ts";
import { saveConfig } from "../storage/settingsStorage.ts";
import type { Config } from "../types/Config.ts";
import { cityLabel } from "../utils/format.ts";

/** Opción 5: elegir la ciudad default. */
export async function setDefaultCity(config: Config): Promise<Config> {
  if (config.cities.length === 0) {
    showWarning("No hay ciudades guardadas.");
    return config;
  }
  const id = await pickCity("Ciudad default", config.cities);
  const next = setDefaultCityInConfig(config, id);
  await saveConfig(next);
  const city = getCity(next, id);
  if (city) showSuccess(`Ciudad default: ${cityLabel(city)}`);
  return next;
}
