import { pickCity } from "../presentation/input.ts";
import { showSuccess, showWarning } from "../presentation/output.ts";
import { getCity, removeCityFromConfig } from "../storage/citiesStorage.ts";
import { saveConfig } from "../storage/settingsStorage.ts";
import type { Config } from "../types/Config.ts";
import { cityLabel } from "../utils/format.ts";

/** Opción 4: elegir y eliminar una ciudad guardada. */
export async function removeCity(config: Config): Promise<Config> {
  if (config.cities.length === 0) {
    showWarning("No hay ciudades guardadas.");
    return config;
  }
  const id = await pickCity("Ciudad a eliminar", config.cities);
  const removed = getCity(config, id);
  const next = removeCityFromConfig(config, id);
  await saveConfig(next);
  if (removed) showSuccess(`Ciudad eliminada: ${cityLabel(removed)}`);
  return next;
}
