import { describe, expect, it } from "bun:test";
import {
  cityLabel,
  formatForecast,
  formatWeather,
  formatWeatherDate,
  unitLabel,
  weatherDescription,
  weatherEmoji,
} from "../../src/utils/format.ts";
import { makeCityInput, makeForecastDay, makeWeather } from "../helpers/fixtures.ts";

const city = makeCityInput();
const ANSI = "\u001b[";

describe("weatherDescription / weatherEmoji", () => {
  it("describe códigos WMO conocidos", () => {
    expect(weatherDescription(0)).toBe("Despejado");
    expect(weatherDescription(3)).toBe("Nublado");
    expect(weatherDescription(95)).toBe("Tormenta eléctrica");
    expect(weatherEmoji(0)).toBe("☀️");
    expect(weatherEmoji(3)).toBe("☁️");
  });

  it("usa la condición desconocida para códigos no mapeados", () => {
    expect(weatherDescription(999)).toBe("Condición desconocida");
    expect(weatherEmoji(999)).toBe("❓");
  });
});

describe("unitLabel", () => {
  it("etiqueta cada unidad soportada", () => {
    expect(unitLabel("celsius")).toBe("°C");
    expect(unitLabel("fahrenheit")).toBe("°F");
  });
});

describe("cityLabel", () => {
  it("incluye provincia y país cuando están presentes", () => {
    expect(cityLabel({ name: "Ottawa", admin1: "Ontario", country: "Canadá", latitude: 0, longitude: 0 })).toBe(
      "Ottawa, Ontario (Canadá)",
    );
  });

  it("omite la provincia cuando falta", () => {
    expect(cityLabel(makeCityInput({ admin1: undefined }))).toBe("Ottawa (Canadá)");
  });

  it("devuelve solo el nombre sin datos extra", () => {
    expect(cityLabel(makeCityInput({ admin1: undefined, country: undefined }))).toBe("Ottawa");
  });
});

describe("formatWeatherDate", () => {
  it("formatea una fecha ISO al estilo local", () => {
    const formatted = formatWeatherDate("2026-11-04");

    expect(formatted).toMatch(/^[A-ZÁÉÍÓÚÑ].* 04 nov$/);
  });

  it("devuelve la entrada tal cual si la fecha es inválida", () => {
    expect(formatWeatherDate("no-es-fecha")).toBe("no-es-fecha");
  });
});

describe("formatWeather", () => {
  const output = formatWeather(city, makeWeather(), "celsius");

  it("arma el bloque con ciudad, condición, temperaturas y viento", () => {
    const lines = output.split("\n");

    expect(lines[0]).toBe("Ottawa, Ontario (Canadá)");
    expect(lines[1]).toBe("─".repeat(40));
    expect(lines[2]).toBe("☁️ Nublado");
    expect(lines[3]).toBe("🌡️ Temperatura: 12,5 °C (sensación 11,2 °C)");
    expect(lines[4]).toBe("💨 Viento: 14 km/h");
  });

  it("no incluye secuencias ANSI sin TTY", () => {
    expect(output).not.toContain(ANSI);
  });

  it("usa la unidad configurada", () => {
    const fahrenheit = formatWeather(city, makeWeather(), "fahrenheit");

    expect(fahrenheit).toContain("12,5 °F");
    expect(fahrenheit).toContain("sensación 11,2 °F");
  });
});

describe("formatForecast", () => {
  const days = [
    makeForecastDay({ date: "2026-11-04" }),
    makeForecastDay({ date: "2026-11-05", weatherCode: 0, tempMax: 19.4, tempMin: 8.1, precipitationProbability: null }),
  ];

  it("encabeza con la ciudad, la cantidad de días y la unidad", () => {
    const lines = formatForecast(city, days, "celsius").split("\n");

    expect(lines[0]).toBe("Ottawa, Ontario (Canadá)");
    expect(lines[2]).toBe("Pronóstico 7 días · °C");
  });

  it("singulariza el encabezado cuando hay un solo día", () => {
    const output = formatForecast(city, [makeForecastDay()], "fahrenheit");

    expect(output).toContain("Pronóstico 1 día · °F");
  });

  it("alinea cada día con su fecha formateada y sus temperaturas", () => {
    const lines = formatForecast(city, days, "celsius").split("\n");
    const firstDay = lines[3];

    expect(firstDay?.startsWith(formatWeatherDate("2026-11-04").padEnd(11))).toBe(true);
    expect(firstDay).toContain("☁️ Nublado");
    expect(firstDay).toContain("18,4° / 7,1°");
    expect(firstDay).toContain("°C");
    expect(firstDay).toContain("💧 40%");
  });

  it("omite la línea de precipitación cuando la API no la informa", () => {
    const lines = formatForecast(city, days, "celsius").split("\n");
    const secondDay = lines[4];

    expect(secondDay).toContain("☀️ Despejado");
    expect(secondDay).not.toContain("💧");
  });

  it("no incluye secuencias ANSI sin TTY", () => {
    expect(formatForecast(city, days, "celsius")).not.toContain(ANSI);
  });
});
