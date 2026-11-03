import { rm } from "node:fs/promises";
import { configPath } from "../../src/storage/settingsStorage.ts";
import type { Config } from "../../src/types/Config.ts";

/** Borra la config persistida por las acciones (vive en el home temporal de los tests). */
export async function clearSavedConfig(): Promise<void> {
  await rm(configPath, { force: true });
}

/** Lee la config que las acciones guardaron en disco, o null si no escribieron nada. */
export async function readSavedConfig(): Promise<Config | null> {
  try {
    return (await Bun.file(configPath).json()) as Config;
  } catch {
    return null;
  }
}

/**
 * Reemplaza `console.log` por un buffer para inspeccionar la salida de `output.ts`.
 * Devolver `restore` permite dejarlo como estaba en `afterEach`.
 */
export function captureConsole(): { logs: string[]; restore: () => void } {
  const originalLog = console.log;
  const logs: string[] = [];
  console.log = (...args: unknown[]) => {
    logs.push(args.map((arg) => String(arg)).join(" "));
  };
  return { logs, restore: () => (console.log = originalLog) };
}
