import type { Config } from "./types.ts";
import { cyan } from "./colors.ts";
import { unitLabel } from "./ui.ts";
import {
  agregarCiudad,
  ajustes,
  cambiarDefault,
  consultarDefault,
  consultarTodas,
  eliminarCiudad,
  pronostico7Dias,
} from "./actions.ts";

/** Acción de menú: recibe el config actual y devuelve el (posiblemente) actualizado. */
export type AccionMenu = (config: Config) => Promise<Config>;

/** Opción del menú tal como la espera `clack.select`. */
export interface OpcionMenu {
  value: string;
  label: string;
}

/** Genera las opciones del menú (etiquetas en cyan) reflejando el estado actual. */
export function OPCIONES_MENU(config: Config): OpcionMenu[] {
  return [
    { value: "1", label: cyan("1. Clima de ciudad default") },
    { value: "2", label: cyan(`2. Clima de todas las ciudades (${config.cities.length})`) },
    { value: "3", label: cyan("3. Buscar y agregar ciudad") },
    { value: "4", label: cyan("4. Eliminar ciudad") },
    { value: "5", label: cyan("5. Establecer ciudad default") },
    { value: "6", label: cyan("6. Pronóstico 7 días") },
    { value: "8", label: cyan(`8. Ajustes (${unitLabel(config.unit)})`) },
    { value: "9", label: cyan("9. Salir") },
  ];
}

/** Registro de opción → acción; la opción 9 (salir) no mapea a ninguna acción. */
export const ACCIONES_MENU: Record<string, AccionMenu> = {
  "1": consultarDefault,
  "2": consultarTodas,
  "3": agregarCiudad,
  "4": eliminarCiudad,
  "5": cambiarDefault,
  "6": pronostico7Dias,
  "8": ajustes,
};
