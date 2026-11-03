import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  printBanner,
  printCityList,
  printForecast,
  printHeader,
  printWeather,
  printWeatherFailure,
  showError,
  showGoodbye,
  showInfo,
  showSuccess,
  showWarning,
} from "../../src/presentation/output.ts";
import { clack, resetClack } from "../helpers/clack.ts";
import { makeCity, makeCityInput, makeForecastDay, makeWeather } from "../helpers/fixtures.ts";

const originalLog = console.log;
let logs: string[] = [];

beforeEach(() => {
  logs = [];
  console.log = (...args: unknown[]) => {
    logs.push(args.map((arg) => String(arg)).join(" "));
  };
  resetClack();
});

afterEach(() => {
  console.log = originalLog;
});

const city = makeCityInput();

describe("printBanner / printHeader", () => {
  it("imprime el banner del README", () => {
    printBanner();

    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain("═".repeat(40));
    expect(logs[0]).toContain("WEATHER CLI");
  });

  it("muestra la ciudad default y la unidad activa", () => {
    printHeader(makeCity(), "celsius");

    expect(logs[0]).toContain("Default: Ottawa, Ontario (Canadá)");
    expect(logs[0]).toContain("Unidad: °C");
  });

  it("avisa cuando todavía no hay ciudad default", () => {
    printHeader(undefined, "fahrenheit");

    expect(logs[0]).toContain("Sin ciudad default");
    expect(logs[0]).toContain("Unidad: °F");
  });
});

describe("printWeather / printForecast", () => {
  it("imprime el bloque de clima y deja una línea en blanco", () => {
    printWeather(city, makeWeather(), "celsius");

    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain("Ottawa, Ontario (Canadá)");
    expect(logs[0]).toContain("🌡️ Temperatura: 12,5 °C");
    expect(logs[1]).toBe("");
  });

  it("imprime el bloque de pronóstico con la unidad indicada", () => {
    printForecast(city, [makeForecastDay()], "fahrenheit");

    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain("Pronóstico 1 día · °F");
    expect(logs[0]).toContain("18,4° / 7,1°");
    expect(logs[1]).toBe("");
  });

  it("informa el fallo de una ciudad puntual", () => {
    printWeatherFailure(city);

    expect(logs[0]).toContain("Ottawa, Ontario (Canadá)");
    expect(logs[0]).toContain("No se pudo consultar el clima.");
    expect(logs[1]).toBe("");
  });
});

describe("printCityList", () => {
  it("lista las ciudades y marca la default", () => {
    const cities = [
      makeCity({ id: "ottawa" }),
      makeCity({ id: "madrid", name: "Madrid", admin1: undefined, country: "España" }),
    ];

    printCityList(cities, "ottawa");

    expect(logs[0]).toBe("Ciudades guardadas (2)");
    expect(logs[1]).toBe("  Ottawa, Ontario (Canadá) (default)");
    expect(logs[2]).toBe("  Madrid (España)");
    expect(logs[3]).toBe("");
  });

  it("muestra el encabezado en cero cuando no hay ciudades", () => {
    printCityList([], null);

    expect(logs).toEqual(["Ciudades guardadas (0)", ""]);
  });
});

describe("mensajes de clack", () => {
  it("delega éxito, aviso, info y error a clack.log", () => {
    showSuccess("Guardado");
    showWarning("Cuidado");
    showInfo("Dato");
    showError("Falló");

    expect(clack.log.success.mock.calls[0]?.[0]).toBe("Guardado");
    expect(clack.log.warn.mock.calls[0]?.[0]).toBe("Cuidado");
    expect(clack.log.info.mock.calls[0]?.[0]).toBe("Dato");
    expect(clack.log.error.mock.calls[0]?.[0]).toBe("Falló");
  });

  it("se despide con clack.outro", () => {
    showGoodbye();

    expect(clack.outro.mock.calls[0]?.[0]).toBe("¡Hasta luego!");
  });
});
