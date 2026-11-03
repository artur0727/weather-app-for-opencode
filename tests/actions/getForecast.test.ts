import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { getForecast } from "../../src/actions/getForecast.ts";
import { Cancelado } from "../../src/presentation/input.ts";
import { captureConsole } from "../helpers/actions.ts";
import {
  jsonResponse,
  makeDailyPayload,
  restoreFetch,
  stubFetch,
  toUrl,
} from "../helpers/api.ts";
import {
  CANCEL,
  clack,
  queueSelect,
  resetClack,
  selectPrompts,
  spinners,
} from "../helpers/clack.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

let capture: ReturnType<typeof captureConsole> | undefined;

beforeEach(() => {
  resetClack();
  capture = captureConsole();
});

afterEach(() => {
  capture?.restore();
  restoreFetch();
});

const cities = [
  makeCity({ id: "ottawa" }),
  makeCity({
    id: "madrid",
    name: "Madrid",
    country: "España",
    admin1: undefined,
    latitude: 40.4165,
    longitude: -3.7026,
  }),
];

describe("getForecast", () => {
  it("avisa y no consulta la API cuando no hay ciudades guardadas", async () => {
    const calls: URL[] = [];
    stubFetch(async (input) => {
      calls.push(toUrl(input));
      return jsonResponse(makeDailyPayload(7));
    });

    const config = makeConfig();
    const next = await getForecast(config);

    expect(next).toBe(config);
    expect(clack.log.warn.mock.calls[0]?.[0]).toBe("No hay ciudades guardadas.");
    expect(calls).toHaveLength(0);
  });

  it("usa la única ciudad guardada sin abrir el selector", async () => {
    const calls: URL[] = [];
    stubFetch(async (input) => {
      calls.push(toUrl(input));
      return jsonResponse(makeDailyPayload(7));
    });

    const config = makeConfig({ cities: [makeCity()] });
    const next = await getForecast(config);

    expect(next).toBe(config);
    expect(selectPrompts).toHaveLength(0);
    expect(calls[0]?.searchParams.get("forecast_days")).toBe("7");
    expect(calls[0]?.searchParams.get("temperature_unit")).toBe("celsius");
    expect(spinners[0]?.start.mock.calls[0]?.[0]).toBe(
      "Consultando el pronóstico de Ottawa…",
    );
    expect(capture?.logs.join("\n")).toContain("Pronóstico 7 días · °C");
  });

  it("preselecciona la default y consulta la ciudad elegida", async () => {
    stubFetch(async () => jsonResponse(makeDailyPayload(7)));
    queueSelect("madrid");

    const config = makeConfig({
      cities,
      defaultCityId: "ottawa",
      unit: "fahrenheit",
    });
    const next = await getForecast(config);

    expect(next).toBe(config);
    expect(selectPrompts[0]?.message).toBe("Ciudad para el pronóstico");
    expect(selectPrompts[0]?.initialValue).toBe("ottawa");
    expect(selectPrompts[0]?.options.map((option) => option.value)).toEqual([
      "ottawa",
      "madrid",
    ]);
    const output = capture?.logs.join("\n") ?? "";
    expect(output).toContain("Madrid (España)");
    expect(output).toContain("· °F");
  });

  it("avisa cuando el id default guardado ya no existe", async () => {
    const calls: URL[] = [];
    stubFetch(async (input) => {
      calls.push(toUrl(input));
      return jsonResponse(makeDailyPayload(7));
    });

    const config = makeConfig({
      cities: [makeCity()],
      defaultCityId: "fantasma",
    });
    const next = await getForecast(config);

    expect(next).toBe(config);
    expect(clack.log.warn.mock.calls[0]?.[0]).toBe(
      "No hay ciudad default. Establece una primero (opción 5).",
    );
    expect(calls).toHaveLength(0);
  });

  it("propaga la cancelación del selector de ciudad", async () => {
    queueSelect(CANCEL);

    const config = makeConfig({ cities, defaultCityId: "ottawa" });

    await expect(getForecast(config)).rejects.toBeInstanceOf(Cancelado);
  });
});
