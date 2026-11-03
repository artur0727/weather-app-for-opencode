import { styleText } from "node:util";

/**
 * Paleta de la app sobre `node:util` `styleText` (la misma base que usa @clack/prompts).
 * En un TTY envuelve el texto con códigos ANSI; sin TTY (o con `NO_COLOR`) lo devuelve tal cual,
 * así que los formatters puros de `format.ts` son estables para tests.
 *
 * Convención: cyan = menú/banner, amarillo = temperaturas, verde = éxito,
 * rojo = error, dim = texto secundario.
 */
export function cyan(text: string): string {
  return styleText("cyan", text);
}

export function cyanBold(text: string): string {
  return styleText(["cyan", "bold"], text);
}

export function yellow(text: string): string {
  return styleText("yellow", text);
}

export function green(text: string): string {
  return styleText("green", text);
}

export function red(text: string): string {
  return styleText("red", text);
}

export function dim(text: string): string {
  return styleText("dim", text);
}
