import type { CityInput } from "../types/City.ts";
import type { Unit } from "../types/Unit.ts";
import type { ForecastDay, WeatherInfo } from "../types/Weather.ts";
import { cyanBold, dim, yellow } from "./colors.ts";
import { UNKNOWN_WEATHER, WEATHER_CODES } from "./constants.ts";

export function weatherDescription(code: number): string {
  return (WEATHER_CODES[code] ?? UNKNOWN_WEATHER).text;
}

export function weatherEmoji(code: number): string {
  return (WEATHER_CODES[code] ?? UNKNOWN_WEATHER).emoji;
}

/** Rótulo de la unidad, p. ej. "°C". */
export function unitLabel(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
}

/** Etiqueta para listados, p. ej. "Ottawa, Ontario (Canadá)". */
export function cityLabel(city: CityInput): string {
  let label = city.admin1 ? `${city.name}, ${city.admin1}` : city.name;
  if (city.country) label += ` (${city.country})`;
  return label;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es", { maximumFractionDigits: 1 }).format(value);
}

const DATE_FMT = new Intl.DateTimeFormat("es", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

function capitalizeFirst(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
}

/** Convierte una fecha ISO "YYYY-MM-DD" en "mié 04 nov" (mediodía evita corrimientos de zona). */
export function formatWeatherDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? iso : capitalizeFirst(DATE_FMT.format(date));
}

/** Etiqueta de temperatura en la unidad configurada, resaltada en amarillo. */
function formatTemp(value: number, unitText: string): string {
  return yellow(`${formatNumber(value)} ${unitText}`);
}

/** Formatea el clima actual de una ciudad como bloque multilínea. */
export function formatWeather(city: CityInput, weather: WeatherInfo, unit: Unit): string {
  const unitText = unitLabel(unit);
  return [
    cyanBold(cityLabel(city)),
    dim("─".repeat(40)),
    `${weatherEmoji(weather.weatherCode)} ${weatherDescription(weather.weatherCode)}`,
    `🌡️ Temperatura: ${formatTemp(weather.temperature, unitText)} (sensación ${formatTemp(
      weather.apparentTemperature,
      unitText,
    )})`,
    `💨 Viento: ${dim(`${formatNumber(weather.windSpeed)} km/h`)}`,
  ].join("\n");
}

/** Formatea el pronóstico extendido (7 días) de una ciudad como bloque multilínea. */
export function formatForecast(city: CityInput, days: ForecastDay[], unit: Unit): string {
  const unitText = unitLabel(unit);
  const lines: string[] = [
    cyanBold(cityLabel(city)),
    dim("─".repeat(40)),
    `${days.length === 1 ? "Pronóstico 1 día" : "Pronóstico 7 días"} · ${unitText}`,
  ];
  for (const day of days) {
    const date = formatWeatherDate(day.date).padEnd(11);
    const condition = `${weatherEmoji(day.weatherCode)} ${weatherDescription(day.weatherCode)}`;
    const temps = `${formatNumber(day.tempMax)}° / ${formatNumber(day.tempMin)}°`;
    const rain =
      day.precipitationProbability === null
        ? ""
        : `  ${dim(`💧 ${formatNumber(day.precipitationProbability)}%`)}`;
    lines.push(`${date}${condition}  ${yellow(temps)} ${dim(unitText)}${rain}`);
  }
  return lines.join("\n");
}
