import type { City, Unit, WeatherInfo } from "./types.ts";

/** Lanzada cuando el usuario cancela un prompt; se tolera volver al menú sin error. */
export class Cancelado extends Error {
  constructor() {
    super("Cancelado por el usuario");
    this.name = "Cancelado";
  }
}

/** Banner literal del mockup del README. */
export function printBanner(): void {
  console.log(
    "════════════════════════════════════════\n" +
      "         WEATHER CLI\n" +
      "════════════════════════════════════════",
  );
}

/** Códigos WMO que devuelve Open-Meteo, con descripción y emoji. */
const WEATHER_CODES: Record<number, { text: string; emoji: string }> = {
  0: { text: "Despejado", emoji: "☀️" },
  1: { text: "Mayormente despejado", emoji: "🌤️" },
  2: { text: "Parcialmente nublado", emoji: "⛅" },
  3: { text: "Nublado", emoji: "☁️" },
  45: { text: "Niebla", emoji: "🌫️" },
  48: { text: "Niebla con escarcha", emoji: "🌫️" },
  51: { text: "Llovizna ligera", emoji: "🌦️" },
  53: { text: "Llovizna moderada", emoji: "🌦️" },
  55: { text: "Llovizna intensa", emoji: "🌦️" },
  56: { text: "Llovizna helada ligera", emoji: "🌧️" },
  57: { text: "Llovizna helada intensa", emoji: "🌧️" },
  61: { text: "Lluvia ligera", emoji: "🌧️" },
  63: { text: "Lluvia moderada", emoji: "🌧️" },
  65: { text: "Lluvia intensa", emoji: "🌧️" },
  66: { text: "Lluvia helada ligera", emoji: "🌧️" },
  67: { text: "Lluvia helada intensa", emoji: "🌧️" },
  71: { text: "Nieve ligera", emoji: "🌨️" },
  73: { text: "Nieve moderada", emoji: "🌨️" },
  75: { text: "Nieve intensa", emoji: "❄️" },
  77: { text: "Ciniza", emoji: "❄️" },
  80: { text: "Chubascos ligeros", emoji: "🌦️" },
  81: { text: "Chubascos moderados", emoji: "🌦️" },
  82: { text: "Chubascos violentos", emoji: "⛈️" },
  85: { text: "Chubascos de nieve ligeros", emoji: "🌨️" },
  86: { text: "Chubascos de nieve fuertes", emoji: "❄️" },
  95: { text: "Tormenta eléctrica", emoji: "⛈️" },
  96: { text: "Tormenta con granizo", emoji: "⛈️" },
  99: { text: "Tormenta fuerte con granizo", emoji: "⛈️" },
};

const FALLBACK = { text: "Condición desconocida", emoji: "❓" };

export function weatherDescription(code: number): string {
  return (WEATHER_CODES[code] ?? FALLBACK).text;
}

export function weatherEmoji(code: number): string {
  return (WEATHER_CODES[code] ?? FALLBACK).emoji;
}

/** Rótulo de la unidad, p. ej. "°C". */
export function unitLabel(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
}

/** Etiqueta para listados, p. ej. "Ottawa, Ontario (Canadá)". */
export function cityLabel(city: Omit<City, "id">): string {
  let label = city.admin1 ? `${city.name}, ${city.admin1}` : city.name;
  if (city.country) label += ` (${city.country})`;
  return label;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es", { maximumFractionDigits: 1 }).format(value);
}

/** Formatea el clima actual de una ciudad como bloque multilínea. */
export function formatWeather(city: Omit<City, "id">, weather: WeatherInfo, unit: Unit): string {
  const unitTxt = unitLabel(unit);
  return [
    `${cityLabel(city)}`,
    "─".repeat(40),
    `${weatherEmoji(weather.weatherCode)} ${weatherDescription(weather.weatherCode)}`,
    `🌡️ Temperatura: ${formatNumber(weather.temperature)} ${unitTxt} (sensación ${formatNumber(weather.apparentTemperature)} ${unitTxt})`,
    `💨 Viento: ${formatNumber(weather.windSpeed)} km/h`,
  ].join("\n");
}
