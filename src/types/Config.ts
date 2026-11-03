import type { City } from "./City.ts";
import type { Unit } from "./Unit.ts";

/** Estado persistente en ~/.weather-cli/config.json. */
export interface Config {
  /** id de la ciudad default, o null si aún no hay ninguna. */
  defaultCityId: string | null;
  unit: Unit;
  cities: City[];
}
