import type { City, ForecastDay, GeoResult, Unit, WeatherInfo } from "./types.ts";

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
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
    precipitation_probability_max?: (number | null)[];
  };
}

/** Parámetros comunes del endpoint de forecast: ubicación, zona y unidad de temperatura. */
function forecastUrl(city: City, unit: Unit): URL {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", unit);
  return url;
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
  const url = forecastUrl(city, unit);
  url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
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

/** Consulta el pronóstico extendido para los próximos `days` días (default 7). */
export async function getDailyForecast(city: City, unit: Unit, days = 7): Promise<ForecastDay[]> {
  const url = forecastUrl(city, unit);
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
  );
  url.searchParams.set("forecast_days", String(days));
  const data = await fetchJson<ForecastResponse>(url);
  const daily = data.daily;
  if (
    !daily ||
    !Array.isArray(daily.time) ||
    !Array.isArray(daily.temperature_2m_max) ||
    !Array.isArray(daily.temperature_2m_min)
  ) {
    throw new ApiError(`No se pudo obtener el pronóstico de ${city.name}.`);
  }
  // Solo días con datos completos; la API no suele recortar, pero evita columnas desalineadas.
  const dias = daily.time
    .map((date, i) => {
      const tempMax = daily.temperature_2m_max?.[i];
      const tempMin = daily.temperature_2m_min?.[i];
      if (tempMax === undefined || tempMin === undefined) return null;
      return {
        date,
        weatherCode: daily.weather_code?.[i] ?? -1,
        tempMax,
        tempMin,
        precipitationProbability: daily.precipitation_probability_max?.[i] ?? null,
      };
    })
    .filter((day): day is ForecastDay => day !== null);
  if (dias.length === 0) {
    throw new ApiError(`No se pudo obtener el pronóstico de ${city.name}.`);
  }
  return dias;
}
