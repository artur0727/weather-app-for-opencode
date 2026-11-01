import * as clack from "@clack/prompts";
import { getCurrentWeather, getDailyForecast, searchCity } from "./api.ts";
import { green, red } from "./colors.ts";
import { withSpinner } from "./loading.ts";
import {
  addCity,
  cityIdFor,
  getCity,
  getDefaultCity,
  removeCity,
  saveConfig,
  setDefaultCity,
} from "./store.ts";
import { Cancelado, cityLabel, formatForecast, formatWeather, unitLabel } from "./ui.ts";
import type { Config, Unit } from "./types.ts";

/** Opción 3: busca por nombre y agrega la ciudad seleccionada a la configuración. */
export async function agregarCiudad(config: Config): Promise<Config> {
  const consulta = await clack.text({
    message: "Nombre de la ciudad",
    placeholder: "Ottawa",
    validate: (value) =>
      !value || value.trim().length === 0 ? "Escribe el nombre de una ciudad." : undefined,
  });
  if (clack.isCancel(consulta)) throw new Cancelado();

  const texto = consulta.trim();
  const resultados = await withSpinner(`Buscando "${texto}"…`, () => searchCity(texto));

  if (resultados.length === 0) {
    clack.log.warn(`No se encontró ninguna ciudad con "${texto}".`);
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
    clack.log.success(green(`${cityLabel(nueva)} agregada.`));
    if (!config.defaultCityId) clack.log.info("Establecida como ciudad default.");
  }
  return siguiente;
}

/** Opción 1: clima actual de la ciudad default. */
export async function consultarDefault(config: Config): Promise<Config> {
  const def = getDefaultCity(config);
  if (!def) {
    clack.log.warn("No hay ciudad default. Busca y agrega una ciudad primero (opción 3).");
    return config;
  }
  const clima = await withSpinner(`Consultando el clima de ${def.name}…`, () =>
    getCurrentWeather(def, config.unit),
  );
  console.log(formatWeather(def, clima, config.unit));
  console.log();
  return config;
}

/** Opción 2: clima actual de todas las ciudades guardadas, en paralelo. */
export async function consultarTodas(config: Config): Promise<Config> {
  if (config.cities.length === 0) {
    clack.log.warn("No hay ciudades guardadas.");
    return config;
  }
  const resultados = await withSpinner(`Consultando ${config.cities.length} ciudades…`, () =>
    Promise.allSettled(config.cities.map((city) => getCurrentWeather(city, config.unit))),
  );
  for (const [i, city] of config.cities.entries()) {
    const resultado = resultados[i]!;
    if (resultado.status === "fulfilled") {
      console.log(formatWeather(city, resultado.value, config.unit));
    } else {
      console.log(`${cityLabel(city)} → ${red("No se pudo consultar el clima.")}`);
    }
    console.log();
  }
  return config;
}

/** Opción 4: elegir y eliminar una ciudad guardada. */
export async function eliminarCiudad(config: Config): Promise<Config> {
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
  if (eliminada) clack.log.success(green(`Ciudad eliminada: ${cityLabel(eliminada)}`));
  return siguiente;
}

/** Opción 5: elegir la ciudad default. */
export async function cambiarDefault(config: Config): Promise<Config> {
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
  clack.log.success(green(`Ciudad default: ${cityLabel(getCity(siguiente, id)!)}`));
  return siguiente;
}

/** Opción 6: pronóstico de 7 días de la ciudad elegida (default preseleccionada). */
export async function pronostico7Dias(config: Config): Promise<Config> {
  if (config.cities.length === 0) {
    clack.log.warn("No hay ciudades guardadas.");
    return config;
  }
  let id = config.defaultCityId;
  if (config.cities.length > 1) {
    const elegido = await clack.select({
      message: "Ciudad para el pronóstico",
      initialValue: id ?? undefined,
      options: config.cities.map((city) => ({ value: city.id, label: cityLabel(city) })),
    });
    if (clack.isCancel(elegido)) throw new Cancelado();
    id = elegido;
  }
  const city = id ? getCity(config, id) : config.cities[0];
  if (!city) {
    clack.log.warn("No hay ciudad default. Establece una primero (opción 5).");
    return config;
  }
  const dias = await withSpinner(`Consultando el pronóstico de ${city.name}…`, () =>
    getDailyForecast(city, config.unit),
  );
  console.log(formatForecast(city, dias, config.unit));
  console.log();
  return config;
}

/** Opción 8: ajustes (unidad de temperatura). */
export async function ajustes(config: Config): Promise<Config> {
  const nueva: Unit = config.unit === "celsius" ? "fahrenheit" : "celsius";
  const confirmar = await clack.confirm({
    message: `Cambiar la unidad de temperatura a ${unitLabel(nueva)}?`,
  });
  if (clack.isCancel(confirmar)) throw new Cancelado();
  if (!confirmar) return config;
  const siguiente = { ...config, unit: nueva };
  await saveConfig(siguiente);
  clack.log.success(green(`Unidad de temperatura: ${unitLabel(nueva)}`));
  return siguiente;
}
