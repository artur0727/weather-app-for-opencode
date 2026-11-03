import { searchCity } from "../api/geocoding.ts";
import { pickSearchResult, promptCityName } from "../presentation/input.ts";
import { withSpinner } from "../presentation/loading.ts";
import { showInfo, showSuccess, showWarning } from "../presentation/output.ts";
import { addCityToConfig, cityIdFor, getCity } from "../storage/citiesStorage.ts";
import { saveConfig } from "../storage/settingsStorage.ts";
import type { CityInput } from "../types/City.ts";
import type { Config } from "../types/Config.ts";
import { cityLabel } from "../utils/format.ts";

/** Opción 3: busca por nombre y agrega la ciudad seleccionada a la configuración. */
export async function addCity(config: Config): Promise<Config> {
  const query = await promptCityName();
  const results = await withSpinner(`Buscando "${query}"…`, () => searchCity(query));

  if (results.length === 0) {
    showWarning(`No se encontró ninguna ciudad con "${query}".`);
    return config;
  }

  const chosen = await pickSearchResult(results);
  const city: CityInput = {
    name: chosen.name,
    country: chosen.country,
    admin1: chosen.admin1,
    latitude: chosen.latitude,
    longitude: chosen.longitude,
  };
  const alreadySaved = getCity(config, cityIdFor(city)) !== undefined;
  const next = addCityToConfig(config, city);
  await saveConfig(next);

  if (alreadySaved) {
    showWarning(`${cityLabel(city)} ya estaba guardada (se actualizaron sus datos).`);
  } else {
    showSuccess(`${cityLabel(city)} agregada.`);
    if (!config.defaultCityId) showInfo("Establecida como ciudad default.");
  }
  return next;
}
