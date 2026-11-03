import { describe, expect, expectTypeOf, it } from "bun:test";
import type { ForecastDay, WeatherInfo } from "../../src/types/Weather.ts";
import { makeForecastDay, makeWeather } from "../helpers/fixtures.ts";

describe("WeatherInfo", () => {
  it("representa el clima actual con temperatura, sensación, código y viento", () => {
    expectTypeOf<WeatherInfo>().toEqualTypeOf<{
      temperature: number;
      apparentTemperature: number;
      weatherCode: number;
      windSpeed: number;
    }>();

    const weather = makeWeather();

    expect(weather.temperature).toBe(12.5);
    expect(weather.apparentTemperature).toBe(11.2);
    expect(weather.weatherCode).toBe(3);
    expect(weather.windSpeed).toBe(14);
  });
});

describe("ForecastDay", () => {
  it("permite precipitación desconocida como null", () => {
    expectTypeOf<ForecastDay["precipitationProbability"]>().toEqualTypeOf<number | null>();

    const withRain = makeForecastDay();
    const withoutRain = makeForecastDay({ precipitationProbability: null });

    expect(withRain.precipitationProbability).toBe(40);
    expect(withoutRain.precipitationProbability).toBeNull();
  });

  it("guarda la fecha ISO, el código WMO y las temperaturas del día", () => {
    const day = makeForecastDay();

    expect(day.date).toBe("2026-11-04");
    expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(day.tempMax).toBe(18.4);
    expect(day.tempMin).toBe(7.1);
  });
});
