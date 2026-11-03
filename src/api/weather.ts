import type { City } from "../types/City.ts";
import type { Unit } from "../types/Unit.ts";
import type { ForecastDay, WeatherInfo } from "../types/Weather.ts";
import { FORECAST_DAYS, FORECAST_URL } from "../utils/constants.ts";
import { ApiError, fetchJson } from "./client.ts";

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
export async function getDailyForecast(
  city: City,
  unit: Unit,
  days = FORECAST_DAYS,
): Promise<ForecastDay[]> {
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
  const forecast = daily.time
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
  if (forecast.length === 0) {
    throw new ApiError(`No se pudo obtener el pronóstico de ${city.name}.`);
  }
  return forecast;
}
