import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { City, CityInput } from "../../src/types/City.ts";
import type { Config } from "../../src/types/Config.ts";
import type { ForecastDay, WeatherInfo } from "../../src/types/Weather.ts";

const OTTAWA: CityInput = {
  name: "Ottawa",
  country: "Canadá",
  admin1: "Ontario",
  latitude: 45.41117,
  longitude: -75.69812,
};

export function makeCityInput(overrides: Partial<CityInput> = {}): CityInput {
  return { ...OTTAWA, ...overrides };
}

export function makeCity(overrides: Partial<City> = {}): City {
  return { id: "ottawa", ...OTTAWA, ...overrides };
}

export function makeConfig(overrides: Partial<Config> = {}): Config {
  return { defaultCityId: null, unit: "celsius", cities: [], ...overrides };
}

export function makeWeather(overrides: Partial<WeatherInfo> = {}): WeatherInfo {
  return { temperature: 12.5, apparentTemperature: 11.2, weatherCode: 3, windSpeed: 14, ...overrides };
}

export function makeForecastDay(overrides: Partial<ForecastDay> = {}): ForecastDay {
  return {
    date: "2026-11-04",
    weatherCode: 3,
    tempMax: 18.4,
    tempMin: 7.1,
    precipitationProbability: 40,
    ...overrides,
  };
}

const tempDirs: string[] = [];

/** Carpeta temporal única por test, para no tocar la config real del usuario. */
export async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "weather-cli-test-"));
  tempDirs.push(dir);
  return dir;
}

/** Borra todas las carpetas temporales creadas por el test en curso. */
export async function cleanupTempDirs(): Promise<void> {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
}
