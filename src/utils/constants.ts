import type { Unit } from "../types/Unit.ts";

/** Endpoint de búsqueda de ciudades de Open-Meteo. */
export const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/** Endpoint de clima actual y pronóstico de Open-Meteo. */
export const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/** Tiempo máximo de espera por respuesta de la API. */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Cantidad máxima de resultados que se piden al geocoding. */
export const GEOCODING_RESULT_LIMIT = 5;

/** Días que cubre el pronóstico extendido. */
export const FORECAST_DAYS = 7;

/** Carpeta dentro del home del usuario donde vive la configuración. */
export const CONFIG_DIR_NAME = ".weather-cli";

/** Nombre del archivo de configuración persistente. */
export const CONFIG_FILE_NAME = "config.json";

/** Unidad de temperatura usada cuando no hay preferencia guardada. */
export const DEFAULT_UNIT: Unit = "celsius";

/** Valor del menú que cierra la aplicación. */
export const MENU_EXIT_VALUE = "9";

export interface WeatherCodeInfo {
  text: string;
  emoji: string;
}

/** Códigos WMO que devuelve Open-Meteo, con descripción y emoji. */
export const WEATHER_CODES: Readonly<Record<number, WeatherCodeInfo>> = {
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

/** Condición usada cuando el código WMO es desconocido. */
export const UNKNOWN_WEATHER: WeatherCodeInfo = {
  text: "Condición desconocida",
  emoji: "❓",
};
