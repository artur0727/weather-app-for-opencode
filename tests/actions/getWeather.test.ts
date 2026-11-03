import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { getAllWeather, getDefaultWeather } from "../../src/actions/getWeather.ts";
import { captureConsole } from "../helpers/actions.ts";
import { jsonResponse, restoreFetch, stubFetch, toUrl } from "../helpers/api.ts";
import { clack, resetClack, spinners } from "../helpers/clack.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

const payload = {
  current: {
    temperature_2m: 12.5,
    apparent_temperature: 11.2,
    weather_code: 3,
    wind_speed_10m: 14,
  },
};

let capture: ReturnType<typeof captureConsole> | undefined;

beforeEach(() => {
  resetClack();
  capture = captureConsole();
});

afterEach(() => {
  capture?.restore();
  restoreFetch();
});

describe("getDefaultWeather", () => {
  it("avisa y no consulta la API cuando no hay ciudad default", async () => {
    const calls: URL[] = [];
    stubFetch(async (input) => {
      calls.push(toUrl(input));
      return jsonResponse(payload);
    });

    const config = makeConfig({ cities: [makeCity()] });
    const next = await getDefaultWeather(config);

    expect(next).toBe(config);
    expect(clack.log.warn.mock.calls[0]?.[0]).toBe(
      "No hay ciudad default. Busca y agrega una ciudad primero (opción 3).",
    );
    expect(calls).toHaveLength(0);
    expect(spinners).toHaveLength(0);
  });

  it("consulta el clima de la ciudad default en la unidad configurada", async () => {
    const calls: URL[] = [];
    stubFetch(async (input) => {
      calls.push(toUrl(input));
      return jsonResponse(payload);
    });

    const config = makeConfig({
      cities: [makeCity()],
      defaultCityId: "ottawa",
      unit: "fahrenheit",
    });
    const next = await getDefaultWeather(config);

    expect(next).toBe(config);
    expect(calls[0]?.searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(calls[0]?.searchParams.get("current")).toBe(
      "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    );
    expect(spinners[0]?.start.mock.calls[0]?.[0]).toBe("Consultando el clima de Ottawa…");
    expect(capture?.logs.join("\n")).toContain("Ottawa, Ontario (Canadá)");
    expect(capture?.logs.join("\n")).toContain("12,5 °F");
  });
});

describe("getAllWeather", () => {
  it("avisa y no consulta la API cuando no hay ciudades guardadas", async () => {
    const calls: URL[] = [];
    stubFetch(async (input) => {
      calls.push(toUrl(input));
      return jsonResponse(payload);
    });

    const config = makeConfig();
    const next = await getAllWeather(config);

    expect(next).toBe(config);
    expect(clack.log.warn.mock.calls[0]?.[0]).toBe("No hay ciudades guardadas.");
    expect(calls).toHaveLength(0);
  });

  it("consulta todas las ciudades en paralelo y reporta las que fallan", async () => {
    const cities = [
      makeCity({ id: "ottawa", latitude: 45.41117, longitude: -75.69812 }),
      makeCity({
        id: "madrid",
        name: "Madrid",
        country: "España",
        admin1: undefined,
        latitude: 40.4165,
        longitude: -3.7026,
      }),
    ];
    const calls: URL[] = [];
    stubFetch(async (input) => {
      const url = toUrl(input);
      calls.push(url);
      return url.searchParams.get("latitude") === "40.4165"
        ? new Response("sin datos", { status: 503 })
        : jsonResponse(payload);
    });

    const config = makeConfig({ cities, defaultCityId: "ottawa" });
    const next = await getAllWeather(config);

    const output = capture?.logs.join("\n") ?? "";

    expect(next).toBe(config);
    expect(calls).toHaveLength(2);
    expect(spinners[0]?.start.mock.calls[0]?.[0]).toBe("Consultando 2 ciudades…");
    expect(output).toContain("Ottawa, Ontario (Canadá)");
    expect(output).toContain("Madrid (España) → No se pudo consultar el clima.");
    expect(clack.log.warn).not.toHaveBeenCalled();
  });
});
