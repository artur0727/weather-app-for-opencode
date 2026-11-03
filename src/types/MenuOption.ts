import type { Config } from "./Config.ts";

/** Opción del menú tal como la espera `clack.select`. */
export interface MenuOption {
  value: string;
  label: string;
}

/** Acción de menú: recibe el config actual y devuelve el (posiblemente) actualizado. */
export type MenuAction = (config: Config) => Promise<Config>;
