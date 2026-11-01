import type { City, GeoResult, Unit, WeatherInfo } from "./types.ts";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 10_000;

/** Error de la capa de red/API con mensaje listo para mostrar al usuario. */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchJson<T>(url: URL): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new ApiError("La consulta tardó demasiado. Verifica tu conexión a internet.");
    }
    throw new ApiError("Error de red. Verifica tu conexión a internet.");
  }
  if (!response.ok) {
    throw new ApiError(`El servicio de Open-Meteo respondió con error (HTTP ${response.status}).`);
  }
  return (await response.json()) as T;
}

interface GeocodingResponse {
  results?: GeoResult[];
}

interface ForecastResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
}

/** Busca ciudades por nombre en el servicio de geocoding. */
export async function searchCity(query: string): Promise<GeoResult[]> {
  const url = new URL(GEO_URL);
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");
  const data = await fetchJson<GeocodingResponse>(url);
  return data.results ?? [];
}

/** Consulta el clima actual de una ciudad, en la unidad indicada. */
export async function getCurrentWeather(city: City, unit: Unit): Promise<WeatherInfo> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", unit);
  const data = await fetchJson<ForecastResponse>(url);
  const current = data.current;
  if (!current || typeof current.temperature_2m !== "number") {
    throw new ApiError(`No se pudo obtener el clima de ${city.name}.`);
  }
  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature ?? current.temperature_2m,
    weatherCode: current.weather_code ?? -1,
    windSpeed: current.wind_speed_10m ?? 0,
  };
}
