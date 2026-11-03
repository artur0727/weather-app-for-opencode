import { describe, expect, it } from "bun:test";
import {
  CONFIG_DIR_NAME,
  CONFIG_FILE_NAME,
  DEFAULT_UNIT,
  FORECAST_DAYS,
  FORECAST_URL,
  GEOCODING_RESULT_LIMIT,
  GEOCODING_URL,
  MENU_EXIT_VALUE,
  REQUEST_TIMEOUT_MS,
  UNKNOWN_WEATHER,
  WEATHER_CODES,
} from "../../src/utils/constants.ts";

describe("endpoints y límites", () => {
  it("usa endpoints HTTPS de Open-Meteo", () => {
    const geocoding = new URL(GEOCODING_URL);
    const forecast = new URL(FORECAST_URL);

    expect(geocoding.protocol).toBe("https:");
    expect(geocoding.pathname).toBe("/v1/search");
    expect(forecast.protocol).toBe("https:");
    expect(forecast.pathname).toBe("/v1/forecast");
  });

  it("define el timeout, el límite de resultados y los días de pronóstico", () => {
    expect(REQUEST_TIMEOUT_MS).toBe(10_000);
    expect(GEOCODING_RESULT_LIMIT).toBe(5);
    expect(FORECAST_DAYS).toBe(7);
  });
});

describe("configuración persistente", () => {
  it("guarda el config en ~/.weather-cli/config.json", () => {
    expect(CONFIG_DIR_NAME).toBe(".weather-cli");
    expect(CONFIG_FILE_NAME).toBe("config.json");
  });

  it("usa celsius y la opción 9 como valores por defecto", () => {
    expect(DEFAULT_UNIT).toBe("celsius");
    expect(MENU_EXIT_VALUE).toBe("9");
  });
});

describe("WEATHER_CODES", () => {
  const entries = Object.entries(WEATHER_CODES);

  it("mapea todos los códigos WMO con texto y emoji", () => {
    expect(entries).toHaveLength(28);

    for (const [code, info] of entries) {
      expect(Number.isInteger(Number(code))).toBe(true);
      expect(info.text.length).toBeGreaterThan(0);
      expect(info.emoji.length).toBeGreaterThan(0);
    }
  });

  it("incluye las condiciones más comunes", () => {
    expect(WEATHER_CODES[0]).toEqual({ text: "Despejado", emoji: "☀️" });
    expect(WEATHER_CODES[3]).toEqual({ text: "Nublado", emoji: "☁️" });
    expect(WEATHER_CODES[95]).toEqual({ text: "Tormenta eléctrica", emoji: "⛈️" });
  });

  it("define una condición de reemplazo distinta para códigos desconocidos", () => {
    expect(UNKNOWN_WEATHER.text).toBe("Condición desconocida");
    expect(UNKNOWN_WEATHER.emoji).not.toBe("");
    expect(entries.some(([, info]) => info.text === UNKNOWN_WEATHER.text)).toBe(false);
  });
});
