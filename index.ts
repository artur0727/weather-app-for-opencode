import * as clack from "@clack/prompts";
import { ApiError, getCurrentWeather, searchCity } from "./src/api.ts";
import {
  addCity,
  cityIdFor,
  getCity,
  getDefaultCity,
  loadConfig,
  removeCity,
  saveConfig,
  setDefaultCity,
} from "./src/store.ts";
import { Cancelado, cityLabel, formatWeather, printBanner, unitLabel } from "./src/ui.ts";
import type { Config, Unit } from "./src/types.ts";

/** Busca por nombre y agrega la ciudad seleccionada a la configuración. */
async function buscarYAgregarCiudad(config: Config): Promise<Config> {
  const consulta = await clack.text({
    message: "Nombre de la ciudad",
    placeholder: "Ottawa",
    validate: (value) =>
      !value || value.trim().length === 0 ? "Escribe el nombre de una ciudad." : undefined,
  });
  if (clack.isCancel(consulta)) throw new Cancelado();

  const spinner = clack.spinner();
  spinner.start("Buscando ciudades…");
  let resultados;
  try {
    resultados = await searchCity(consulta.trim());
  } finally {
    spinner.stop();
  }

  if (resultados.length === 0) {
    clack.log.warn(`No se encontró ninguna ciudad con "${consulta.trim()}".`);
    return config;
  }

  let elegida = resultados[0]!;
  if (resultados.length > 1) {
    const indice = await clack.select({
      message: `${resultados.length} resultados (elige uno)`,
      options: resultados.map((r, i) => ({ value: String(i), label: cityLabel(r) })),
    });
    if (clack.isCancel(indice)) throw new Cancelado();
    elegida = resultados[Number(indice)]!;
  }

  const nueva = {
    name: elegida.name,
    country: elegida.country,
    admin1: elegida.admin1,
    latitude: elegida.latitude,
    longitude: elegida.longitude,
  };
  const yaEstaba = getCity(config, cityIdFor(nueva));
  const siguiente = addCity(config, nueva);
  await saveConfig(siguiente);

  if (yaEstaba) {
    clack.log.warn(`${cityLabel(nueva)} ya estaba guardada (se actualizaron sus datos).`);
  } else {
    clack.log.success(`${cityLabel(nueva)} agregada.`);
    if (!config.defaultCityId) clack.log.info("Establecida como ciudad default.");
  }
  return siguiente;
}

/** Ejecuta la opción elegida y devuelve la configuración (posiblemente actualizada). */
async function manejarOpcion(opcion: string, config: Config): Promise<Config> {
  switch (opcion) {
    case "1": {
      const def = getDefaultCity(config);
      if (!def) {
        clack.log.warn("No hay ciudad default. Busca y agrega una ciudad primero (opción 3).");
        return config;
      }
      const spinner = clack.spinner();
      spinner.start(`Consultando el clima de ${def.name}…`);
      try {
        const clima = await getCurrentWeather(def, config.unit);
        spinner.stop();
        console.log(formatWeather(def, clima, config.unit));
        console.log();
      } catch (error) {
        spinner.stop();
        throw error;
      }
      return config;
    }

    case "2": {
      if (config.cities.length === 0) {
        clack.log.warn("No hay ciudades guardadas.");
        return config;
      }
      const resultados = await Promise.allSettled(
        config.cities.map((city) => getCurrentWeather(city, config.unit)),
      );
      for (const [i, city] of config.cities.entries()) {
        const resultado = resultados[i]!;
        if (resultado.status === "fulfilled") {
          console.log(formatWeather(city, resultado.value, config.unit));
        } else {
          console.log(`${cityLabel(city)} → No se pudo consultar el clima.`);
        }
        console.log();
      }
      return config;
    }

    case "3":
      return buscarYAgregarCiudad(config);

    case "4": {
      if (config.cities.length === 0) {
        clack.log.warn("No hay ciudades guardadas.");
        return config;
      }
      const id = await clack.select({
        message: "Ciudad a eliminar",
        options: config.cities.map((city) => ({ value: city.id, label: cityLabel(city) })),
      });
      if (clack.isCancel(id)) throw new Cancelado();
      const eliminada = getCity(config, id);
      const siguiente = removeCity(config, id);
      await saveConfig(siguiente);
      if (eliminada) clack.log.success(`Ciudad eliminada: ${cityLabel(eliminada)}`);
      return siguiente;
    }

    case "5": {
      if (config.cities.length === 0) {
        clack.log.warn("No hay ciudades guardadas.");
        return config;
      }
      const id = await clack.select({
        message: "Ciudad default",
        options: config.cities.map((city) => ({ value: city.id, label: cityLabel(city) })),
      });
      if (clack.isCancel(id)) throw new Cancelado();
      const siguiente = setDefaultCity(config, id);
      await saveConfig(siguiente);
      clack.log.success(`Ciudad default: ${cityLabel(getCity(siguiente, id)!)}`);
      return siguiente;
    }

    case "8": {
      const nueva: Unit = config.unit === "celsius" ? "fahrenheit" : "celsius";
      const confirmar = await clack.confirm({
        message: `Cambiar la unidad de temperatura a ${unitLabel(nueva)}?`,
      });
      if (clack.isCancel(confirmar)) throw new Cancelado();
      if (!confirmar) return config;
      const siguiente = { ...config, unit: nueva };
      await saveConfig(siguiente);
      clack.log.success(`Unidad de temperatura: ${unitLabel(nueva)}`);
      return siguiente;
    }

    default:
      return config;
  }
}

async function main(): Promise<void> {
  let config = await loadConfig();
  printBanner();

  const def = getDefaultCity(config);
  console.log(
    `  ${def ? `Default: ${cityLabel(def)}` : "Sin ciudad default"} · Unidad: ${unitLabel(config.unit)}\n`,
  );

  let salir = false;
  while (!salir) {
    const opcion = await clack.select({
      message: "Selecciona una opción",
      options: [
        { value: "1", label: "1. Clima de ciudad default" },
        { value: "2", label: `2. Clima de todas las ciudades (${config.cities.length})` },
        { value: "3", label: "3. Buscar y agregar ciudad" },
        { value: "4", label: "4. Eliminar ciudad" },
        { value: "5", label: "5. Establecer ciudad default" },
        { value: "8", label: `8. Ajustes (${unitLabel(config.unit)})` },
        { value: "9", label: "9. Salir" },
      ],
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

main();
