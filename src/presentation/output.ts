import * as clack from "@clack/prompts";
import type { City, CityInput } from "../types/City.ts";
import type { Unit } from "../types/Unit.ts";
import type { ForecastDay, WeatherInfo } from "../types/Weather.ts";
import { cyanBold, green, red } from "../utils/colors.ts";
import { cityLabel, formatForecast, formatWeather, unitLabel } from "../utils/format.ts";

/** Banner literal del mockup del README. */
export function printBanner(): void {
  console.log(
    cyanBold(
      "════════════════════════════════════════\n" +
        "         WEATHER CLI\n" +
        "════════════════════════════════════════",
    ),
  );
}

/** Muestra la ciudad default y la unidad activa debajo del banner. */
export function printHeader(defaultCity: City | undefined, unit: Unit): void {
  console.log(
    `  ${defaultCity ? `Default: ${cityLabel(defaultCity)}` : "Sin ciudad default"} · Unidad: ${unitLabel(unit)}\n`,
  );
}

/** Imprime el bloque de clima actual y deja una línea en blanco. */
export function printWeather(city: CityInput, weather: WeatherInfo, unit: Unit): void {
  console.log(formatWeather(city, weather, unit));
  console.log();
}

/** Imprime el bloque de pronóstico y deja una línea en blanco. */
export function printForecast(city: CityInput, days: ForecastDay[], unit: Unit): void {
  console.log(formatForecast(city, days, unit));
  console.log();
}

/** Línea de error cuando falla la consulta de una ciudad concreta. */
export function printWeatherFailure(city: CityInput): void {
  console.log(`${cityLabel(city)} → ${red("No se pudo consultar el clima.")}`);
  console.log();
}

/** Lista las ciudades guardadas, marcando la default. */
export function printCityList(cities: readonly City[], defaultCityId: string | null): void {
  console.log(cyanBold(`Ciudades guardadas (${cities.length})`));
  for (const city of cities) {
    const marker = city.id === defaultCityId ? green(" (default)") : "";
    console.log(`  ${cityLabel(city)}${marker}`);
  }
  console.log();
}

export function showSuccess(message: string): void {
  clack.log.success(green(message));
}

export function showWarning(message: string): void {
  clack.log.warn(message);
}

export function showInfo(message: string): void {
  clack.log.info(message);
}

export function showError(message: string): void {
  clack.log.error(message);
}

export function showGoodbye(): void {
  clack.outro("¡Hasta luego!");
}
