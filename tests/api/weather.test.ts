import { afterEach, describe, expect, it } from "bun:test";
import { ApiError } from "../../src/api/client.ts";
import { getCurrentWeather, getDailyForecast } from "../../src/api/weather.ts";
import { makeCity } from "../helpers/fixtures.ts";
import {
  jsonResponse,
  makeDailyPayload,
  makeExpectedDay,
  restoreFetch,
  stubFetch,
  toUrl,
} from "../helpers/api.ts";

afterEach(() => {
  restoreFetch();
});

const city = makeCity({ latitude: 45.41117, longitude: -75.69812 });

const currentPayload = {
  current: {
    temperature_2m: 12.5,
    apparent_temperature: 11.2,
    weather_code: 3,
    wind_speed_10m: 14,
  },
};

describe("getCurrentWeather", () => {
  it("consulta el endpoint de forecast con ubicación, zona y unidad", async () => {
    const calls: URL[] = [];
    stubFetch(async (input) => {
      calls.push(toUrl(input));
      return jsonResponse(currentPayload);
    });

    await getCurrentWeather(city, "fahrenheit");

    const requested = calls[0];
    expect(requested?.searchParams.get("latitude")).toBe("45.41117");
    expect(requested?.searchParams.get("longitude")).toBe("-75.69812");
    expect(requested?.searchParams.get("timezone")).toBe("auto");
    expect(requested?.searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(requested?.searchParams.get("current")).toBe(
      "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    );
  });

  it("mapea todos los campos del clima actual", async () => {
    stubFetch(async () => jsonResponse(currentPayload));

    await expect(getCurrentWeather(city, "celsius")).resolves.toEqual({
      temperature: 12.5,
      apparentTemperature: 11.2,
      weatherCode: 3,
      windSpeed: 14,
    });
  });

  it("usa fallbacks cuando faltan campos opcionales", async () => {
    stubFetch(async () => jsonResponse({ current: { temperature_2m: 20 } }));

    await expect(getCurrentWeather(city, "celsius")).resolves.toEqual({
      temperature: 20,
      apparentTemperature: 20,
      weatherCode: -1,
      windSpeed: 0,
    });
  });

  it("lanza ApiError si la respuesta no trae clima actual", async () => {
    stubFetch(async () => jsonResponse({}));

    await expect(getCurrentWeather(city, "celsius")).rejects.toBeInstanceOf(ApiError);
    await expect(getCurrentWeather(city, "celsius")).rejects.toThrow(
      "No se pudo obtener el clima de Ottawa.",
    );
  });

  it("lanza ApiError si la temperatura no es numérica", async () => {
    stubFetch(async () => jsonResponse({ current: { temperature_2m: "12" } }));

    await expect(getCurrentWeather(city, "celsius")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("getDailyForecast", () => {
  it("pide 7 días por defecto y los parámetros diarios esperados", async () => {
    const calls: URL[] = [];
    stubFetch(async (input) => {
      calls.push(toUrl(input));
      return jsonResponse(makeDailyPayload(7));
    });

    await getDailyForecast(city, "celsius");

    const requested = calls[0];
    expect(requested?.searchParams.get("daily")).toBe(
      "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
    );
    expect(requested?.searchParams.get("forecast_days")).toBe("7");
    expect(requested?.searchParams.get("temperature_unit")).toBe("celsius");
  });

  it("respeta la cantidad de días pedida", async () => {
    const calls: URL[] = [];
    stubFetch(async (input) => {
      calls.push(toUrl(input));
      return jsonResponse(makeDailyPayload(3));
    });

    const forecast = await getDailyForecast(city, "celsius", 3);

    expect(calls[0]?.searchParams.get("forecast_days")).toBe("3");
    expect(forecast).toHaveLength(3);
  });

  it("mapea los días y deja null la precipitación ausente", async () => {
    stubFetch(async () => jsonResponse(makeDailyPayload(3)));

    const forecast = await getDailyForecast(city, "celsius", 3);

    expect(forecast).toEqual([makeExpectedDay(0), makeExpectedDay(1), makeExpectedDay(2)]);
    expect(forecast[1]?.precipitationProbability).toBeNull();
  });

  it("descarta días con temperaturas incompletas", async () => {
    stubFetch(async () =>
      jsonResponse({
        daily: {
          time: ["2026-11-04", "2026-11-05", "2026-11-06"],
          temperature_2m_max: [18.4, 19.4],
          temperature_2m_min: [7.1, 8.1],
          weather_code: [3],
        },
      }),
    );

    const forecast = await getDailyForecast(city, "celsius");

    expect(forecast).toHaveLength(2);
    expect(forecast[1]?.date).toBe("2026-11-05");
    expect(forecast[1]?.weatherCode).toBe(-1);
    expect(forecast[1]?.precipitationProbability).toBeNull();
  });

  it("lanza ApiError si faltan arrays obligatorios", async () => {
    stubFetch(async () =>
      jsonResponse({ daily: { temperature_2m_max: [18.4], temperature_2m_min: [7.1] } }),
    );

    await expect(getDailyForecast(city, "celsius")).rejects.toBeInstanceOf(ApiError);
    await expect(getDailyForecast(city, "celsius")).rejects.toThrow(
      "No se pudo obtener el pronóstico de Ottawa.",
    );
  });

  it("lanza ApiError si no quedan días con datos", async () => {
    stubFetch(async () => jsonResponse({ daily: { time: [], temperature_2m_max: [], temperature_2m_min: [] } }));

    await expect(getDailyForecast(city, "celsius")).rejects.toBeInstanceOf(ApiError);
  });

  it("lanza ApiError si la respuesta no trae bloque diario", async () => {
    stubFetch(async () => jsonResponse({}));

    await expect(getDailyForecast(city, "celsius")).rejects.toBeInstanceOf(ApiError);
  });
});
