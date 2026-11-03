import pkg from "../package.json";
import { ApiError } from "./api/client.ts";
import { Cancelado } from "./presentation/input.ts";
import { menuActions, selectMenuOption } from "./presentation/menu.ts";
import { printBanner, printHeader, showError, showGoodbye } from "./presentation/output.ts";
import { getDefaultCity } from "./storage/citiesStorage.ts";
import { configPath, loadConfig } from "./storage/settingsStorage.ts";
import type { Config } from "./types/Config.ts";

const VERSION = pkg.version;

/** Ejecuta flags no interactivos (`--help`, `--version`, `--config-path`). */
function handleFlags(argv: readonly string[]): boolean {
  const [flag] = argv;
  if (!flag) return false;
  switch (flag) {
    case "--help":
    case "-h":
      printUsage();
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
      printUsage();
      process.exit(1);
  }
}

function printUsage(): void {
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
async function runAction(option: string, config: Config): Promise<Config> {
  const action = menuActions[option];
  if (!action) return config;
  return action(config);
}

async function main(): Promise<void> {
  if (handleFlags(process.argv.slice(2))) return;

  let config = await loadConfig();
  printBanner();
  printHeader(getDefaultCity(config), config.unit);

  while (true) {
    const option = await selectMenuOption(config);
    if (option === null) {
      showGoodbye();
      break;
    }

    try {
      config = await runAction(option, config);
    } catch (error) {
      if (error instanceof Cancelado) continue; // Volver al menú en silencio.
      if (error instanceof ApiError) {
        showError(error.message);
      } else {
        showError("Ocurrió un error inesperado.");
        console.error(error);
      }
    }
  }
}

// Guarda para poder importar este módulo (p. ej. tests) sin arrancar el bucle TTY.
if (import.meta.main) main();
