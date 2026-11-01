import * as clack from "@clack/prompts";
import pkg from "./package.json";
import { ApiError } from "./src/api.ts";
import { ACCIONES_MENU, OPCIONES_MENU } from "./src/menu.ts";
import { configPath, getDefaultCity, loadConfig } from "./src/store.ts";
import { Cancelado, cityLabel, printBanner, unitLabel } from "./src/ui.ts";
import type { Config } from "./src/types.ts";

const VERSION = pkg.version;

/** Ejecuta flags no interactivos (`--help`, `--version`, `--config-path`). */
function manejarFlags(argv: readonly string[]): boolean {
  const [flag] = argv;
  if (!flag) return false;
  switch (flag) {
    case "--help":
    case "-h":
      mostrarUso();
      return true;
    case "--version":
    case "-v":
      console.log(`WEATHER CLI ${VERSION}`);
      return true;
    case "--config-path":
      console.log(configPath);
      return true;
    default:
      console.error(`Flag desconocido: ${flag}\n`);
      mostrarUso();
      process.exit(1);
  }
}

function mostrarUso(): void {
  console.log(
    `WEATHER CLI ${VERSION}

Uso:
  weather-cli                Inicia el menú interactivo
  weather-cli --help         Muestra esta ayuda
  weather-cli --version      Muestra la versión
  weather-cli --config-path  Muestra la ruta del archivo de configuración

Configuración: ${configPath}`,
  );
}

/** Ejecuta la opción elegida; la opción 9 (salir) no mapea a ninguna acción. */
async function manejarOpcion(opcion: string, config: Config): Promise<Config> {
  const accion = ACCIONES_MENU[opcion];
  if (!accion) return config;
  return accion(config);
}

async function main(): Promise<void> {
  if (manejarFlags(process.argv.slice(2))) return;

  let config = await loadConfig();
  printBanner();

  const def = getDefaultCity(config);
  console.log(
    `  ${def ? `Default: ${cityLabel(def)}` : "Sin ciudad default"} · Unidad: ${unitLabel(config.unit)}\n`,
  );

  let salir = false;
  while (!salir) {
    const opcion = await clack.select<string>({
      message: "Selecciona una opción",
      options: OPCIONES_MENU(config),
    });
    if (clack.isCancel(opcion) || opcion === "9") {
      clack.outro("¡Hasta luego!");
      break;
    }

    try {
      config = await manejarOpcion(opcion, config);
    } catch (error) {
      if (error instanceof Cancelado) continue; // Volver al menú en silencio.
      if (error instanceof ApiError) {
        clack.log.error(error.message);
      } else {
        clack.log.error("Ocurrió un error inesperado.");
        console.error(error);
      }
    }
  }
}

// Guarda para poder importar este módulo (p. ej. tests) sin arrancar el bucle TTY.
if (import.meta.main) main();
