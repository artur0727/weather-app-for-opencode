import * as clack from "@clack/prompts";
import { addCity } from "../actions/addCity.ts";
import { getForecast } from "../actions/getForecast.ts";
import { getAllWeather, getDefaultWeather } from "../actions/getWeather.ts";
import { listCities } from "../actions/listCities.ts";
import { removeCity } from "../actions/removeCity.ts";
import { setDefaultCity } from "../actions/setDefaultCity.ts";
import { settings } from "../actions/settings.ts";
import type { Config } from "../types/Config.ts";
import type { MenuAction, MenuOption } from "../types/MenuOption.ts";
import { cyan } from "../utils/colors.ts";
import { MENU_EXIT_VALUE } from "../utils/constants.ts";
import { unitLabel } from "../utils/format.ts";

/** Genera las opciones del menú (etiquetas en cyan) reflejando el estado actual. */
export function menuOptions(config: Config): MenuOption[] {
  return [
    { value: "1", label: cyan("1. Clima de ciudad default") },
    { value: "2", label: cyan(`2. Clima de todas las ciudades (${config.cities.length})`) },
    { value: "3", label: cyan("3. Buscar y agregar ciudad") },
    { value: "4", label: cyan("4. Eliminar ciudad") },
    { value: "5", label: cyan("5. Establecer ciudad default") },
    { value: "6", label: cyan("6. Pronóstico 7 días") },
    { value: "7", label: cyan("7. Listar ciudades guardadas") },
    { value: "8", label: cyan(`8. Ajustes (${unitLabel(config.unit)})`) },
    { value: "9", label: cyan("9. Salir") },
  ];
}

/** Registro de opción → acción; la opción 9 (salir) no mapea a ninguna acción. */
export const menuActions: Readonly<Record<string, MenuAction>> = {
  "1": getDefaultWeather,
  "2": getAllWeather,
  "3": addCity,
  "4": removeCity,
  "5": setDefaultCity,
  "6": getForecast,
  "7": listCities,
  "8": settings,
};

/** Pide una opción del menú; devuelve null cuando el usuario cancela o elige salir. */
export async function selectMenuOption(config: Config): Promise<string | null> {
  const option = await clack.select<string>({
    message: "Selecciona una opción",
    options: menuOptions(config),
  });
  if (clack.isCancel(option) || option === MENU_EXIT_VALUE) return null;
  return option;
}
